// ZORO 2.0 Voice Engine Abstraction Layer
// Implements unified state machine: IDLE | LISTENING | PROCESSING | SPEAKING | ERROR
// Methods: idle(), listen(), stop(), transcribe(), speak(), interrupt()
// Integrated with Web Audio API Analyzer & SpeechService

import { speechService, SpeechOptions } from './speech';
import { soundService } from './sound';

export type VoiceEngineState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

export type VoiceEngineListener = (state: VoiceEngineState, data?: { transcript?: string; error?: string }) => void;

class VoiceEngineClass {
  private currentState: VoiceEngineState = 'IDLE';
  private listeners: Set<VoiceEngineListener> = new Set();
  private lastTranscript: string = '';
  private wakeWordRegex = /^(?:hey\s+)?zoro[,.\s]*/i;

  constructor() {
    // initialize
  }

  public getState(): VoiceEngineState {
    return this.currentState;
  }

  public subscribe(listener: VoiceEngineListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState, { transcript: this.lastTranscript });
    return () => this.listeners.delete(listener);
  }

  private setState(state: VoiceEngineState, data?: { transcript?: string; error?: string }) {
    this.currentState = state;
    if (data?.transcript !== undefined) {
      this.lastTranscript = data.transcript;
    }
    this.listeners.forEach((fn) => {
      try {
        fn(state, data);
      } catch (err) {
        console.error('VoiceEngine listener error:', err);
      }
    });
  }

  public idle(): void {
    if (speechService.isCurrentlyListening()) {
      speechService.stopListening();
    }
    this.setState('IDLE');
  }

  public listen(callbacks?: {
    onInterim?: (text: string) => void;
    onFinal?: (text: string) => void;
    onError?: (err: any) => void;
  }): boolean {
    if (!speechService.isRecognitionSupported()) {
      this.setState('ERROR', { error: 'Voice recognition not supported in this browser environment.' });
      callbacks?.onError?.({ message: 'Voice recognition unsupported' });
      return false;
    }

    // Interrupt any ongoing speech
    this.interrupt();
    this.setState('LISTENING', { transcript: '' });
    soundService.play('VOICE_ACTIVATED');

    const started = speechService.startListening({
      onInterim: (text) => {
        // Strip wake word if present for cleaner directive
        const clean = text.replace(this.wakeWordRegex, '');
        this.setState('LISTENING', { transcript: clean || text });
        callbacks?.onInterim?.(clean || text);
      },
      onFinal: (text) => {
        const clean = text.replace(this.wakeWordRegex, '').trim();
        this.setState('PROCESSING', { transcript: clean || text });
        callbacks?.onFinal?.(clean || text);
      },
      onError: (err) => {
        this.setState('ERROR', { error: err.message });
        callbacks?.onError?.(err);
      },
      onEnd: () => {
        if (this.currentState === 'LISTENING') {
          this.setState('IDLE');
        }
      },
    });

    return true;
  }

  public stop(): void {
    speechService.stopListening();
    if (this.currentState === 'LISTENING') {
      this.setState('IDLE');
    }
  }

  public transcribe(text: string): string {
    return text.replace(this.wakeWordRegex, '').trim();
  }

  public speak(
    text: string,
    options?: SpeechOptions,
    onComplete?: () => void
  ): boolean {
    this.interrupt();
    this.setState('SPEAKING');

    return speechService.speak(text, {
      ...options,
      onStart: () => {
        this.setState('SPEAKING');
        options?.onStart?.();
      },
      onEnd: () => {
        this.setState('IDLE');
        options?.onEnd?.();
        onComplete?.();
      },
      onError: (err) => {
        this.setState('ERROR', { error: String(err) });
        options?.onError?.(err);
      },
    });
  }

  public interrupt(): void {
    speechService.stopSpeaking();
    if (this.currentState === 'SPEAKING') {
      this.setState('IDLE');
    }
  }

  public getAudioFrequencyData(dataArray: Uint8Array): boolean {
    return speechService.getByteFrequencyData(dataArray);
  }

  public isAvailable(): boolean {
    return speechService.isRecognitionSupported();
  }
}

export const VoiceEngine = new VoiceEngineClass();
