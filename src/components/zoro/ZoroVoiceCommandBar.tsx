import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { VoiceEngine, VoiceEngineState } from '../../services/voiceEngine';
import { soundService } from '../../services/sound';

interface ZoroVoiceCommandBarProps {
  onExecuteCommand: (command: string) => void;
  isProcessing?: boolean;
  activeContextTitle?: string;
  className?: string;
}

export const ZoroVoiceCommandBar: React.FC<ZoroVoiceCommandBarProps> = ({
  onExecuteCommand,
  isProcessing = false,
  activeContextTitle,
  className = '',
}) => {
  const [inputText, setInputText] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceEngineState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [waveformBars, setWaveformBars] = useState<number[]>([15, 25, 45, 60, 30, 70, 40, 20, 35, 50, 25, 15]);
  const inputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Subscribe to voice engine state
  useEffect(() => {
    const unsub = VoiceEngine.subscribe((state, data) => {
      setVoiceState(state);
      if (data?.transcript !== undefined) {
        setTranscript(data.transcript);
        if (state === 'LISTENING') {
          setInputText(data.transcript);
        }
      }
    });
    return () => unsub();
  }, []);

  // Keyboard shortcut Ctrl + / to focus input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        soundService.play('CLICK');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Animate waveform frequency bars during LISTENING or SPEAKING
  useEffect(() => {
    if (voiceState === 'LISTENING' || voiceState === 'SPEAKING') {
      const updateWaveform = () => {
        const freqArray = new Uint8Array(16);
        const hasData = VoiceEngine.getAudioFrequencyData(freqArray);

        if (hasData && freqArray.some((v) => v > 0)) {
          const bars = Array.from(freqArray.slice(0, 14)).map((val) => Math.max(12, Math.round((val / 255) * 100)));
          setWaveformBars(bars);
        } else {
          // Synthetic organic pulse if frequency data stream is muted
          setWaveformBars((prev) =>
            prev.map(() => Math.floor(15 + Math.random() * 70))
          );
        }
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      animFrameRef.current = requestAnimationFrame(updateWaveform);
    } else {
      setWaveformBars([15, 25, 45, 60, 30, 70, 40, 20, 35, 50, 25, 15]);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [voiceState]);

  const handleToggleVoice = () => {
    if (voiceState === 'LISTENING') {
      VoiceEngine.stop();
      soundService.play('CLICK');
    } else {
      VoiceEngine.listen({
        onFinal: (finalText) => {
          if (finalText.trim()) {
            setInputText(finalText);
            onExecuteCommand(finalText);
          }
        },
      });
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    onExecuteCommand(clean);
    setInputText('');
    setTranscript('');
    soundService.play('COMMAND_RECEIVED');
  };

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 bg-[#050A12]/95 backdrop-blur-xl border-t border-zoro-border px-3 sm:px-6 py-2.5 font-mono select-none shadow-[0_-10px_30px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-3">
        {/* Left: Interactive Voice Waveform Deck */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleToggleVoice}
            className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center ${
              voiceState === 'LISTENING'
                ? 'bg-zoro-cyan/20 border-zoro-cyan text-zoro-cyan shadow-[0_0_20px_rgba(25,217,255,0.4)] animate-pulse'
                : voiceState === 'SPEAKING'
                ? 'bg-zoro-violet/20 border-zoro-violet text-zoro-violet'
                : 'bg-zoro-panel border-zoro-border text-zoro-textSecondary hover:text-zoro-cyan hover:border-zoro-cyan/40'
            }`}
            title={voiceState === 'LISTENING' ? 'Stop Listening' : 'Talk to Zoro (Ctrl + Space)'}
            aria-label="Microphone command toggle"
          >
            {voiceState === 'LISTENING' ? (
              <Mic className="w-5 h-5 text-zoro-cyan animate-bounce" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            {voiceState === 'LISTENING' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-zoro-cyan animate-ping" />
            )}
          </button>

          {/* Live Waveform Audio Bars */}
          <div className="hidden sm:flex items-center gap-0.5 h-7 px-2 rounded-lg bg-zoro-panel border border-zoro-border/60">
            {waveformBars.slice(0, 10).map((height, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  voiceState === 'LISTENING'
                    ? 'bg-zoro-cyan shadow-[0_0_6px_#19D9FF]'
                    : voiceState === 'SPEAKING'
                    ? 'bg-zoro-violet'
                    : 'bg-zoro-textMuted/40'
                }`}
                style={{ height: `${Math.max(6, Math.min(26, height * 0.28))}px` }}
              />
            ))}
          </div>

          <div className="hidden xl:flex flex-col text-[9px] leading-tight">
            <span className="font-bold text-zoro-text">
              {voiceState === 'LISTENING' ? 'LISTENING...' : voiceState === 'SPEAKING' ? 'SPEAKING' : 'TALK TO ZORO'}
            </span>
            <span className="text-zoro-textMuted tracking-wider">
              {activeContextTitle ? `CTX: ${activeContextTitle.slice(0, 16)}` : 'VOICE ENGINE READY'}
            </span>
          </div>
        </div>

        {/* Center: Command Input Field */}
        <form onSubmit={handleSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1 rounded-xl border border-zoro-border bg-zoro-panel/90 focus-within:border-zoro-cyan/60 focus-within:shadow-[0_0_15px_rgba(25,217,255,0.15)] transition-all flex items-center">
            <span className="pl-3.5 text-zoro-cyan font-bold text-xs select-none">›</span>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                voiceState === 'LISTENING'
                  ? 'Listening for speech directive...'
                  : "What would you like me to do? (e.g. 'Zoro, show my active missions' or Ctrl + /)"
              }
              className="w-full bg-transparent px-3 py-2 text-xs text-zoro-text placeholder:text-zoro-textMuted outline-none font-mono"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="pr-3 text-zoro-textMuted hover:text-zoro-text text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden lg:inline-block mr-3 px-1.5 py-0.5 rounded bg-zoro-bg border border-zoro-border text-[9px] text-zoro-textMuted font-mono">
              Ctrl + /
            </kbd>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-zoro-cyan to-zoro-blue text-black font-bold text-xs flex items-center gap-1.5 hover:opacity-95 transition-all shadow-[0_0_15px_rgba(25,217,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">DISPATCH</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </form>

        {/* Right: Operational Pipeline Stages */}
        <div className="hidden lg:flex items-center gap-1 text-[9px] font-mono text-zoro-textMuted shrink-0 border-l border-zoro-border/60 pl-3">
          <span className="text-zoro-cyan font-semibold">UNDERSTAND</span>
          <span>→</span>
          <span className="text-zoro-blue font-semibold">PLAN</span>
          <span>→</span>
          <span className="text-zoro-violet font-semibold">EXECUTE</span>
          <span>→</span>
          <span className="text-zoro-success font-semibold">VERIFY</span>
        </div>
      </div>
    </div>
  );
};
