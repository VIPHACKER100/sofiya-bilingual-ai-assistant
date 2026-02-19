
export class AIService {
    private static API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    private static API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    private static MODEL = import.meta.env.VITE_AI_MODEL || 'openai/gpt-3.5-turbo';

    static async getAIResponse(prompt: string, language: 'en' | 'hi' = 'en'): Promise<string> {
        if (!this.API_KEY) {
            console.warn('OpenRouter API Key is missing. Falling back to local responses.');
            return '';
        }

        const systemPrompt = language === 'hi'
            ? "आप सोफिया हैं, एक मददगार और बुद्धिमान द्विभाषी एआई सहायक। संक्षिप्त और स्पष्ट उत्तर दें।"
            : "You are Sofiya, a helpful and intelligent bilingual AI assistant. Provide concise and clear responses.";

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'HTTP-Referer': 'https://sofiya-ai.vercel.app', // Optional for OpenRouter
                    'X-Title': 'Sofiya AI Assistant', // Optional for OpenRouter
                },
                body: JSON.stringify({
                    model: this.MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                }),
            });

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('AI Service Error:', error);
            return '';
        }
    }
}
