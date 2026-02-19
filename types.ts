// Adding SpeechRecognition types to the global window object
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }

  class ImageCapture {
    constructor(videoTrack: MediaStreamTrack);
    takePhoto(photoSettings?: any): Promise<Blob>;
    getPhotoCapabilities(): Promise<any>;
    getPhotoSettings(): Promise<any>;
    grabFrame(): Promise<ImageBitmap>;
    track: MediaStreamTrack;
  }
}

export interface ISpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

export interface ISpeechRecognitionErrorEvent {
  error: string;
}

export interface CommandResult {
  transcript: string;
  response: string;
  actionType: string;
  language: 'en' | 'hi';
  timestamp: number;
  isSystemMessage?: boolean;
}

export enum AppMode {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
}

export enum Language {
  ENGLISH = 'en-US',
  HINDI = 'hi-IN',
}

export enum PersonalityMode {
  DEFAULT = 'DEFAULT', // Helpful, polite (Sofiya)
  FOCUS = 'FOCUS',     // Brief, direct, no fluff
  STORYTELLER = 'STORYTELLER', // Descriptive, narrative
  SASS = 'SASS'        // Witty, sarcastic, informal
}

export interface HealthData {
  steps: number;
  heartRate: number;
  sleepScore: number; // 0-100
  calories: number;
}

export interface SmartDevice {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'lock' | 'cam';
  status: boolean | string | number; // on/off or value
  location: string;
}

export interface CommunicationData {
  type: 'message' | 'call';
  contact: string;
  content?: string; // For messages
  status: 'draft' | 'sending' | 'sent' | 'calling' | 'connected' | 'ended';
}

export interface MediaTrack {
  title: string;
  artist: string;
  isPlaying: boolean;
  coverColor: string;
}