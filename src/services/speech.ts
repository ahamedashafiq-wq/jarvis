// Tactical Speech Recognition, Synthesis, and Web Audio Telemetry Service for JARVIS Zoro

export type MicPermissionState = 'PROMPT' | 'GRANTED' | 'DENIED' | 'UNSUPPORTED';

export interface SpeechListenCallbacks {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: { message: string; code?: string; isPermissionDenied?: boolean }) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // Web Audio Context & Analyser
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private currentPermission: MicPermissionState = 'PROMPT';

  // State
  private lastSpokenBuffer = '';
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  public isRecognitionSupported(): boolean {
    return Boolean(this.recognition);
  }

  public isSynthesisSupported(): boolean {
    return Boolean(this.synth);
  }

  public getPermissionStatus(): MicPermissionState {
    return this.currentPermission;
  }

  /**
   * Request microphone permission explicitly and initialize audio stream
   */
  public async requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.currentPermission = 'UNSUPPORTED';
      return {
        granted: false,
        error: 'MediaDevices / microphone access is unsupported in this browser environment.',
      };
    }

    try {
      // Prompt user explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.currentPermission = 'GRANTED';
      this.attachAudioStream(stream);
      return { granted: true };
    } catch (err: any) {
      if (
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.includes('denied')
      ) {
        this.currentPermission = 'DENIED';
        return {
          granted: false,
          error: 'MICROPHONE ACCESS DENIED: Browser or operator refused microphone authorization.',
        };
      }
      this.currentPermission = 'DENIED';
      return {
        granted: false,
        error: err?.message || 'Failed to initialize audio input device.',
      };
    }
  }

  /**
   * Attach media stream to Web Audio API analyser for realtime waveform visualizer
   */
  private attachAudioStream(stream: MediaStream) {
    this.mediaStream = stream;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;

        this.micSource = this.audioCtx.createMediaStreamSource(stream);
        this.micSource.connect(this.analyser);
      }
    } catch (e) {
      console.warn('AudioContext analyzer setup error:', e);
    }
  }

  /**
   * Read live acoustic frequency spectrum from microphone analyser
   * Returns array of numbers 0..100 for waveform bars
   */
  public getLiveFrequencyData(): number[] {
    if (!this.analyser) {
      return [];
    }

    try {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      // Map to 16 normalized values (10 - 100)
      const bars: number[] = [];
      const step = Math.max(1, Math.floor(bufferLength / 16));
      for (let i = 0; i < 16; i++) {
        const val = dataArray[i * step] || 0;
        // Normalize 0-255 to 10-100
        const normalized = Math.max(8, Math.round((val / 255) * 90 + 10));
        bars.push(normalized);
      }
      return bars;
    } catch {
      return [];
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public getByteFrequencyData(dataArray: Uint8Array): boolean {
    if (!this.analyser) {
      return false;
    }
    try {
      this.analyser.getByteFrequencyData(dataArray as any);
      return true;
    } catch {
      return false;
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }

  /**
   * Start speech recognition with live interim and final transcript streaming
   */
  public async startListening(callbacks: SpeechListenCallbacks) {
    if (!this.recognition) {
      callbacks.onError({
        message: 'Speech recognition is not available in this browser. Please use Chrome, Edge, or Safari.',
        code: 'NOT_SUPPORTED',
      });
      return;
    }

    // Stop active speech if currently speaking
    this.stopSpeaking();

    // Ensure mic stream and permissions are ready
    if (!this.mediaStream || this.currentPermission !== 'GRANTED') {
      const permResult = await this.requestMicrophonePermission();
      if (!permResult.granted) {
        callbacks.onError({
          message: permResult.error || 'MICROPHONE ACCESS DENIED',
          code: 'PERMISSION_DENIED',
          isPermissionDenied: true,
        });
        return;
      }
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.lastSpokenBuffer = '';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.playTacticalChime('START');
      if (callbacks.onStart) callbacks.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (interim) {
        callbacks.onInterim(interim);
      }

      if (final) {
        this.lastSpokenBuffer = final.trim();
        callbacks.onFinal(this.lastSpokenBuffer);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.currentPermission = 'DENIED';
        callbacks.onError({
          message: 'MICROPHONE ACCESS DENIED: Operator or browser permissions rejected.',
          code: 'not-allowed',
          isPermissionDenied: true,
        });
      } else if (event.error === 'no-speech') {
        // User was quiet, not an unrecoverable failure
        callbacks.onError({
          message: 'No vocal acoustic input detected.',
          code: 'no-speech',
        });
      } else {
        callbacks.onError({
          message: `Speech recognition anomaly: ${event.error}`,
          code: event.error,
        });
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (callbacks.onEnd) {
        callbacks.onEnd();
      }
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      // Already running or starting
      console.warn('Recognition start caught error:', e);
    }
  }

  /**
   * Stop listening and optionally return accumulated final buffer
   */
  public stopListening(): string {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Recognition stop error:', e);
      }
      this.isListening = false;
      this.playTacticalChime('STOP');
    }
    return this.lastSpokenBuffer;
  }

  /**
   * Get all installed browser speech synthesis voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Speak response with custom rate, pitch, and voice.
   * Supports both options object and positional arguments for backwards compatibility.
   */
  public speak(
    text: string,
    optionsOrRate?: SpeechOptions | number,
    pitch = 1.0,
    volume = 1.0,
    onEnd?: () => void
  ): boolean {
    if (!this.synth) return false;

    // Immediately stop any prior synthesis
    this.stopSpeaking();

    // Clean text of markdown asterisks or code formatting for cleaner vocalization
    const cleanedText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleanedText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanedText);

    let resolvedRate = 1.0;
    let resolvedPitch = 1.0;
    let resolvedVolume = 1.0;
    let resolvedVoiceName: string | undefined;
    let resolvedOnEnd: (() => void) | undefined = onEnd;
    let resolvedOnStart: (() => void) | undefined;
    let resolvedOnError: ((err: any) => void) | undefined;

    if (typeof optionsOrRate === 'object' && optionsOrRate !== null) {
      resolvedRate = optionsOrRate.rate ?? 1.0;
      resolvedPitch = optionsOrRate.pitch ?? 1.0;
      resolvedVolume = optionsOrRate.volume ?? 1.0;
      resolvedVoiceName = optionsOrRate.voiceName;
      resolvedOnStart = optionsOrRate.onStart;
      resolvedOnEnd = optionsOrRate.onEnd;
      resolvedOnError = optionsOrRate.onError;
    } else if (typeof optionsOrRate === 'number') {
      resolvedRate = optionsOrRate;
      resolvedPitch = pitch;
      resolvedVolume = volume;
    }

    utterance.rate = resolvedRate;
    utterance.pitch = resolvedPitch;
    utterance.volume = resolvedVolume;

    const voices = this.getVoices();
    if (resolvedVoiceName) {
      const selected = voices.find((v) => v.name === resolvedVoiceName);
      if (selected) utterance.voice = selected;
    } else {
      // Pick best tactical English voice
      const preferred =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Daniel') ||
              v.name.includes('Arthur'))
        ) || voices.find((v) => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      if (resolvedOnStart) resolvedOnStart();
    };

    utterance.onend = () => {
      this.activeUtterance = null;
      if (resolvedOnEnd) resolvedOnEnd();
    };

    utterance.onerror = (e) => {
      this.activeUtterance = null;
      if (resolvedOnError) resolvedOnError(e);
      else if (resolvedOnEnd) resolvedOnEnd();
    };

    this.activeUtterance = utterance;
    this.synth.speak(utterance);
    return true;
  }

  /**
   * Stop active speech immediately
   */
  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.activeUtterance = null;
    }
  }

  /**
   * Halt all speech and recognition immediately (Emergency Interrupt)
   */
  public interrupt() {
    this.stopListening();
    this.stopSpeaking();
    this.playTacticalChime('INTERRUPT');
  }

  /**
   * Tactical Sound Effects (Web Audio Oscillator)
   */
  public playTacticalChime(type: 'START' | 'STOP' | 'SUCCESS' | 'INTERRUPT' | 'ERROR') {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.05, now);

      switch (type) {
        case 'START':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;

        case 'STOP':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(660, now);
          osc.frequency.exponentialRampToValueAtTime(330, now + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;

        case 'SUCCESS':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.22);
          break;

        case 'INTERRUPT':
          osc.type = 'square';
          osc.frequency.setValueAtTime(220, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;

        case 'ERROR':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.setValueAtTime(160, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
      }
    } catch {
      // Audio context may be restricted before user gesture
    }
  }
}

export const speechService = new SpeechService();
