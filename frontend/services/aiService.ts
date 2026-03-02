
const LOCAL_FALLBACK_RESPONSES_EN = [
    "I understand you're asking about that. Let me help you with that.",
    "That's an interesting question. Here's what I can tell you.",
    "I'd be happy to help with that. Let me provide some information.",
    "Great question! Here's what I found for you.",
    "Let me assist you with that right away."
];

const LOCAL_FALLBACK_RESPONSES_HI = [
    "मुझे समझ नहीं आया। क्या आप इसे दोबारा कह सकते हैं?",
    "मैं आपकी कैसे मदद कर सकती हूँ?",
    "कृपया फिर से कहें।",
    "मैं इस बारे में जानकारी नहीं रखती। क्या आप कुछ और पूछना चाहेंगे?",
    "मुझे माफ़ करें, मैं इस प्रश्न का उत्तर नहीं दे पा रही।"
];

export class AIService {
    private static API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    private static API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    private static MODEL = import.meta.env.VITE_AI_MODEL || 'openai/gpt-3.5-turbo';

    private static getRandomFallback(lang: 'en' | 'hi'): string {
        const responses = lang === 'hi' ? LOCAL_FALLBACK_RESPONSES_HI : LOCAL_FALLBACK_RESPONSES_EN;
        return responses[Math.floor(Math.random() * responses.length)];
    }

    static async getAIResponse(prompt: string, language: 'en' | 'hi' = 'en'): Promise<string> {
        const systemPrompt = language === 'hi'
            ? "आप सोफिया हैं, एक मददगार और बुद्धिमान द्विभाषी एआई सहायक। संक्षिप्त और स्पष्ट उत्तर दें। हिंदी में उत्तर दें।"
            : "You are Sofiya, a helpful and intelligent bilingual AI assistant. Provide concise and clear responses.";

        if (!this.API_KEY || this.API_KEY.includes('YOUR_') || this.API_KEY.length < 20) {
            console.warn('OpenRouter API Key is missing or invalid. Using local fallback.');
            return this.getRandomFallback(language);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'HTTP-Referer': 'https://sofiya-ai.vercel.app',
                    'X-Title': 'Sofiya AI Assistant',
                },
                body: JSON.stringify({
                    model: this.MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 150,
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error('AI API error:', response.status);
                return this.getRandomFallback(language);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content?.trim();
            
            if (!content) {
                return this.getRandomFallback(language);
            }

            return content;
        } catch (error) {
            console.error('AI Service Error:', error);
            return this.getRandomFallback(language);
        }
    }
}
