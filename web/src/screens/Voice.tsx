import React, { useState, useEffect } from 'react';
import { AIOrb } from '../components/AIOrb';
import { AIOrbState, RoutePath } from '../types';
import { speechService } from '../services/speech';
import { streamGeminiResponse } from '../services/gemini';
import { Mic, MicOff, Volume2, Radio } from 'lucide-react';

interface VoiceProps {
  onNavigate: (path: RoutePath) => void;
}

export const Voice: React.FC<VoiceProps> = () => {
  const [orbState, setOrbState] = useState<AIOrbState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>([15, 25, 45, 60, 30, 20, 50, 70, 35, 10]);

  // Animate waveform while listening or speaking
  useEffect(() => {
    let interval: any = null;
    if (isListening || orbState === 'SPEAKING') {
      interval = setInterval(() => {
        setWaveformBars(
          Array.from({ length: 12 }, () => Math.floor(Math.random() * 65) + 15)
        );
      }, 120);
    } else {
      setWaveformBars([10, 15, 20, 25, 20, 15, 25, 20, 15, 10, 10, 10]);
    }
    return () => clearInterval(interval);
  }, [isListening, orbState]);

  const handleToggleMic = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setOrbState('IDLE');
    } else {
      setTranscript('');
      setResponse('');
      setIsListening(true);
      setOrbState('LISTENING');

      speechService.startListening(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            handleFinalSpeech(text);
          }
        },
        (err) => {
          console.warn('Speech error', err);
          setIsListening(false);
          setOrbState('IDLE');
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const handleFinalSpeech = async (spokenText: string) => {
    if (!spokenText.trim()) {
      setOrbState('IDLE');
      return;
    }

    setOrbState('THINKING');
    let accumulated = '';
    try {
      const stream = streamGeminiResponse(spokenText, []);
      for await (const chunk of stream) {
        accumulated += chunk;
        setResponse(accumulated);
      }
      setOrbState('SPEAKING');
      speechService.speak(
        accumulated,
        1.0,
        1.0,
        () => setOrbState('SPEAKING'),
        () => setOrbState('IDLE')
      );
    } catch (e) {
      console.error(e);
      setOrbState('ERROR');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] text-center space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Radio className="w-4 h-4 text-[#19F59A] animate-pulse" />
          <h1 className="text-xl font-mono font-black text-[#F5F7F6] tracking-wider">
            VOICE COMMAND HUD
          </h1>
        </div>
        <p className="text-xs font-mono text-[#8B9992]">
          HANDS-FREE TACTICAL INTERACTION • REALTIME AUDIO WAVEFORM
        </p>
      </div>

      {/* Main Tactical Visualizer */}
      <div className="p-10 rounded-2xl bg-[#0A100D] border border-[#16281F] relative w-full max-w-lg flex flex-col items-center justify-center min-h-[320px]">
        <AIOrb state={orbState} size={200} />

        {/* Audio Waveform Graphic */}
        <div className="flex items-center gap-1.5 h-14 mt-6">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-[#00D084] transition-all duration-100"
              style={{
                height: `${height}%`,
                opacity: isListening || orbState === 'SPEAKING' ? 0.9 : 0.25,
              }}
            />
          ))}
        </div>
      </div>

      {/* Live Transcript and Response Box */}
      <div className="w-full max-w-xl space-y-3">
        {transcript && (
          <div className="p-3 rounded-lg bg-[#121C17] border border-[#00D084]/30 text-xs font-mono text-[#19F59A]">
            <span className="text-[#8B9992] mr-2">[OPERATOR SPEECH]:</span>
            "{transcript}"
          </div>
        )}

        {response && (
          <div className="p-3 rounded-lg bg-[#0A100D] border border-[#16281F] text-xs font-mono text-[#F5F7F6] text-left">
            <span className="text-[#38E1FF] mr-2">[JARVIS VOCALIZATION]:</span>
            {response}
          </div>
        )}
      </div>

      {/* Mic Trigger */}
      <div>
        <button
          onClick={handleToggleMic}
          className={`p-5 rounded-full border transition-all duration-300 shadow-[0_0_30px_rgba(0,208,132,0.3)] ${
            isListening
              ? 'bg-[#FF3B30] border-[#FF3B30] text-[#050706] scale-110 animate-pulse'
              : 'bg-[#00D084] border-[#19F59A] text-[#050706] hover:bg-[#19F59A] hover:scale-105'
          }`}
          title={isListening ? 'Halt listening' : 'Initialize voice input'}
        >
          {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>
        <p className="text-[10px] font-mono text-[#8B9992] mt-3">
          {isListening ? 'LISTENING... SPEAK YOUR DIRECTIVE' : 'CLICK TO COMMENCE VOICE DIRECTIVE'}
        </p>
      </div>
    </div>
  );
};
