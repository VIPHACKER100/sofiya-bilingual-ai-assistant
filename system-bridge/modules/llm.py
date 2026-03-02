import httpx
from utils.logger import logger
import os
import json
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()


class LLMModule:
    """Module for handling conversational AI using OpenRouter or Gemini"""

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.models = [
            "google/gemini-2.0-flash-lite-preview-02-05:free",
            "google/gemini-2.0-flash-exp:free",
            "deepseek/deepseek-r1:free",
            "mistralai/mistral-7b-instruct:free",
            "microsoft/phi-3-medium-128k-instruct:free",
            "openrouter/auto"
        ]
        self.current_model_index = 0

    async def get_response(
            self,
            text: str,
            language: str = 'en') -> Optional[str]:
        """Get a response from the LLM with automatic fallback"""
        if not self.api_key:
            logger.warning("No OpenRouter API key found.")
            return None

        system_prompt = (
            "You are SOFIYA, a highly intelligent and helpful bilingual AI assistant developed by VIPHACKER100. "
            f"Respond in a natural, polite, and human-like manner in {'Hindi' if language == 'hi' else 'English'}. "
            "Keep it concise (max 2-3 sentences). "
            "You can help with system commands, web search, and general conversation. "
            "If the user asks for a command you can't perform, explain it politely."
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://viphacker100.com",
            "X-Title": "SOFIYA AI Assistant"
        }

        # Try models in order until one works or we run out
        for i in range(len(self.models)):
            model = self.models[(self.current_model_index + i) % len(self.models)]
            
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text}
                    ]
                }

                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.base_url,
                        headers=headers,
                        json=payload,
                        timeout=15.0)

                if response.status_code == 200:
                    # Update current model index to use this successful model next time
                    self.current_model_index = (self.current_model_index + i) % len(self.models)
                    
                    data = response.json()
                    if "choices" in data and len(data["choices"]) > 0:
                        return data["choices"][0]["message"]["content"].strip()
                
                elif response.status_code == 429:
                    logger.warning(f"Rate limit hit for model {model}. Trying next...")
                    continue
                elif response.status_code == 404:
                    logger.warning(f"Model {model} not found/available. Trying next...")
                    continue
                else:
                    logger.error(f"OpenRouter Error {response.status_code} for {model}: {response.text}")
                    continue

            except Exception as e:
                logger.error(f"Exception calling OpenRouter with {model}: {e}")
                continue

        return None


# Singleton instance
llm_module = LLMModule()
