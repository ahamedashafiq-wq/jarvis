import React, { useState, useEffect, useRef } from 'react';
import { RoutePath, VoiceState, VoiceMode, Task, Memory } from '../types';
import { speechService } from '../services/speech';
import { detectIntentWithGemini, executeIntent } from '../services/intentRouter';
import { streamGeminiResponse } from '../services/gemini';
import { AgentCore } from '../services/agent';
import { AIOrb } from './AIOrb';
import { VoiceWaveform } from './VoiceWaveform';
import { useAuth } from '../context/AuthContext';
import { getLocalStore, setLocalStore } from '../services/supabase';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Radio,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface GlobalVoiceHUDProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: RoutePath) => void;
}

export const GlobalVoiceHUD: React.FC<GlobalVoiceHUDProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { currentSession, createNotification, trackEvent } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [response, setResponse] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('TOGGLE');
  const [autoSpeak, setAutoSpeak] = useState(true);

  const processingRef = useRef(false);

  // Stop active speech when HUD closes
  useEffect(() => {
    if (!isOpen) {
      speechService.stopSpeaking();
      speechService.stopListening();
      setVoiceState('IDLE');
      setInterimText('');
    }
  }, [isOpen]);

  // Handle Voice Execution Pipeline
  const handleProcessSpeech = async (spokenText: string) => {
    const cleanText = spokenText.trim();
    if (!cleanText || processingRef.current) return;

    processingRef.current = true;
    setVoiceState('PROCESSING');
    setTranscript(cleanText);
    setInterimText('');
    setResponse('');
    setActionNotice(null);

    try {
      const lower = cleanText.toLowerCase();
      const isAgentRequest =
        lower.includes('organize') ||
        lower.includes('prepare my') ||
        lower.includes('orchestrate') ||
        (lower.includes('create a mission') && (lower.includes('objective') || lower.includes('backend') || lower.includes('frontend')));

      if (isAgentRequest) {
        setVoiceState('PROCESSING');
        const agentResult = await AgentCore.startAgent(
          {
            id: 'req_ghud_' + Date.now(),
            user_id: userId,
            message: cleanText,
            source: 'VOICE',
            created_at: Date.now(),
          },
          (updated) => {
            if (updated.status === 'EXECUTING') setVoiceState('EXECUTING');
            else if (updated.status === 'VERIFYING') setVoiceState('PROCESSING');
          }
        );

        let verbalReply = '';
        if (agentResult.status === 'WAITING_FOR_APPROVAL') {
          verbalReply = `Tactical action plan formulated with ${agentResult.plan.steps.length} steps. Operator approval required. Opening Agent Command.`;
          setActionNotice(`Action plan awaiting approval: ${agentResult.plan.objective}`);
          setResponse(verbalReply);
          onNavigate('/agents');
        } else if (agentResult.status === 'COMPLETE') {
          verbalReply = agentResult.result_summary || 'Agent plan executed and verified successfully.';
          setActionNotice(`Agent execution verified: ${agentResult.plan.steps.length} steps completed.`);
          setResponse(verbalReply);
        } else {
          verbalReply = agentResult.failure_reason || 'Agent execution concluded.';
          setResponse(verbalReply);
        }

        if (autoSpeak && verbalReply) {
          setVoiceState('SPEAKING');
          speechService.speak(verbalReply, {
            rate: 1.05,
            onEnd: () => {
              setVoiceState('IDLE');
              processingRef.current = false;
            },
            onError: () => {
              setVoiceState('IDLE');
              processingRef.current = false;
            },
          });
        } else {
          setVoiceState('IDLE');
          processingRef.current = false;
        }
      } else {
        // 1. Detect Intent via Gemini or fast heuristic
        const detected = await detectIntentWithGemini(cleanText);

        // 2. Execute Intent if actionable
        if (detected.intent !== 'CHAT') {
          setVoiceState('EXECUTING');
          const execResult = await executeIntent(detected, userId, onNavigate);

          setActionNotice(execResult.message);
          createNotification('VOICE DIRECTIVE EXECUTED', execResult.message, 'SUCCESS');

          const verbalReply = execResult.message;
          setResponse(verbalReply);

          if (autoSpeak) {
            setVoiceState('SPEAKING');
            speechService.speak(verbalReply, {
              rate: 1.05,
              onEnd: () => {
                setVoiceState('IDLE');
                processingRef.current = false;
              },
              onError: () => {
                setVoiceState('IDLE');
                processingRef.current = false;
              },
            });
          } else {
            setVoiceState('IDLE');
            processingRef.current = false;
          }
        } else {
          // Conversational query via Gemini streaming
          setVoiceState('PROCESSING');
          const memories = getLocalStore<Memory[]>(`memories_${userId}`, []);
          const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
          const stream = streamGeminiResponse(cleanText, [], memories, tasks);

          let accumulated = '';
          for await (const chunk of stream) {
            accumulated += chunk;
            setResponse(accumulated);
          }

          if (autoSpeak && accumulated) {
            setVoiceState('SPEAKING');
            speechService.speak(accumulated, {
              rate: 1.05,
              onEnd: () => {
                setVoiceState('IDLE');
                processingRef.current = false;
              },
              onError: () => {
                setVoiceState('IDLE');
                processingRef.current = false;
              },
            });
          } else {
            setVoiceState('IDLE');
            processingRef.current = false;
          }
        }
      }

      trackEvent('GLOBAL_VOICE_COMMAND', JSON.stringify({ text: cleanText }));
    } catch (err: any) {
      console.error('Voice processing error:', err);
      setVoiceState('ERROR');
      setResponse(`Encountered tactical disruption: ${err?.message || 'Execution error'}`);
      processingRef.current = false;
      setTimeout(() => setVoiceState('IDLE'), 3500);
    }
  };

  const handleStartListening = async () => {
    setPermissionError(null);
    setInterimText('');
    setTranscript('');
    setActionNotice(null);

    await speechService.startListening({
      onStart: () => {
        setVoiceState('LISTENING');
      },
      onInterim: (text) => {
        setInterimText(text);
      },
      onFinal: (text) => {
        setVoiceState('PROCESSING');
        speechService.stopListening();
        handleProcessSpeech(text);
      },
      onError: (err) => {
        if (err.isPermissionDenied) {
          setPermissionError('MICROPHONE ACCESS DENIED: Browser permissions required.');
        }
        setVoiceState('ERROR');
        setTimeout(() => setVoiceState('IDLE'), 3000);
      },
      onEnd: () => {
        if (voiceState === 'LISTENING') {
          setVoiceState('IDLE');
        }
      },
    });
  };

  const handleStopListening = () => {
    const finalBuffer = speechService.stopListening();
    if (finalBuffer) {
      handleProcessSpeech(finalBuffer);
    } else {
      setVoiceState('IDLE');
    }
  };

  const handleInterrupt = () => {
    speechService.interrupt();
    processingRef.current = false;
    setVoiceState('IDLE');
    setInterimText('');
    setActionNotice('Voice operations halted by operator.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050706]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-mono">
      <div className="w-full max-w-xl bg-[#0A100D] border border-[#00D084]/40 rounded-2xl shadow-[0_0_50px_rgba(0,208,132,0.15)] overflow-hidden flex flex-col relative">
        {/* Header HUD Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#16281F] bg-[#050706]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#19F59A] animate-pulse" />
            <span className="font-extrabold text-xs tracking-wider text-[#F5F7F6]">
              GLOBAL VOICE SYNAPSE HUD
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00D084]/15 border border-[#00D084]/30 text-[#19F59A] font-bold">
              {voiceState === 'IDLE'
                ? 'READY'
                : voiceState === 'LISTENING'
                ? 'LISTENING'
                : voiceState === 'PROCESSING'
                ? 'UNDERSTANDING'
                : voiceState === 'EXECUTING'
                ? 'EXECUTING'
                : voiceState === 'SPEAKING'
                ? 'RESPONDING'
                : 'ALERT'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNavigate('/voice');
              }}
              className="p-1.5 rounded-lg border border-[#16281F] bg-[#050706] text-[#8B9992] hover:text-[#19F59A] hover:border-[#00D084]/40 transition-colors"
              title="Open Dedicated Voice Subsystem"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#16281F] bg-[#050706] text-[#8B9992] hover:text-[#FF3B30] hover:border-[#FF3B30]/40 transition-colors"
              title="Close Voice HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Orb & Waveform */}
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          <AIOrb
            state={
              voiceState === 'LISTENING'
                ? 'LISTENING'
                : voiceState === 'PROCESSING'
                ? 'THINKING'
                : voiceState === 'EXECUTING'
                ? 'EXECUTING'
                : voiceState === 'SPEAKING'
                ? 'SPEAKING'
                : voiceState === 'ERROR'
                ? 'ERROR'
                : 'IDLE'
            }
            size={120}
          />

          <div className="text-center space-y-1">
            <div className="text-xs font-bold text-[#F5F7F6] tracking-wider">
              {voiceState === 'IDLE' && 'JARVIS CORE: READY'}
              {voiceState === 'LISTENING' && 'JARVIS CORE: LISTENING...'}
              {voiceState === 'PROCESSING' && 'JARVIS CORE: UNDERSTANDING DIRECTIVE...'}
              {voiceState === 'EXECUTING' && 'JARVIS CORE: EXECUTING APPLICATION ACTION...'}
              {voiceState === 'SPEAKING' && 'JARVIS CORE: RESPONDING...'}
              {voiceState === 'ERROR' && 'JARVIS CORE: ERROR ENCOUNTERED'}
            </div>
            <div className="text-[10px] text-[#8B9992]">
              SHORTCUT: <kbd className="px-1.5 py-0.5 rounded bg-[#050706] border border-[#16281F] text-[#19F59A]">CTRL + SPACE</kbd>
            </div>
          </div>

          <VoiceWaveform state={voiceState} barCount={24} className="max-w-md" />

          {/* Permission Denied Banner */}
          {permissionError && (
            <div className="w-full p-3 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#FF3B30] text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{permissionError}</span>
              </div>
              <button
                onClick={handleStartListening}
                className="px-2.5 py-1 rounded bg-[#FF3B30] text-[#F5F7F6] font-bold text-[10px] hover:bg-[#FF3B30]/90 transition-colors"
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {/* Action & Transcript Card */}
          {(transcript || interimText || response || actionNotice) && (
            <div className="w-full p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-2 text-xs">
              {(transcript || interimText) && (
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-[#8B9992]">OPERATOR VOCALIZATION:</span>
                  <p className="font-sans text-[#F5F7F6] italic bg-[#0A100D] p-2 rounded border border-[#16281F]/80">
                    "{interimText || transcript}"
                  </p>
                </div>
              )}

              {actionNotice && (
                <div className="flex items-center gap-2 text-[10px] text-[#19F59A] bg-[#00D084]/10 border border-[#00D084]/20 p-2 rounded">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{actionNotice}</span>
                </div>
              )}

              {response && (
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-[#38E1FF]">JARVIS RESPONSE:</span>
                  <p className="font-sans text-xs text-[#F5F7F6] bg-[#121C17] p-2.5 rounded border border-[#00D084]/20 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {response}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="px-5 py-3.5 border-t border-[#16281F] bg-[#050706] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                autoSpeak
                  ? 'bg-[#121C17] border-[#00D084]/50 text-[#19F59A]'
                  : 'bg-[#0A100D] border-[#16281F] text-[#8B9992]'
              }`}
              title={autoSpeak ? 'Auto-Speech Active' : 'Auto-Speech Muted'}
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden sm:inline">{autoSpeak ? 'AUDIO ON' : 'MUTED'}</span>
            </button>

            {(voiceState === 'LISTENING' ||
              voiceState === 'PROCESSING' ||
              voiceState === 'SPEAKING') && (
              <button
                onClick={handleInterrupt}
                className="px-3 py-1.5 rounded-lg border border-[#FF3B30]/40 bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 text-xs font-bold flex items-center gap-1.5 transition-colors animate-pulse"
              >
                <Square className="w-3.5 h-3.5" />
                <span>INTERRUPT</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {voiceState === 'LISTENING' ? (
              <button
                onClick={handleStopListening}
                className="px-5 py-2 rounded-xl bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-[#F5F7F6] text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(255,59,48,0.3)] animate-pulse"
              >
                <MicOff className="w-4 h-4" />
                <span>STOP LISTENING</span>
              </button>
            ) : (
              <button
                onClick={handleStartListening}
                className="px-5 py-2 rounded-xl bg-[#00D084] hover:bg-[#19F59A] text-[#050706] text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,208,132,0.3)]"
              >
                <Mic className="w-4 h-4" />
                <span>ENGAGE VOICE</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
