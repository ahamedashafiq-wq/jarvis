import React, { useState, useEffect } from 'react';
import { AIOrb } from '../components/AIOrb';
import { AIOrbState, RoutePath, Task, Memory } from '../types';
import { speechService } from '../services/speech';
import { streamGeminiResponse, parseIntentFromText } from '../services/gemini';
import { useAuth } from '../context/AuthContext';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { Mic, MicOff, Volume2, Radio, CheckCircle, ArrowLeft } from 'lucide-react';

interface VoiceProps {
  onNavigate: (path: RoutePath) => void;
}

export const Voice: React.FC<VoiceProps> = ({ onNavigate }) => {
  const { currentSession, trackEvent, createNotification } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [orbState, setOrbState] = useState<AIOrbState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>([15, 25, 45, 60, 30, 20, 50, 70, 35, 10]);
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Animate waveform while listening or speaking
  useEffect(() => {
    let interval: any = null;
    if (isListening || orbState === 'SPEAKING') {
      interval = setInterval(() => {
        setWaveformBars(
          Array.from({ length: 14 }, () => Math.floor(Math.random() * 65) + 15)
        );
      }, 120);
    } else {
      setWaveformBars([10, 15, 20, 25, 20, 15, 25, 20, 15, 10, 10, 10, 12, 14]);
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
      setActionNotice(null);
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

    // Intent check
    const intent = parseIntentFromText(spokenText);
    let notice = '';
    if (intent.type === 'TASK_CREATE') {
      const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
      const newTask: Task = {
        id: 'tsk_' + Date.now(),
        user_id: userId,
        title: intent.title,
        description: 'Vocalized directive',
        priority: intent.priority,
        status: 'TODO',
        category: 'VOICE',
        due_date: 'Today',
        created_at: Date.now(),
      };
      setLocalStore(`tasks_${userId}`, [newTask, ...tasks]);
      notice = `Directive registered: ${newTask.title}`;
      setActionNotice(notice);
      createNotification('VOICE DIRECTIVE LOGGED', notice, 'SUCCESS');
    } else if (intent.type === 'MEMORY_CREATE') {
      const memories = getLocalStore<Memory[]>(`memories_${userId}`, []);
      const newMem: Memory = {
        id: 'mem_' + Date.now(),
        user_id: userId,
        content: intent.content,
        category: intent.category,
        importance: intent.importance,
        pinned: true,
        created_at: Date.now(),
      };
      setLocalStore(`memories_${userId}`, [newMem, ...memories]);
      notice = `Memory saved: [${newMem.category}]`;
      setActionNotice(notice);
      createNotification('VOICE MEMORY PRESERVED', newMem.content, 'INFO');
    }

    let accumulated = '';
    try {
      const memories = getLocalStore<Memory[]>(`memories_${userId}`, []);
      const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
      const stream = streamGeminiResponse(spokenText, [], memories, tasks);
      for await (const chunk of stream) {
        accumulated += chunk;
        setResponse(accumulated);
      }
      setOrbState('SPEAKING');
      speechService.speak(
        accumulated,
        voiceRate,
        1.0,
        1.0,
        () => {
          setOrbState('IDLE');
        }
      );
      trackEvent('VOICE_COMMAND_EXECUTED', JSON.stringify({ length: spokenText.length }));
    } catch (e) {
      console.error(e);
      setOrbState('ERROR');
      setTimeout(() => setOrbState('IDLE'), 3000);
    }
  };

  const sampleCommands = [
    'Report tactical telemetry status',
    'Add task Calibrate Three Blades priority high',
    'Remember that server host IP is 10.0.0.1',
    'Focus protocol for 25 minutes',
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#19F59A] animate-pulse" />
            VOICE SYNAPSE HUD
          </h1>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            ACOUSTIC TELEMETRY • HANDS-FREE TACTICAL INTERACTION
          </p>
        </div>

        <button
          onClick={() => onNavigate('/dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>COMMAND DECK</span>
        </button>
      </div>

      {/* Hero Orb Center */}
      <div className="p-8 rounded-2xl bg-[#0A100D] border border-[#16281F] flex flex-col items-center justify-center relative overflow-hidden space-y-6">
        <AIOrb state={orbState} size={200} />

        {/* Dynamic Waveform Visualizer */}
        <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-xs">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-100 ${
                isListening
                  ? 'bg-[#19F59A]'
                  : orbState === 'SPEAKING'
                  ? 'bg-[#38E1FF]'
                  : 'bg-[#16281F]'
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Push to talk button */}
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={handleToggleMic}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening
                ? 'bg-[#FF3B30] text-[#F5F7F6] ring-4 ring-[#FF3B30]/30 animate-pulse'
                : 'bg-[#00D084] text-[#050706] hover:bg-[#19F59A] ring-4 ring-[#00D084]/20'
            }`}
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>
          <div className="text-[11px] font-bold text-[#F5F7F6] tracking-wider">
            {isListening ? 'LISTENING TO OPERATOR...' : 'CLICK TO ENGAGE VOICE'}
          </div>
        </div>
      </div>

      {/* Live Acoustic Transcript & Assistant Response */}
      {(transcript || response || actionNotice) && (
        <div className="p-5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-3">
          {transcript && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#8B9992] tracking-wider">
                OPERATOR VOCALIZATION:
              </span>
              <p className="text-sm font-sans text-[#F5F7F6] bg-[#050706] p-3 rounded-lg border border-[#16281F]">
                "{transcript}"
              </p>
            </div>
          )}

          {actionNotice && (
            <div className="flex items-center gap-2 text-[10px] text-[#19F59A] bg-[#00D084]/10 border border-[#00D084]/30 p-2 rounded">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}

          {response && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#38E1FF] tracking-wider">
                JARVIS ZORO SYNAPSE:
              </span>
              <p className="text-xs font-sans text-[#F5F7F6] bg-[#121C17] p-3 rounded-lg border border-[#00D084]/30 leading-relaxed whitespace-pre-wrap">
                {response}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Suggested Voice Directives */}
      <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-3">
        <span className="text-[10px] font-bold text-[#8B9992] tracking-wider">
          TACTICAL VOICE EXAMPLES:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sampleCommands.map((cmd, i) => (
            <button
              key={i}
              onClick={() => {
                setTranscript(cmd);
                handleFinalSpeech(cmd);
              }}
              className="p-2.5 rounded-lg bg-[#050706] border border-[#16281F] hover:border-[#00D084]/40 text-left text-[11px] text-[#8B9992] hover:text-[#19F59A] transition-colors"
            >
              › "{cmd}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
