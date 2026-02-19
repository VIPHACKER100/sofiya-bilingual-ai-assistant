
import { Language, PersonalityMode } from '../types';

class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis = window.speechSynthesis;
  private isListening: boolean = false;
  private currentPersonality: PersonalityMode = PersonalityMode.DEFAULT;

  constructor() {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // Stop after one command for cleaner UX
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    } else {
      console.error("Speech Recognition API not supported in this browser.");
    }
  }

  public setLanguage(lang: Language) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public setPersonality(mode: PersonalityMode) {
    this.currentPersonality = mode;
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onEnd: () => void,
    onError: (error: string) => void
  ) {
    if (!this.recognition) {
      onError("not-supported");
      return;
    }
    
    if (this.isListening) {
        return; 
    }

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn("Recognition start failed:", e);
      this.isListening = false;
      onError('start-failed');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn("Error stopping recognition:", e);
      }
      this.isListening = false;
    }
  }

  public speak(text: string, lang: 'en' | 'hi' = 'en') {
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    
    // Voice Selection Strategy
    const voices = this.synthesis.getVoices();
    if (voices.length > 0) {
        const preferredVoice = voices.find(v => v.lang.startsWith(utterance.lang) && (v.name.includes('Google') || v.name.includes('Female')));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        } else {
             const fallback = voices.find(v => v.lang.startsWith(utterance.lang));
             if (fallback) utterance.voice = fallback;
        }
    }

    // Personality Modulation
    switch (this.currentPersonality) {
      case PersonalityMode.FOCUS:
        utterance.rate = 1.2; // Faster, efficient
        utterance.pitch = 1.0;
        break;
      case PersonalityMode.STORYTELLER:
        utterance.rate = 0.85; // Slower, dramatic
        utterance.pitch = 0.95; // Slightly deeper
        break;
      case PersonalityMode.SASS:
        utterance.rate = 1.05;
        utterance.pitch = 1.1; // Slightly higher, expressive
        break;
      default:
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
    }
    
    this.synthesis.speak(utterance);
  }
}

export const voiceService = new VoiceService();
