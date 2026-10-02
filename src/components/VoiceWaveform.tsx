import React, { useEffect, useState, useRef } from 'react';
import { VoiceState } from '../types';
import { speechService } from '../services/speech';

interface VoiceWaveformProps {
  state: VoiceState;
  className?: string;
  barCount?: number;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  state,
  className = '',
  barCount = 28,
}) => {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 12)
  );
  const [decibels, setDecibels] = useState<number>(-42);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let phase = 0;

    const updateWaveform = () => {
      phase += 0.15;

      if (state === 'LISTENING') {
        // Sample live microphone data if available
        const liveFrequencies = speechService.getLiveFrequencyData();
        if (liveFrequencies.length > 0) {
          // Map to barCount
          const newBars = Array.from({ length: barCount }, (_, i) => {
            const freqIndex = Math.floor((i / barCount) * liveFrequencies.length);
            const rawVal = liveFrequencies[freqIndex] || 10;
            // Add subtle organic harmonics
            const harmonic = Math.sin(phase + i * 0.4) * 8;
            return Math.min(100, Math.max(12, rawVal + harmonic));
          });
          setBars(newBars);

          const avg = newBars.reduce((a, b) => a + b, 0) / newBars.length;
          setDecibels(Math.round(-50 + (avg / 100) * 45));
        } else {
          // Synthetic ambient active voice sine waves
          const newBars = Array.from({ length: barCount }, (_, i) => {
            const sin1 = Math.sin(phase + i * 0.3);
            const sin2 = Math.cos(phase * 1.5 + i * 0.2);
            const val = 25 + Math.abs(sin1 * 35) + Math.abs(sin2 * 25);
            return Math.min(95, Math.max(12, Math.round(val)));
          });
          setBars(newBars);
          setDecibels(Math.round(-35 + Math.sin(phase) * 8));
        }
      } else if (state === 'SPEAKING') {
        // AI vocalization acoustic spectrum (dynamic twin peak pattern)
        const newBars = Array.from({ length: barCount }, (_, i) => {
          const centerDist = Math.abs(i - barCount / 2) / (barCount / 2);
          const vocalModulation =
            Math.sin(phase * 1.8 + i * 0.5) * 35 +
            Math.cos(phase * 0.9 + i * 0.3) * 20;
          const val = Math.max(12, (1 - centerDist * 0.5) * 55 + vocalModulation);
          return Math.min(100, Math.max(12, Math.round(val)));
        });
        setBars(newBars);
        setDecibels(Math.round(-24 + Math.sin(phase * 2) * 6));
      } else if (state === 'PROCESSING' || state === 'EXECUTING') {
        // Scanning radar sweep pattern
        const sweepPos = (Math.sin(phase * 1.2) + 1) * 0.5 * barCount;
        const newBars = Array.from({ length: barCount }, (_, i) => {
          const dist = Math.abs(i - sweepPos);
          const intensity = Math.max(0, 1 - dist / 5);
          return Math.round(14 + intensity * 65);
        });
        setBars(newBars);
        setDecibels(-38);
      } else if (state === 'ERROR') {
        // Glitch jitter waveform
        const newBars = Array.from({ length: barCount }, () =>
          Math.floor(Math.random() * 50) + 10
        );
        setBars(newBars);
        setDecibels(-18);
      } else {
        // Idle gentle heartbeat ripple
        const newBars = Array.from({ length: barCount }, (_, i) => {
          const ripple = Math.sin(phase * 0.6 + i * 0.2) * 6;
          return Math.max(10, Math.round(14 + ripple));
        });
        setBars(newBars);
        setDecibels(-48);
      }

      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    animationFrameRef.current = requestAnimationFrame(updateWaveform);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, barCount]);

  // Color selection based on tactical state
  const getThemeColor = () => {
    switch (state) {
      case 'LISTENING':
        return {
          bar: 'bg-[#19F59A]',
          glow: 'shadow-[0_0_12px_rgba(25,245,154,0.4)]',
          border: 'border-[#19F59A]/30',
          text: 'text-[#19F59A]',
        };
      case 'SPEAKING':
        return {
          bar: 'bg-[#38E1FF]',
          glow: 'shadow-[0_0_12px_rgba(56,225,255,0.4)]',
          border: 'border-[#38E1FF]/30',
          text: 'text-[#38E1FF]',
        };
      case 'PROCESSING':
      case 'EXECUTING':
        return {
          bar: 'bg-[#FFB000]',
          glow: 'shadow-[0_0_12px_rgba(255,176,0,0.4)]',
          border: 'border-[#FFB000]/30',
          text: 'text-[#FFB000]',
        };
      case 'ERROR':
        return {
          bar: 'bg-[#FF3B30]',
          glow: 'shadow-[0_0_12px_rgba(255,59,48,0.4)]',
          border: 'border-[#FF3B30]/30',
          text: 'text-[#FF3B30]',
        };
      case 'IDLE':
      case 'PAUSED':
      default:
        return {
          bar: 'bg-[#16281F] group-hover:bg-[#00D084]/40',
          glow: '',
          border: 'border-[#16281F]',
          text: 'text-[#8B9992]',
        };
    }
  };

  const theme = getThemeColor();

  return (
    <div className={`flex flex-col items-center w-full max-w-xl mx-auto space-y-2 select-none ${className}`}>
      {/* Waveform Bars Container */}
      <div className="flex items-center justify-center gap-1.5 h-20 w-full px-4 py-2 bg-[#050706] rounded-xl border border-[#16281F] overflow-hidden relative shadow-inner">
        {/* Subtle center frequency baseline */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-[#16281F]/60 pointer-events-none" />

        {bars.map((height, idx) => (
          <div
            key={idx}
            className="flex-1 flex items-center justify-center h-full"
          >
            <div
              className={`w-full max-w-[6px] rounded-full transition-all duration-75 ${theme.bar} ${theme.glow}`}
              style={{
                height: `${height}%`,
                minHeight: '4px',
              }}
            />
          </div>
        ))}
      </div>

      {/* Telemetry Bar Under Waveform */}
      <div className="flex items-center justify-between w-full px-2 text-[9px] font-mono text-[#8B9992]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#19F59A] animate-pulse" />
          <span>ACOUSTIC SPECTRUM: {state === 'LISTENING' ? 'OPERATOR INPUT' : state === 'SPEAKING' ? 'ZORO SYNTHESIS' : 'STANDBY'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>FREQ: 16.0 kHz</span>
          <span className={`font-bold ${theme.text}`}>LEVEL: {decibels} dB</span>
        </div>
      </div>
    </div>
  );
};
