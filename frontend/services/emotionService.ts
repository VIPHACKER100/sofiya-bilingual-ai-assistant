
/**
 * EmotionService — Granular Emotion & Tone Detection
 * Inspired by the Human_Robot_Emotion_Dataset
 */

export type EmotionType = 'joy' | 'anger' | 'sadness' | 'fear' | 'surprise' | 'neutral' | 'disgust';
export type ToneType = 'cheerful' | 'sarcastic' | 'formal' | 'hostile' | 'anxious' | 'polite' | 'informal';

export interface EmotionAnalysis {
    emotion: EmotionType;
    tone: ToneType;
    confidence: number;
}

class EmotionService {
    private emotionPatterns: Record<EmotionType, RegExp[]> = {
        joy: [/\b(happy|joy|great|wonderful|amazing|love|excellent|perfect|glad|hurray|yay)\b/i],
        anger: [/\b(angry|mad|furious|annoyed|irritated|hate|pissed|shut up|stupid|dumb)\b/i],
        sadness: [/\b(sad|unhappy|depressed|lonely|heartbroken|cry|sorrow|misery|upset)\b/i],
        fear: [/\b(scared|frightened|afraid|terrified|anxious|worry|nervous|help me|danger)\b/i],
        surprise: [/\b(wow|whoa|surprise|unbelievable|impossible|shock|omg|really)\b/i],
        disgust: [/\b(eww|gross|disgusting|revolting|nasty|yuck|ugh)\b/i],
        neutral: [/\b(ok|okay|fine|alright|maybe|sure|possibly|understand)\b/i]
    };

    private tonePatterns: Record<ToneType, RegExp[]> = {
        cheerful: [/\b(great|awesome|good|happy|lovely|nice|pleasure)\b/i],
        sarcastic: [/\b(wow|great|yeah|sure|whatever|whatever|brilliant)\b.*(?:\?|!)/i], // Context dependent
        formal: [/\b(please|thank you|pardon|appreciate|regarding|compliance|formal)\b/i],
        hostile: [/\b(stop|don't|none of your business|back off|forget it|useless)\b/i],
        anxious: [/\b(quick|hurry|fast|now|immediately|wait|hold on|asap)\b/i],
        polite: [/\b(please|thanks|thank you|kindly|may i|would you)\b/i],
        informal: [/\b(hey|yo|hi|wassup|dude|buddy|yeah|nope)\b/i]
    };

    analyzeEmotion(text: string): EmotionAnalysis {
        const lower = text.toLowerCase();
        let bestEmotion: EmotionType = 'neutral';
        let maxEmotionScore = 0;

        for (const [emotion, patterns] of Object.entries(this.emotionPatterns) as [EmotionType, RegExp[]][]) {
            let matches = 0;
            patterns.forEach(p => {
                if (p.test(lower)) matches++;
            });
            if (matches > maxEmotionScore) {
                maxEmotionScore = matches;
                bestEmotion = emotion;
            }
        }

        let bestTone: ToneType = 'informal';
        let maxToneScore = 0;

        for (const [tone, patterns] of Object.entries(this.tonePatterns) as [ToneType, RegExp[]][]) {
            let matches = 0;
            patterns.forEach(p => {
                if (p.test(lower)) matches++;
            });
            if (matches > maxToneScore) {
                maxToneScore = matches;
                bestTone = tone;
            }
        }

        // Special case for Sarcasm (often identified by Tone + Punctuation)
        if (lower.includes('...') || lower.includes('?!') || (maxEmotionScore > 0 && maxToneScore === 0)) {
            // Placeholder for more complex sarcasm detection
        }

        return {
            emotion: bestEmotion,
            tone: bestTone,
            confidence: Math.min(0.98, (maxEmotionScore + maxToneScore) / 4)
        };
    }

    /**
     * Recommends a personality mode based on detected emotion/tone
     */
    getRecommendedPersonality(analysis: EmotionAnalysis): string {
        const { emotion, tone } = analysis;

        if (emotion === 'anger' || tone === 'hostile') return 'FOCUS'; // Be brief and professional
        if (emotion === 'joy' || tone === 'cheerful') return 'SASS'; // Be witty and fun
        if (emotion === 'sadness' || tone === 'polite') return 'DEFAULT'; // Be empathetic and calm
        if (tone === 'formal') return 'FOCUS';

        return 'DEFAULT';
    }
}

export const emotionService = new EmotionService();
