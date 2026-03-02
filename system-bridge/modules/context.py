import re
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass

from modules.bilingual_parser import parser
from modules.memory import memory_manager, ConversationEntry
from utils.logger import logger


@dataclass
class ContextState:
    """Current context state"""
    session_id: str = ""
    last_command: str = ""
    last_command_type: str = ""
    last_successful: bool = True
    conversation_count: int = 0
    active_topic: str = ""  # e.g., "file_management", "media", "system"
    user_mood: str = "neutral"  # happy, frustrated, neutral
    pending_action: Optional[Dict] = None
    context_variables: Dict = None  # Store temporary context

    def __post_init__(self):
        if self.context_variables is None:
            self.context_variables = {}


@dataclass
class IntentAnalysis:
    """Analysis of user intent"""
    primary_intent: str = ""  # e.g., "open_app", "search_file", "question"
    secondary_intents: List[str] = None
    entities: Dict[str, Any] = None  # Extracted entities
    confidence: float = 0.0
    requires_clarification: bool = False
    suggested_response: str = ""

    def __post_init__(self):
        if self.secondary_intents is None:
            self.secondary_intents = []
        if self.entities is None:
            self.entities = {}


class ContextManager:
    """Manage conversation context and intent recognition"""

    # Intent patterns for better understanding
    INTENT_PATTERNS = {
        'greeting': [
            r'\b(hello|hi|hey|namaste|namaskar|hola|greetings)\b',
            r'^(good morning|good afternoon|good evening|good night)'
        ],
        'farewell': [
            r'\b(bye|goodbye|see you|take care|alvida|phir milenge)\b',
            r'^(stop|exit|quit|band karo)'
        ],
        'gratitude': [
            r'\b(thank|thanks|shukriya|dhanyavad|thank you)\b'
        ],
        'question': [
            r'\b(what|who|where|when|why|how|kya|kaun|kahan|kab|kyu|kaise)\b',
            r'\?'
        ],
        'urgent': [
            r'\b(urgent|quick|fast|immediately|jaldi|turant)\b'
        ],
        'frustrated': [
            r'\b(not working|error|problem|issue|stupid|damn|hell|not again)\b'
        ],
        'follow_up': [
            r'\b(and|also|too|plus|aur|bhi|phir)\b'
        ]
    }

    # Context-aware response templates
    CONTEXT_RESPONSES = {
        'en': {
            'follow_up': 'Would you like me to do anything else?',
            'clarification': 'Could you please clarify what you mean?',
            'greeting_morning': 'Good morning! How can I help you today?',
            'greeting_afternoon': 'Good afternoon! What can I do for you?',
            'greeting_evening': 'Good evening! How may I assist you?',
            'remembered_fact': 'I remember you mentioned {fact}.',
            'context_aware': 'Based on our conversation, I think you want to {action}.',
        },
        'hi': {
            'follow_up': 'Kya main kuch aur kar sakta hoon?',
            'clarification': 'Kripaya spasht karein aap kya kehna chahte hain?',
            'greeting_morning': 'Shubh prabhat! Main aapki kya madad kar sakta hoon?',
            'greeting_afternoon': 'Namaste! Main aapke liye kya kar sakta hoon?',
            'greeting_evening': 'Shubh sandhya! Main kaise madad kar sakta hoon?',
            'remembered_fact': 'Mujhe yaad hai aapne kaha tha {fact}.',
            'context_aware': 'Hamari baat cheet ke aadhar par, mujhe lagta hai aap {action} karna chahte hain.',
        }}

    def __init__(self):
        self.current_context = ContextState()
        self.intent_history: List[IntentAnalysis] = []

    def update_context(self, user_input: str, command_type: str,
                       success: bool, session_id: str = "") -> None:
        """Update current context with new interaction"""
        self.current_context.last_command = user_input
        self.current_context.last_command_type = command_type
        self.current_context.last_successful = success
        self.current_context.conversation_count += 1

        if session_id:
            self.current_context.session_id = session_id

        # Update active topic based on command type
        topic_mapping = {
            'open_app': 'applications',
            'close_app': 'applications',
            'open_folder': 'file_management',
            'search_files': 'file_management',
            'ocr_image': 'media',
            'ocr_pdf': 'media',
            'take_screenshot': 'desktop',
            'shutdown': 'system',
            'restart': 'system',
        }

        if command_type in topic_mapping:
            self.current_context.active_topic = topic_mapping[command_type]

        # Detect user mood
        self.current_context.user_mood = self._detect_mood(user_input)

        logger.info(f"Context updated: topic={self.current_context.active_topic}, mood={self.current_context.user_mood}")

    def analyze_intent(
            self,
            user_input: str,
            language: str = 'en') -> IntentAnalysis:
        """Analyze user intent from input"""
        analysis = IntentAnalysis()
        user_input_lower = user_input.lower()

        # Detect primary intents
        detected_intents = []

        for intent, patterns in self.INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, user_input_lower, re.IGNORECASE):
                    detected_intents.append(intent)
                    break

        if detected_intents:
            analysis.primary_intent = detected_intents[0]
            analysis.secondary_intents = detected_intents[1:]
            analysis.confidence = min(0.5 + (len(detected_intents) * 0.1), 0.9)

        # Extract entities
        analysis.entities = self._extract_entities(user_input)

        # Check if clarification is needed
        if analysis.confidence < 0.3 or len(user_input.split()) < 2:
            analysis.requires_clarification = True
            analysis.suggested_response = self.CONTEXT_RESPONSES[language]['clarification']

        # Store in history
        self.intent_history.append(analysis)

        return analysis

    def _detect_mood(self, user_input: str) -> str:
        """Detect user mood from input"""
        user_input_lower = user_input.lower()

        frustrated_patterns = [
            r'\b(not working|error|problem|issue|bug|broken|crash)\b',
            r'\b(stupid|idiot|damn|hell|shit|frustrat|annoy)\b',
            r'[!]{2,}',  # Multiple exclamation marks
            r'\b(again|still|yet)\b.*\b(not|no|never)\b'
        ]

        happy_patterns = [
            r'\b(great|awesome|excellent|perfect|amazing|thank|love|nice|good)\b',
            r'[:)]',  # Smileys
        ]

        urgent_patterns = [
            r'\b(urgent|emergency|quick|fast|hurry|immediately|asap|jaldi|turant)\b',
            r'[!]{3,}'  # Three or more exclamation marks
        ]

        for pattern in frustrated_patterns:
            if re.search(pattern, user_input_lower):
                return 'frustrated'

        for pattern in urgent_patterns:
            if re.search(pattern, user_input_lower):
                return 'urgent'

        for pattern in happy_patterns:
            if re.search(pattern, user_input_lower):
                return 'happy'

        return 'neutral'

    def _extract_entities(self, user_input: str) -> Dict[str, Any]:
        """Extract entities from user input"""
        entities = {}

        # Extract file paths
        file_pattern = r'[\w\s-]+\.(txt|pdf|jpg|png|doc|docx|xls|xlsx|mp3|mp4)'
        files = re.findall(file_pattern, user_input, re.IGNORECASE)
        if files:
            entities['files'] = files

        # Extract numbers
        numbers = re.findall(r'\b\d+\b', user_input)
        if numbers:
            entities['numbers'] = [int(n) for n in numbers]

        # Extract URLs
        url_pattern = r'https?://[^\s<>"{}|\\^`[\]]+'
        urls = re.findall(url_pattern, user_input)
        if urls:
            entities['urls'] = urls

        # Extract email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, user_input)
        if emails:
            entities['emails'] = emails

        # Extract app names (common apps)
        common_apps = [
            'chrome',
            'firefox',
            'edge',
            'notepad',
            'word',
            'excel',
            'powerpoint',
            'spotify',
            'vlc',
            'calculator',
            'whatsapp']
        for app in common_apps:
            if app in user_input.lower():
                entities['app_name'] = app
                break

        return entities

    def get_contextual_response(self, language: str = 'en') -> Optional[str]:
        """Generate a context-aware response"""
        responses = self.CONTEXT_RESPONSES[language]

        # Check for greeting context
        hour = datetime.now().hour
        if self.current_context.conversation_count == 0:
            if 5 <= hour < 12:
                return responses['greeting_morning']
            elif 12 <= hour < 17:
                return responses['greeting_afternoon']
            else:
                return responses['greeting_evening']

        # Check for remembered facts
        if self.current_context.conversation_count > 5:
            memories = memory_manager.get_memories_by_category('preferences')
            if memories and len(memories) > 0:
                memory = memories[0]
                return responses['remembered_fact'].format(
                    fact=f"{memory.key} is {memory.value}")

        # Follow-up after successful command
        if self.current_context.last_successful and self.current_context.conversation_count > 0:
            return responses['follow_up']

        return None

    def suggest_next_action(self) -> Optional[str]:
        """Suggest next action based on context"""
        if not self.current_context.last_command_type:
            return None

        # Topic-based suggestions
        suggestions = {
            'file_management': [
                'Would you like to search for another file?',
                'Should I open the folder?',
                'Do you want to organize these files?'
            ],
            'applications': [
                'Would you like to open another app?',
                'Should I close this application?',
                'Do you want to switch to a different window?'
            ],
            'media': [
                'Would you like to convert this to another format?',
                'Should I extract text from this?',
                'Do you want to resize the image?'
            ],
            'system': [
                'Would you like to check system status?',
                'Should I adjust any settings?',
                'Do you want to see battery level?'
            ]
        }

        topic = self.current_context.active_topic
        if topic in suggestions:
            import random
            return random.choice(suggestions[topic])

        return None

    def is_follow_up_command(self, user_input: str) -> bool:
        """Check if this is a follow-up to previous command"""
        follow_up_indicators = [
            r'^and\s+',
            r'^also\s+',
            r'^too\s*$',
            r'^as well\s*$',
            r'\btoo\s*$',
            r'\bas well\s*$',
            r'\baur\b',  # Hindi
            r'\bbhi\b',  # Hindi
        ]

        user_input_lower = user_input.lower()

        for indicator in follow_up_indicators:
            if re.search(indicator, user_input_lower):
                return True

        # Check if command is very short (likely follow-up)
        if len(user_input.split()) <= 2 and self.current_context.last_command_type:
            return True

        return False

    def get_conversation_context(self, limit: int = 5) -> List[Dict]:
        """Get recent conversation context for AI processing"""
        session_id = self.current_context.session_id
        entries = memory_manager.get_recent_conversations(limit, session_id)

        context = []
        for entry in entries:
            context.append({
                'timestamp': entry.timestamp,
                'user': entry.user_input,
                'sofiya': entry.sofiya_response,
                'type': entry.command_type,
                'success': entry.success
            })

        return context

    def set_context_variable(self, key: str, value: Any) -> None:
        """Set a temporary context variable"""
        self.current_context.context_variables[key] = value
        logger.info(f"Set context variable: {key} = {value}")

    def get_context_variable(self, key: str) -> Optional[Any]:
        """Get a context variable"""
        return self.current_context.context_variables.get(key)

    def clear_context(self) -> None:
        """Clear current context"""
        self.current_context = ContextState()
        self.intent_history.clear()
        logger.info("Context cleared")

    def export_context(self) -> Dict:
        """Export current context for debugging/analysis"""
        return {
            'current_context': {
                'session_id': self.current_context.session_id,
                'last_command': self.current_context.last_command,
                'last_command_type': self.current_context.last_command_type,
                'conversation_count': self.current_context.conversation_count,
                'active_topic': self.current_context.active_topic,
                'user_mood': self.current_context.user_mood,
                'context_variables': self.current_context.context_variables
            },
            'intent_history': [
                {
                    'primary_intent': h.primary_intent,
                    'confidence': h.confidence,
                    'entities': h.entities
                }
                for h in self.intent_history[-10:]  # Last 10
            ]
        }


# Singleton instance
context_manager = ContextManager()
