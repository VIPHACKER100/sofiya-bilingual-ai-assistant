# SOFIYA Advanced Voice Features Guide

## 🌍 Multi-Language Support

### Language Detection

SOFIYA automatically detects the language you're speaking:

```javascript
import { LanguageManager } from './voice-engine/language-manager.js';

const langManager = new LanguageManager({ db: dbConnection });

// Detect language from text
const detected = langManager.detectLanguage('नमस्ते, कैसे हो?');
// Returns: 'hi'

// Get language configuration
const config = langManager.getLanguageConfig('hi');
// Returns: { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी', ... }
```

### Supported Languages

- **English** (en-US) - English
- **Hindi** (hi-IN) - हिंदी
- **Spanish** (es-ES) - Español
- **French** (fr-FR) - Français
- **German** (de-DE) - Deutsch
- **Mandarin** (zh-CN) - 中文
- **Japanese** (ja-JP) - 日本語

### User Language Preferences

```javascript
// Get user's preferred language
const userLang = await langManager.getUserLanguage('user123');

// Set user's preferred language
await langManager.setUserLanguage('user123', 'hi');

// Maintain context across language switches
const translatedContext = await langManager.maintainContext(
    'user123',
    'hi', // Current language
    'en', // Previous language
    { lastIntent: 'send_message', lastEntities: { contact: 'Mom' } }
);
```

---

## 🎤 Voice Cloning & Customization

### Recording Voice Samples

To create a custom voice, record 20+ voice samples (15-30 minutes total):

```javascript
import { VoiceCustomization } from './integrations/voice-customization.js';

const voiceCustom = new VoiceCustomization({ db: dbConnection });

// Record voice samples
const modelId = await voiceCustom.recordVoiceSamples(
    'user123',
    audioSamples, // Array of audio buffers
    { 
        language: 'en-US',
        gender: 'female',
        age: 'adult'
    }
);

// Check training status
const status = await voiceCustom.getVoiceModelStatus('user123');
// Returns: { status: 'training', progress: 50, ... }
```

### Using Custom Voice

```javascript
// Synthesize speech with custom voice
const audio = await voiceCustom.synthesizeSpeech(
    'Hello! How can I help you?',
    'user123', // Use user's custom voice
    'happy' // Emotion preset
);

// Available emotions:
// - happy: Higher pitch, faster rate
// - calm: Lower pitch, slower rate
// - energetic: Fast rate, high pitch
// - professional: Neutral
// - soothing: Slow rate, low pitch
```

### Celebrity Voices (Premium)

```javascript
// Check available celebrity voices
const celebrities = await voiceCustom.getCelebrityVoices();

// Use celebrity voice (requires licensing)
try {
    const audio = await voiceCustom.useCelebrityVoice(
        'Welcome to SOFIYA!',
        'morgan_freeman'
    );
} catch (error) {
    // Not licensed
}
```

---

## 👂 Ambient Listening Mode

### Privacy-Respecting Passive Listening

Ambient listening detects keywords without storing audio:

```javascript
import { AmbientListener } from './voice-engine/ambient-listener.js';

const listener = new AmbientListener({
    enabled: false, // Opt-in only
    onInsight: async (insight) => {
        console.log('Insight detected:', insight);
        // insight: { keyword, action, insight, context }
        
        // Trigger appropriate action
        switch (insight.action) {
            case 'suggest_rest':
                // Show rest suggestion
                break;
            case 'remind_umbrella':
                // Set umbrella reminder
                break;
            case 'show_shopping_list':
                // Display shopping list
                break;
        }
    }
});

// Enable ambient listening (user must opt-in)
await listener.enable();

// Process audio chunks (called automatically from audio stream)
await listener.processAudioChunk(audioChunk);

// Check privacy status
const privacy = listener.getPrivacyStatus();
// Returns: { enabled, recording: false, storing: false, processing: 'local', ... }

// Disable when not needed
listener.disable();
```

### Built-in Keyword Patterns

- **Tired**: "tired", "exhausted", "sleepy" → Suggest rest
- **Stressed**: "stressed", "overwhelmed", "anxious" → Suggest breathing
- **Rain**: "raining", "rain", "umbrella" → Remind umbrella
- **Store**: "store", "shopping", "grocery" → Show shopping list
- **Hungry**: "hungry", "food", "eat" → Suggest meal
- **Meeting**: "meeting", "appointment", "call" → Check calendar

### Custom Keywords

```javascript
// Add custom keyword pattern
listener.addKeywordPattern(
    'coffee',
    /\b(coffee|espresso|cappuccino)\b/i,
    'suggest_coffee_shop',
    'User mentioned coffee'
);
```

---

## 💬 Conversation Skills

### Using Conversation Skills

SOFIYA can handle multi-turn conversations:

```javascript
import { ConversationSkillsManager } from './voice-engine/conversation-skills/index.js';

const skillsManager = new ConversationSkillsManager();

// Process user input
const result = skillsManager.process('user123', 'I want to book a restaurant', nlpResult);

if (result) {
    // Conversation skill active
    console.log(result.response);
    // "I'd be happy to help you book a restaurant! What type of cuisine would you like?"
    
    // Continue conversation
    const result2 = skillsManager.process('user123', 'Italian', nlpResult);
    // "Great! Italian sounds delicious. When would you like to dine?"
    
    // Check if complete
    if (result2.complete) {
        // Conversation finished
    }
} else {
    // Normal command processing
}
```

### Restaurant Booking Flow

Example conversation:

1. **User**: "I want to book a restaurant"
   - **SOFIYA**: "What type of cuisine would you like?"

2. **User**: "Italian"
   - **SOFIYA**: "Great! When would you like to dine?"

