// JARVIS OS 2.0 Sound Architecture (Web Audio API Synthesizer)
// Provides clean, zero-external-dependency, tactical auditory cues with a global sound toggle.

export type SoundEffectType =
  | 'COMMAND_RECEIVED'
  | 'COMMAND_SUCCESS'
  | 'TASK_COMPLETED'
  | 'WARNING'
  | 'ERROR'
  | 'VOICE_ACTIVATED'
  | 'CLICK';

const SOUND_PREF_KEY = 'jarvis_sound_enabled';

class SoundService {
  private enabled: boolean = true;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SOUND_PREF_KEY);
        this.enabled = stored !== null ? stored === 'true' : true;
      } catch {
        this.enabled = true;
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    try {
      localStorage.setItem(SOUND_PREF_KEY, String(val));
    } catch {
      // ignore
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public play(type: SoundEffectType): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      switch (type) {
        case 'COMMAND_RECEIVED':
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.04, now);
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;

        case 'TASK_COMPLETED':
        case 'COMMAND_SUCCESS':
          osc.type = 'triangle';
          gain.gain.setValueAtTime(0.05, now);
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(659.25, now + 0.08);
          osc.frequency.setValueAtTime(880, now + 0.16);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.start(now);
          osc.stop(now + 0.28);
          break;

        case 'WARNING':
          osc.type = 'sawtooth';
          gain.gain.setValueAtTime(0.04, now);
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.setValueAtTime(320, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
          break;

        case 'ERROR':
          osc.type = 'sawtooth';
          gain.gain.setValueAtTime(0.06, now);
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.22);
          break;

        case 'VOICE_ACTIVATED':
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.05, now);
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.start(now);
          osc.stop(now + 0.16);
          break;

        case 'CLICK':
        default:
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.02, now);
          osc.frequency.setValueAtTime(800, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.start(now);
          osc.stop(now + 0.03);
          break;
      }
    } catch {
      // Audio playback fails silently if browser policy blocks autoplay
    }
  }
}

export const soundService = new SoundService();
