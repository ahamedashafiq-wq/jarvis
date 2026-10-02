import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  Radio,
  CornerDownLeft,
} from 'lucide-react';
import { VoiceEngine, VoiceEngineState } from '../../services/voiceEngine';
import { soundService } from '../../services/sound';
import { speechService } from '../../services/speech';

interface VoiceAssistantProps {
  onExecuteCommand: (command: string) => void;
  className?: string;
  activeContextTitle?: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onExecuteCommand,
  className = '',
  activeContextTitle,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceEngineState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [isPressing, setIsPressing] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>([12, 18, 28, 45, 60, 35, 75, 40, 25, 50, 30, 18, 12]);
  const animFrameRef = useRef<number | null>(null);

  // Subscribe to VoiceEngine state
  useEffect(() => {
    const unsub = VoiceEngine.subscribe((state, data) => {
      setVoiceState(state);
      if (data?.transcript !== undefined) {
        setTranscript(data.transcript);
      }
    });
    return () => unsub();
  }, []);

  // Keyboard shortcut: Ctrl + Space to trigger voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if (!isInput && (e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        handleToggleVoice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState]);

  // Audio frequency waveform loop
  useEffect(() => {
    if (voiceState === 'LISTENING' || voiceState === 'SPEAKING') {
      const updateWaveform = () => {
        const freqArray = new Uint8Array(16);
        const hasData = VoiceEngine.getAudioFrequencyData(freqArray);

        if (hasData && freqArray.some((v) => v > 0)) {
          const bars = Array.from(freqArray.slice(0, 13)).map((val) =>
            Math.max(10, Math.round((val / 255) * 100))
          );
          setWaveformBars(bars);
        } else {
          // Synthetic ambient oscillation
          setWaveformBars((prev) =>
            prev.map(() => Math.floor(12 + Math.random() * 65))
          );
        }
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      animFrameRef.current = requestAnimationFrame(updateWaveform);
    } else {
      setWaveformBars([12, 18, 28, 45, 60, 35, 75, 40, 25, 50, 30, 18, 12]);
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
            onExecuteCommand(finalText);
          }
        },
      });
    }
  };

  const handleMouseDown = () => {
    setIsPressing(true);
    if (voiceState !== 'LISTENING') {
      VoiceEngine.listen({
        onFinal: (finalText) => {
          if (finalText.trim()) {
            onExecuteCommand(finalText);
          }
        },
      });
    }
  };

  const handleMouseUp = () => {
    setIsPressing(false);
    if (voiceState === 'LISTENING') {
      VoiceEngine.stop();
    }
  };

  // State labels and visual metadata
  const getStateMeta = () => {
    switch (voiceState) {
      case 'LISTENING':
        return {
          title: 'Listening...',
          sub: 'Speak your directive now',
          buttonClass: 'bg-zoro-cyan text-black ring-4 ring-zoro-cyan/30 animate-pulse shadow-[0_0_25px_#19D9FF]',
          iconClass: 'text-black',
        };
      case 'PROCESSING':
        return {
          title: 'Processing command...',
          sub: 'Evaluating intent & tools',
          buttonClass: 'bg-zoro-blue text-white ring-4 ring-zoro-blue/30 animate-pulse',
          iconClass: 'text-white',
        };
      case 'SPEAKING':
        return {
          title: 'ZORO is responding...',
          sub: 'Vocal synthesis active',
          buttonClass: 'bg-zoro-violet text-white ring-4 ring-zoro-violet/30 animate-pulse',
          iconClass: 'text-white',
        };
      case 'ERROR':
        return {
          title: 'Voice unavailable',
          sub: 'Check microphone permissions',
          buttonClass: 'bg-zoro-critical/20 text-zoro-critical border border-zoro-critical/40',
          iconClass: 'text-zoro-critical',
        };
      case 'IDLE':
      default:
        return {
          title: 'Tap to speak',
          sub: 'Press & hold or press Ctrl + Space',
          buttonClass: 'bg-zoro-panelElevated border-2 border-zoro-cyan/50 text-zoro-cyan hover:border-zoro-cyan hover:bg-zoro-cyan/10 shadow-[0_0_15px_rgba(25,217,255,0.2)]',
          iconClass: 'text-zoro-cyan',
        };
    }
  };

  const stateMeta = getStateMeta();

  return (
    <div
      className={`w-full rounded-2xl border border-zoro-border bg-gradient-to-b from-[#08121F] to-[#03070D] p-5 font-mono select-none shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-zoro-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Banner Label */}
        <div className="flex items-center gap-2 text-xs font-bold text-zoro-text tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-zoro-cyan shadow-[0_0_8px_#19D9FF] animate-pulse" />
          <span>TALK TO ZORO</span>
        </div>

        {/* Real-time Audio Waveform Visualization */}
        <div className="h-10 flex items-center justify-center gap-1.5 px-4 w-full max-w-sm">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-75 ${
                voiceState === 'LISTENING'
                  ? 'bg-zoro-cyan shadow-[0_0_6px_#19D9FF]'
                  : voiceState === 'SPEAKING'
                  ? 'bg-zoro-violet shadow-[0_0_6px_#8B5CFF]'
                  : 'bg-zoro-muted/40'
              }`}
              style={{
                height: `${Math.max(6, height * 0.35)}px`,
              }}
            />
          ))}
        </div>

        {/* Center Large Microphone Control Button */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={handleToggleVoice}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 transform active:scale-95 ${stateMeta.buttonClass} focus:outline-none`}
            title="Press to talk (or Ctrl + Space)"
            aria-label="Talk to Zoro"
          >
            {voiceState === 'ERROR' ? (
              <MicOff className={`w-7 h-7 ${stateMeta.iconClass}`} />
            ) : (
              <Mic className={`w-7 h-7 ${stateMeta.iconClass}`} />
            )}
          </button>

          {/* Dynamic Voice Status Text */}
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-zoro-text tracking-wider">
              {stateMeta.title}
            </div>
            <div className="text-[11px] text-zoro-textMuted">
              {stateMeta.sub}
            </div>
          </div>
        </div>

        {/* Live Transcript Bubble */}
        {transcript && (
          <div className="px-4 py-2 rounded-xl bg-zoro-panelElevated/90 border border-zoro-cyan/30 text-xs text-zoro-cyan max-w-md animate-fade-in shadow-md">
            &ldquo;{transcript}&rdquo;
          </div>
        )}

        {/* Voice Command Quick Suggestions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-2xl text-[11px]">
          {[
            'Show my active missions',
            'What should I work on next?',
            'Create a task for tomorrow',
            'Search my memory',
            'Start focus mode',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                onExecuteCommand(suggestion);
                soundService.play('CLICK');
              }}
              className="px-2.5 py-1 rounded-lg border border-zoro-border bg-zoro-panelElevated/60 text-zoro-textSecondary hover:text-zoro-cyan hover:border-zoro-cyan/40 transition-colors"
            >
              &ldquo;{suggestion}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