3. **User**: "Tomorrow"
   - **SOFIYA**: "What time would you like?"

4. **User**: "7 PM"
   - **SOFIYA**: "How many people will be dining?"

5. **User**: "4 people"
   - **SOFIYA**: "Any special requests?"

6. **User**: "Window seat please"
   - **SOFIYA**: "Let me confirm: Italian, Tomorrow, 7 PM, 4 people, Window seat. Correct?"

7. **User**: "Yes"
   - **SOFIYA**: "Perfect! I've booked your table..."

### Troubleshooting Flow

Example conversation:

1. **User**: "Help, voice commands not working"
   - **SOFIYA**: "I see you're having issues with voice commands. Is your microphone connected?"

2. **User**: "Yes"
   - **SOFIYA**: "Have you granted microphone permissions?"

3. **User**: "I think so"
   - **SOFIYA**: "Are you using Chrome or Edge browser?"

4. **User**: "Yes, Chrome"
   - **SOFIYA**: "Based on your answers, here are solutions: 1. Check microphone connection, 2. Grant permissions..."

5. **User**: "It's working now!"
   - **SOFIYA**: "Great! I'm glad it's resolved."

### Creating Custom Skills

```javascript
export class CustomSkill {
    constructor() {
        this.name = 'custom_skill';
        this.states = {
            INITIAL: 'initial',
            STEP1: 'step1',
            STEP2: 'step2',
            COMPLETE: 'complete'
        };
        this.currentState = this.states.INITIAL;
        this.context = {};
    }

    process(userInput, nlpResult) {
        switch (this.currentState) {
            case this.states.INITIAL:
                this.currentState = this.states.STEP1;
                return {
                    response: 'First question?',
                    state: this.currentState,
                    context: this.context
                };
            // ... handle other states
        }
    }

    isComplete() {
        return this.currentState === this.states.COMPLETE;
    }
}

// Register custom skill
skillsManager.registerSkill(new CustomSkill());
```

---

## 🔧 Integration with Voice Engine

### Language-Aware Voice Processing

```javascript
import { LanguageManager } from './voice-engine/language-manager.js';
import { VoiceInputEngine } from './voice-engine/voice-input.js';

const langManager = new LanguageManager({ db: dbConnection });
const voiceEngine = new VoiceInputEngine();

// Detect language and configure voice engine
const detectedLang = langManager.detectLanguage(transcript);
const langConfig = langManager.getLanguageConfig(detectedLang);

voiceEngine.setLanguage(langConfig.code);

// Process audio with language-specific config
const result = await voiceEngine.processAudioStream(audioData, {
    config: {
        languageCode: langConfig.code,
        alternativeLanguageCodes: [langConfig.code]
    }
});
```

### Conversation Skills Integration

```javascript
import { ConversationSkillsManager } from './voice-engine/conversation-skills/index.js';
import { CommandRouter } from '../backend/command-router.js';

const skillsManager = new ConversationSkillsManager();
const commandRouter = new CommandRouter();

async function processVoiceCommand(userId, transcript, nlpResult) {
    // Check for conversation skill first
    const skillResult = skillsManager.process(userId, transcript, nlpResult);
    
    if (skillResult) {
        // Return skill response
        return {
            type: 'conversation',
            response: skillResult.response,
            skill: skillResult.skill,
            complete: skillResult.complete
        };
    }
    
    // Otherwise, process as normal command
    const routerResult = await commandRouter.route(nlpResult);
    return {
        type: 'command',
        ...routerResult
    };
}
```

---

## 📊 Usage Examples

### Multi-Language Voice Command

```javascript
// User speaks in Hindi
const transcript = 'मोम को संदेश भेजो';
const detectedLang = langManager.detectLanguage(transcript); // 'hi'

// Process with Hindi NLP
const nlpResult = await nlpProcessor.process(transcript);
// Returns: { intent: 'send_message', entities: { contact: 'Mom' }, language: 'hi' }

// Route command (works in any language)
const result = await commandRouter.route(nlpResult);

// Respond in user's preferred language
const userLang = await langManager.getUserLanguage(userId);
const response = responseFormatter.format(result, personality, null, userLang);
```

### Voice Cloning Example

```javascript
// User records voice samples
const audioSamples = [/* 20+ audio buffers */];
const modelId = await voiceCustom.recordVoiceSamples('user123', audioSamples);

// Check training progress
setInterval(async () => {
    const status = await voiceCustom.getVoiceModelStatus('user123');
    console.log(`Training: ${status.progress}%`);
    
    if (status.status === 'ready') {
        console.log('Voice model ready!');
        clearInterval();
    }
}, 5000);

// Use custom voice
const audio = await voiceCustom.synthesizeSpeech(
    'Hello! This is your custom SOFIYA voice.',
    'user123',
    'happy'
);
```

---

## 🔒 Privacy & Security

### Ambient Listening Privacy

- ✅ **No Recording**: Audio is never recorded
- ✅ **No Storage**: Transcripts are never stored
- ✅ **Local Processing**: All processing happens locally
- ✅ **Keywords Only**: Only detects keywords, not full transcription
- ✅ **Opt-In Only**: Must be explicitly enabled by user
- ✅ **Zero Retention**: No data retention

### Voice Cloning Privacy

- ✅ **User Data**: Voice samples stored securely
- ✅ **Model Storage**: Models stored locally or encrypted
- ✅ **User Control**: Users can delete their voice model anytime
- ✅ **No Sharing**: Voice models never shared with other users

---

## 📚 Further Reading

- `language-manager.js` - Full language management implementation
- `voice-customization.js` - Voice cloning and customization
- `ambient-listener.js` - Privacy-respecting ambient listening
- `conversation-skills/` - Conversation skill library
