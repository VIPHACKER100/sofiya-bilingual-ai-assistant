
import { Language, PersonalityMode } from '../types';

class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis = window.speechSynthesis;
  private isListening: boolean = false;
  private currentPersonality: PersonalityMode = PersonalityMode.DEFAULT;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;
  private continuousMode: boolean = true;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = this.continuousMode;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.recognition.lang = 'en-US';
      this.recognition.restartTimeout = 500;
    } else {
      console.error("Speech Recognition API not supported in this browser.");
    }
  }

  public setContinuousMode(enabled: boolean) {
    this.continuousMode = enabled;
    if (this.recognition) {
      this.recognition.continuous = enabled;
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
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
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript.trim();
      const isFinal = lastResult.isFinal;
      
      if (transcript.length > 0) {
        onResult(transcript, isFinal);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      
      const errorMap: Record<string, string> = {
        'no-speech': 'no-speech',
        'audio-capture': 'mic-disconnected',
        'not-allowed': 'permission-denied',
        'network': 'network-error',
        'aborted': 'aborted'
      };
      
      const mappedError = errorMap[event.error] || event.error;
      
      if (event.error !== 'no-speech') {
        onError(mappedError);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.continuousMode) {
        this.restartTimeout = setTimeout(() => {
          if (!this.isListening) {
            try {
              this.recognition.start();
              this.isListening = true;
            } catch (e) {
              console.warn("Failed to restart recognition:", e);
              onEnd();
            }
          }
        }, 300);
      } else {
        onEnd();
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn("Recognition start failed:", e);
      if (e instanceof DOMException && e.name === 'InvalidStateError') {
        this.recognition.stop();
        setTimeout(() => {
          try {
            this.recognition.start();
            this.isListening = true;
          } catch (e2) {
            this.isListening = false;
            onError('start-failed');
          }
        }, 100);
      } else {
        this.isListening = false;
        onError('start-failed');
      }
    }
  }

  public stopListening() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
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
