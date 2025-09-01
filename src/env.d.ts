/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Clerk Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: string;
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: string;
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: string;
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: string;

    // Database
    DATABASE_URL: string;

    // Vercel Blob Storage
    BLOB_READ_WRITE_TOKEN: string;

    // Google Maps API
    GOOGLE_MAPS_API_KEY?: string;

    // OpenAI API
    OPENAI_API_KEY: string;
    OPENAI_BASE_URL?: string;

    // Environment
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_VERCEL_ENV?: string;
    NEXT_PUBLIC_VERCEL_URL?: string;
  }
}

// Speech Recognition API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface Window {
  SpeechRecognition?: {
    new (): SpeechRecognition;
  };
  webkitSpeechRecognition?: {
    new (): SpeechRecognition;
  };
}
