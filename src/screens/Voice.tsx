import React, { useState, useEffect, useRef } from 'react';
import {
  RoutePath,
  VoiceState,
  VoiceMode,
  VoiceInteraction,
  Task,
  Memory,
  Mission,
} from '../types';
import { speechService } from '../services/speech';
import { detectIntentWithGemini, executeIntent } from '../services/intentRouter';
import { streamGeminiResponse } from '../services/gemini';
import { MissionService } from '../services/mission';
import { NeuralMemoryService } from '../services/neuralMemory';
import { AgentCore } from '../services/agent';
import { AIOrb } from '../components/AIOrb';
import { VoiceWaveform } from '../components/VoiceWaveform';
import { useAuth } from '../context/AuthContext';
import { getLocalStore, setLocalStore } from '../services/supabase';
import {
  Mic,
  MicOff,
  Radio,
  Sliders,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Send,
  Square,
  Play,
  Trash2,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Activity,
  X,
} from 'lucide-react';

interface VoiceProps {
  onNavigate: (path: RoutePath) => void;
}

export const Voice: React.FC<VoiceProps> = ({ onNavigate }) => {
  const { currentSession, trackEvent, createNotification } = useAuth();
  const userId = currentSession?.userId || 'guest';

  // Voice Core State
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('PUSH_TO_TALK');
  const [isPressing, setIsPressing] = useState(false);

  // Transcripts & Response
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confirmedTranscript, setConfirmedTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');

  // Audio & Mic Permissions
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voiceRate, setVoiceRate] = useState<number>(1.0);
  const [voicePitch, setVoicePitch] = useState<number>(1.0);
  const [voiceVolume, setVoiceVolume] = useState<number>(1.0);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [soundEffects, setSoundEffects] = useState<boolean>(true);

  // Settings & History UI
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<VoiceInteraction[]>(() =>
    getLocalStore<VoiceInteraction[]>(`voice_interactions_${userId}`, [])
  );

  const processingRef = useRef(false);
  const isPressingRef = useRef(false);

  // Load available voices
  useEffect(() => {
    const updateVoices = () => {
      const voices = speechService.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        const preferred =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Daniel') ||
                v.name.includes('Arthur'))
          ) || voices.find((v) => v.lang.startsWith('en'));
        if (preferred && !selectedVoice) {
          setSelectedVoice(preferred.name);
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoice]);

  // Global Push-to-Talk (Ctrl + Space) listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting if focus is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (voiceMode === 'PUSH_TO_TALK') {
          if (!isPressingRef.current && voiceState !== 'LISTENING' && !processingRef.current) {
            isPressingRef.current = true;
            setIsPressing(true);
            startListeningSession();
          }
        } else if (voiceMode === 'TOGGLE') {
          if (voiceState === 'LISTENING') {
            stopListeningAndExecute();
          } else if (!processingRef.current) {
            startListeningSession();
          }
        }
      } else if (e.key === 'Escape') {
        // Emergency interrupt
        handleInterrupt();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Control') {
        if (voiceMode === 'PUSH_TO_TALK' && isPressingRef.current) {
          isPressingRef.current = false;
          setIsPressing(false);
          stopListeningAndExecute();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [voiceMode, voiceState]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, []);

  // Execution Pipeline: Transcribed Voice -> Gemini Intent -> Safe Application Service -> Real Result -> TTS
  const handleExecuteVoicePipeline = async (spokenText: string) => {
    const clean = spokenText.trim();
    if (!clean || processingRef.current) return;

    processingRef.current = true;
    setVoiceState('PROCESSING');
    setConfirmedTranscript(clean);
    setInterimTranscript('');
    setAiResponse('');
    setActionNotice(null);

    const startTime = performance.now();
    let executedActionName = '';
    let finalSpokenReply = '';
    let detectedIntentName = 'AGENT_DIRECTIVE';

    try {
      const lower = clean.toLowerCase();
      const isAgentRequest =
        lower.includes('organize') ||
        lower.includes('prepare my') ||
        lower.includes('orchestrate') ||
        (lower.includes('create a mission') && (lower.includes('objective') || lower.includes('backend') || lower.includes('frontend')));

      if (isAgentRequest) {
        setVoiceState('PROCESSING');
        const agentResult = await AgentCore.startAgent(
          {
            id: 'req_voice_' + Date.now(),
            user_id: userId,
            message: clean,
            source: 'VOICE',
            created_at: Date.now(),
          },
          (updated) => {
            if (updated.status === 'EXECUTING') setVoiceState('EXECUTING');
            else if (updated.status === 'VERIFYING') setVoiceState('PROCESSING');
          }
        );

        if (agentResult.status === 'WAITING_FOR_APPROVAL') {
          executedActionName = `[AGENT_PLAN_READY] Action plan created (${agentResult.plan.steps.length} steps)`;
          finalSpokenReply = `Tactical action plan formulated with ${agentResult.plan.steps.length} steps. Operator approval required before execution. Routing to Agent Brain.`;
          setActionNotice(`Action plan awaiting approval: ${agentResult.plan.objective}`);
          setAiResponse(finalSpokenReply);
        } else if (agentResult.status === 'COMPLETE') {
          executedActionName = `[AGENT_COMPLETE] ${agentResult.plan.steps.length} actions verified`;
          finalSpokenReply = agentResult.result_summary || 'Agent plan executed and verified successfully.';
          setActionNotice(`Agent execution verified: ${agentResult.plan.steps.length} steps completed.`);
          setAiResponse(finalSpokenReply);
        } else {
          finalSpokenReply = agentResult.failure_reason || 'Agent execution concluded.';
          setAiResponse(finalSpokenReply);
        }
      } else {
        // 1. Detect Intent using Gemini or deterministic heuristic
        const detected = await detectIntentWithGemini(clean);
        detectedIntentName = detected.intent;

        // 2. Execute Authorized Application Action
        if (detected.intent !== 'CHAT') {
          setVoiceState('EXECUTING');
          const execResult = await executeIntent(detected, userId, onNavigate);

          executedActionName = `[${detected.intent}] ${execResult.message}`;
          setActionNotice(execResult.message);
          finalSpokenReply = execResult.message;
          setAiResponse(finalSpokenReply);

          createNotification(
            `VOICE DIRECTIVE: ${detected.intent}`,
            execResult.message,
            execResult.success ? 'SUCCESS' : 'WARNING'
          );
        } else {
          // General tactical conversational response
          setVoiceState('PROCESSING');
          const memories = getLocalStore<Memory[]>(`memories_${userId}`, []);
          const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
          const missions = MissionService.getMissions(userId);

          // Phase 11: Build Bounded Neural Context
          const neuralEnvelope = NeuralMemoryService.buildBoundedContext(userId, {
            userQuery: clean,
          });

          const stream = streamGeminiResponse(
            clean,
            [],
            memories,
            tasks,
            undefined,
            neuralEnvelope.formattedContextString
          );

          let accumulated = '';
          for await (const chunk of stream) {
            accumulated += chunk;
            setAiResponse(accumulated);
          }
          finalSpokenReply = accumulated;
        }
      }

      const execDuration = Math.round(performance.now() - startTime);

      // 3. Record Interaction in History
      const record: VoiceInteraction = {
        id: 'vi_' + Date.now(),
        user_id: userId,
        timestamp: Date.now(),
        transcript: clean,
        intent: detectedIntentName,
        response: finalSpokenReply,
        actionExecuted: executedActionName || undefined,
        status: 'SUCCESS',
        execution_time_ms: execDuration,
      };

      const updatedHistory = [record, ...history].slice(0, 50);
      setHistory(updatedHistory);
      setLocalStore(`voice_interactions_${userId}`, updatedHistory);

      // 4. Synthesize Audio Response
      if (autoSpeak && finalSpokenReply) {
        setVoiceState('SPEAKING');
        speechService.speak(finalSpokenReply, {
          rate: voiceRate,
          pitch: voicePitch,
          volume: voiceVolume,
          voiceName: selectedVoice,
          onEnd: () => {
            setVoiceState('IDLE');
            processingRef.current = false;
            // Continuous conversation loop
            if (voiceMode === 'CONTINUOUS') {
              startListeningSession();
            }
          },
          onError: () => {
            setVoiceState('IDLE');
            processingRef.current = false;
          },
        });
      } else {
        setVoiceState('IDLE');
        processingRef.current = false;
        if (voiceMode === 'CONTINUOUS') {
          startListeningSession();
        }
      }

      trackEvent('VOICE_COMMAND_EXECUTED', JSON.stringify({ intent: detectedIntentName }));
    } catch (err: any) {
      console.error('Voice pipeline error:', err);
      setVoiceState('ERROR');
      const failMsg = `Tactical core encountered execution disruption: ${err?.message || 'Unknown fault'}`;
      setAiResponse(failMsg);
      processingRef.current = false;

      if (autoSpeak) {
        speechService.speak(failMsg, {
          rate: voiceRate,
          onEnd: () => setVoiceState('IDLE'),
        });
      } else {
        setTimeout(() => setVoiceState('IDLE'), 3500);
      }
    }
  };

  const startListeningSession = async () => {
    setPermissionError(null);
    setInterimTranscript('');
    setConfirmedTranscript('');
    setActionNotice(null);

    await speechService.startListening({
      onStart: () => {
        setVoiceState('LISTENING');
      },
      onInterim: (text) => {
        setInterimTranscript(text);
      },
      onFinal: (text) => {
        setInterimTranscript('');
        setConfirmedTranscript(text);
        if (voiceMode !== 'PUSH_TO_TALK') {
          speechService.stopListening();
          handleExecuteVoicePipeline(text);
        }
      },
      onError: (err) => {
        if (err.isPermissionDenied) {
          setPermissionError(
            'MICROPHONE ACCESS DENIED: Operator or browser policy has blocked audio input.'
          );
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

  const stopListeningAndExecute = () => {
    const finalSpoken = speechService.stopListening();
    const candidate = interimTranscript || finalSpoken || confirmedTranscript;
    if (candidate) {
      handleExecuteVoicePipeline(candidate);
    } else {
      setVoiceState('IDLE');
    }
  };

  const handleInterrupt = () => {
    speechService.interrupt();
    processingRef.current = false;
    isPressingRef.current = false;
    setIsPressing(false);
    setVoiceState('IDLE');
    setInterimTranscript('');
    setActionNotice('Tactical voice operation immediately interrupted.');
  };

  const replayInteraction = (item: VoiceInteraction) => {
    setConfirmedTranscript(item.transcript);
    setAiResponse(item.response);
    setActionNotice(item.actionExecuted || 'Replaying historical transmission.');

    setVoiceState('SPEAKING');
    speechService.speak(item.response, {
      rate: voiceRate,
      pitch: voicePitch,
      volume: voiceVolume,
      voiceName: selectedVoice,
      onEnd: () => setVoiceState('IDLE'),
      onError: () => setVoiceState('IDLE'),
    });
  };

  const clearHistory = () => {
    setHistory([]);
    setLocalStore(`voice_interactions_${userId}`, []);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const txt = manualInput;
    setManualInput('');
    handleExecuteVoicePipeline(txt);
  };

  // Sample tactical directives
  const sampleCommands = [
    { text: 'ZORO, show my active missions', cat: 'MISSIONS' },
    { text: 'What is my next tactical move?', cat: 'MISSIONS' },
    { text: 'Add task Calibrate Three Blades with high priority', cat: 'TASKS' },
    { text: 'Start a 25 minute focus session', cat: 'FOCUS' },
    { text: 'Remember that project deadline is tomorrow', cat: 'MEMORY' },
    { text: 'Report tactical telemetry status', cat: 'TELEMETRY' },
    { text: 'Reroute to Mission Control', cat: 'NAVIGATION' },
    { text: 'List my current memories', cat: 'MEMORY' },
  ];

  const getVoiceStateLabel = () => {
    switch (voiceState) {
      case 'LISTENING':
        return 'ZORO CORE: LISTENING...';
      case 'PROCESSING':
        return 'ZORO CORE: UNDERSTANDING...';
      case 'EXECUTING':
        return 'ZORO CORE: EXECUTING...';
      case 'SPEAKING':
        return 'ZORO CORE: RESPONDING...';
      case 'PAUSED':
        return 'ZORO CORE: PAUSED';
      case 'ERROR':
        return 'ZORO CORE: ERROR';
      case 'IDLE':
      default:
        return 'ZORO CORE: READY';
    }
  };

  const getOrbState = () => {
    switch (voiceState) {
      case 'LISTENING':
        return 'LISTENING';
      case 'PROCESSING':
        return 'THINKING';
      case 'EXECUTING':
        return 'EXECUTING';
      case 'SPEAKING':
        return 'SPEAKING';
      case 'ERROR':
        return 'ERROR';
      default:
        return 'IDLE';
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-mono text-xs select-none">
      {/* 1. Header & Telemetry Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#19F59A] animate-pulse" />
            <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider">
              VOICE COMMAND CENTER
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00D084]/15 border border-[#00D084]/30 text-[#19F59A]">
              PHASE 07
            </span>
          </div>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            ACOUSTIC TELEMETRY • NATURAL INTENT ROUTING • THREE BLADES INTEGRATION
          </p>
        </div>

        {/* Tactical Actions and Calibration */}
        <div className="flex items-center gap-2">
          {/* Active Voice State Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A100D] border border-[#16281F]">
            <span
              className={`w-2 h-2 rounded-full ${
                voiceState === 'LISTENING'
                  ? 'bg-[#19F59A] animate-ping'
                  : voiceState === 'PROCESSING' || voiceState === 'EXECUTING'
                  ? 'bg-[#FFB000] animate-pulse'
                  : voiceState === 'SPEAKING'
                  ? 'bg-[#38E1FF] animate-pulse'
                  : voiceState === 'ERROR'
                  ? 'bg-[#FF3B30]'
                  : 'bg-[#00D084]'
              }`}
            />
            <span
              className={`font-bold text-[11px] ${
                voiceState === 'LISTENING'
                  ? 'text-[#19F59A]'
                  : voiceState === 'SPEAKING'
                  ? 'text-[#38E1FF]'
                  : voiceState === 'PROCESSING' || voiceState === 'EXECUTING'
                  ? 'text-[#FFB000]'
                  : voiceState === 'ERROR'
                  ? 'text-[#FF3B30]'
                  : 'text-[#8B9992]'
              }`}
            >
              {getVoiceStateLabel()}
            </span>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              showSettings
                ? 'bg-[#121C17] border-[#00D084] text-[#19F59A]'
                : 'bg-[#0A100D] border-[#16281F] text-[#8B9992] hover:text-[#19F59A] hover:border-[#00D084]/40'
            }`}
            title="Audio & Synthesis Calibration"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">CALIBRATE</span>
          </button>
        </div>
      </div>

      {/* Permission Denied Alert Banner */}
      {permissionError && (
        <div className="p-4 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/40 text-[#FF3B30] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
            <div>
              <div className="font-bold text-xs">MICROPHONE ACCESS DENIED</div>
              <p className="text-[10px] text-[#FF3B30]/80 mt-0.5">
                Microphone authorization is required for voice command execution. Please allow microphone permissions in your browser.
              </p>
            </div>
          </div>
          <button
            onClick={startListeningSession}
            className="px-4 py-2 rounded-lg bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-[#F5F7F6] font-bold text-xs shrink-0 transition-colors shadow-lg"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* 2. Hero Center Stage: JARVIS Core + Waveform + Controls */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0A100D] border border-[#16281F] flex flex-col items-center justify-center relative overflow-hidden space-y-6 shadow-2xl">
        {/* State Announcement Header */}
        <div className="text-center space-y-1 z-10">
          <div className="text-base sm:text-lg font-black tracking-widest text-[#F5F7F6]">
            {getVoiceStateLabel()}
          </div>
          <div className="text-[10px] text-[#8B9992] flex items-center justify-center gap-2">
            <span>SHORTCUT:</span>
            <kbd className="px-2 py-0.5 rounded bg-[#050706] border border-[#16281F] text-[#19F59A] font-bold">
              CTRL + SPACE
            </kbd>
            <span className="text-[#16281F]">|</span>
            <span>MODE: {voiceMode}</span>
          </div>
        </div>

        {/* Dynamic AI Core Orb */}
        <div className="relative my-2 z-10">
          <AIOrb
            state={getOrbState()}
            size={190}
            onClick={() => {
              if (voiceState === 'LISTENING') stopListeningAndExecute();
              else if (voiceState === 'SPEAKING' || voiceState === 'PROCESSING') handleInterrupt();
              else startListeningSession();
            }}
          />
        </div>

        {/* Real-Time Acoustic Waveform Visualizer */}
        <div className="w-full z-10">
          <VoiceWaveform state={voiceState} barCount={32} />
        </div>

        {/* Primary Voice Controls */}
        <div className="flex flex-col items-center space-y-4 w-full z-10">
          {/* Push-to-Talk or Toggle Big Trigger Button */}
          <div className="flex items-center gap-4">
            {voiceMode === 'PUSH_TO_TALK' ? (
              <button
                onMouseDown={() => {
                  isPressingRef.current = true;
                  setIsPressing(true);
                  startListeningSession();
                }}
                onMouseUp={() => {
                  isPressingRef.current = false;
                  setIsPressing(false);
                  stopListeningAndExecute();
                }}
                onTouchStart={() => {
                  isPressingRef.current = true;
                  setIsPressing(true);
                  startListeningSession();
                }}
                onTouchEnd={() => {
                  isPressingRef.current = false;
                  setIsPressing(false);
                  stopListeningAndExecute();
                }}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-200 select-none shadow-2xl ${
                  isPressing || voiceState === 'LISTENING'
                    ? 'bg-[#FF3B30] text-[#F5F7F6] ring-8 ring-[#FF3B30]/30 scale-105'
                    : 'bg-[#00D084] text-[#050706] hover:bg-[#19F59A] hover:scale-105 ring-8 ring-[#00D084]/20'
                }`}
                title="Hold down to talk, release to process"
              >
                {isPressing || voiceState === 'LISTENING' ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
                <span className="text-[8px] font-black tracking-tighter mt-0.5">
                  {isPressing || voiceState === 'LISTENING' ? 'RELEASE' : 'HOLD TALK'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (voiceState === 'LISTENING') stopListeningAndExecute();
                  else startListeningSession();
                }}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-200 select-none shadow-2xl ${
                  voiceState === 'LISTENING'
                    ? 'bg-[#FF3B30] text-[#F5F7F6] ring-8 ring-[#FF3B30]/30 animate-pulse'
                    : 'bg-[#00D084] text-[#050706] hover:bg-[#19F59A] hover:scale-105 ring-8 ring-[#00D084]/20'
                }`}
                title="Click to start listening, click again to stop"
              >
                {voiceState === 'LISTENING' ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
                <span className="text-[8px] font-black tracking-tighter mt-0.5">
                  {voiceState === 'LISTENING' ? 'STOP' : 'TALK'}
                </span>
              </button>
            )}

            {/* Emergency Interrupt Button */}
            {(voiceState === 'LISTENING' ||
              voiceState === 'PROCESSING' ||
              voiceState === 'EXECUTING' ||
              voiceState === 'SPEAKING') && (
              <button
                onClick={handleInterrupt}
                className="px-4 py-3 rounded-xl border border-[#FF3B30]/50 bg-[#FF3B30]/15 text-[#FF3B30] hover:bg-[#FF3B30]/25 text-xs font-bold flex items-center gap-2 transition-all animate-pulse"
                title="Emergency Halt (Escape)"
              >
                <Square className="w-4 h-4" />
                <span>INTERRUPT</span>
              </button>
            )}
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#050706] border border-[#16281F]">
            <button
              onClick={() => setVoiceMode('PUSH_TO_TALK')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                voiceMode === 'PUSH_TO_TALK'
                  ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A]'
                  : 'text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              PUSH-TO-TALK (HOLD)
            </button>
            <button
              onClick={() => setVoiceMode('TOGGLE')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                voiceMode === 'TOGGLE'
                  ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A]'
                  : 'text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              CLICK TO TALK (TOGGLE)
            </button>
            <button
              onClick={() => setVoiceMode('CONTINUOUS')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                voiceMode === 'CONTINUOUS'
                  ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A]'
                  : 'text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              CONTINUOUS LOOP
            </button>
          </div>
        </div>
      </div>

      {/* 3. Audio Calibration & Voice Settings Drawer */}
      {showSettings && (
        <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#00D084]/30 space-y-4 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#16281F]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#19F59A]" />
              <span className="font-bold text-xs text-[#F5F7F6] tracking-wider">
                SYNAPSE AUDIO CALIBRATION & SYNTHESIS
              </span>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded text-[#8B9992] hover:text-[#FF3B30]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Voice Persona Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#8B9992]">
                SYNTHESIS VOICE PERSONA:
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#050706] border border-[#16281F] text-[#F5F7F6] text-xs focus:border-[#00D084] outline-none"
              >
                {availableVoices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Speech Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#8B9992]">CADENCE / RATE:</span>
                <span className="font-bold text-[#19F59A]">{voiceRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="w-full accent-[#00D084]"
              />
            </div>

            {/* Speech Pitch Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#8B9992]">PITCH MODULATION:</span>
                <span className="font-bold text-[#19F59A]">{voicePitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={voicePitch}
                onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                className="w-full accent-[#00D084]"
              />
            </div>

            {/* Auto-Speech Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#050706] border border-[#16281F]">
              <div>
                <div className="font-bold text-xs text-[#F5F7F6]">AUTO-SPEAK RESPONSES</div>
                <div className="text-[9px] text-[#8B9992]">Vocalize replies via TTS automatically</div>
              </div>
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-2 rounded-lg border transition-colors ${
                  autoSpeak
                    ? 'bg-[#121C17] border-[#00D084] text-[#19F59A]'
                    : 'bg-[#0A100D] border-[#16281F] text-[#8B9992]'
                }`}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Test Voice Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  speechService.speak(
                    'Tactical voice calibration complete. All three blades online and standing by.',
                    {
                      rate: voiceRate,
                      pitch: voicePitch,
                      volume: voiceVolume,
                      voiceName: selectedVoice,
                    }
                  );
                }}
                className="w-full p-2.5 rounded-lg bg-[#00D084]/20 border border-[#00D084] text-[#19F59A] hover:bg-[#00D084]/30 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>TEST AUDIO TRANSMISSION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Live Acoustic Transcript & AI Response Stream */}
      {(confirmedTranscript || interimTranscript || aiResponse || actionNotice) && (
        <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl">
          {/* Operator Vocalization */}
          {(confirmedTranscript || interimTranscript) && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#8B9992] tracking-wider">
                  OPERATOR VOCALIZATION (LIVE SPEECH-TO-TEXT):
                </span>
                {interimTranscript && (
                  <span className="text-[9px] text-[#19F59A] animate-pulse">STREAMING...</span>
                )}
              </div>
              <p className="text-sm font-sans text-[#F5F7F6] bg-[#050706] p-3.5 rounded-xl border border-[#16281F] flex items-center gap-2 leading-relaxed">
                <span className="text-[#00D084] font-bold">›</span>
                <span>
                  {confirmedTranscript}
                  {interimTranscript && (
                    <span className="text-[#8B9992] italic ml-1 opacity-80">
                      {interimTranscript}
                    </span>
                  )}
                </span>
              </p>
            </div>
          )}

          {/* Action Execution Result Badge */}
          {actionNotice && (
            <div className="flex items-center gap-2 text-xs text-[#19F59A] bg-[#00D084]/10 border border-[#00D084]/30 p-3 rounded-xl">
              <CheckCircle className="w-4 h-4 shrink-0 text-[#19F59A]" />
              <span className="font-semibold">{actionNotice}</span>
            </div>
          )}

          {/* ZORO Response */}
          {aiResponse && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#38E1FF] tracking-wider">
                  ZORO SYNTHESIS RESPONSE:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setVoiceState('SPEAKING');
                      speechService.speak(aiResponse, {
                        rate: voiceRate,
                        pitch: voicePitch,
                        volume: voiceVolume,
                        voiceName: selectedVoice,
                        onEnd: () => setVoiceState('IDLE'),
                      });
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#38E1FF] transition-colors text-[10px]"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>REPLAY AUDIO</span>
                  </button>
                  <button
                    onClick={handleInterrupt}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#FF3B30] transition-colors text-[10px]"
                  >
                    <Square className="w-3 h-3" />
                    <span>STOP</span>
                  </button>
                </div>
              </div>
              <p className="text-xs font-sans text-[#F5F7F6] bg-[#121C17] p-4 rounded-xl border border-[#00D084]/30 leading-relaxed whitespace-pre-wrap">
                {aiResponse}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. Fallback Manual Tactical Input */}
      <form
        onSubmit={handleManualSubmit}
        className="p-3 rounded-xl bg-[#0A100D] border border-[#16281F] flex items-center gap-2 shadow-md"
      >
        <div className="p-2 text-[#8B9992]">
          <Mic className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Or type a voice command manually (e.g. 'ZORO, show my active missions')..."
          className="flex-1 bg-transparent text-[#F5F7F6] text-xs outline-none placeholder-[#8B9992]/60"
        />
        <button
          type="submit"
          disabled={!manualInput.trim() || voiceState === 'PROCESSING'}
          className="px-4 py-2 rounded-lg bg-[#00D084] hover:bg-[#19F59A] text-[#050706] font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <span>SEND</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* 6. Tactical Voice Directives Library (Clickable Presets) */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-[#16281F]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#19F59A]" />
            <span className="font-bold text-xs text-[#F5F7F6] tracking-wider">
              TACTICAL VOICE DIRECTIVES LIBRARY
            </span>
          </div>
          <span className="text-[9px] text-[#8B9992]">CLICK ANY DIRECTIVE TO VOCALIZE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {sampleCommands.map((cmd, i) => (
            <button
              key={i}
              onClick={() => handleExecuteVoicePipeline(cmd.text)}
              className="p-3 rounded-xl bg-[#050706] border border-[#16281F] hover:border-[#00D084]/40 text-left text-xs text-[#8B9992] hover:text-[#19F59A] transition-all group flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#16281F] text-[#8B9992] group-hover:text-[#19F59A]">
                  [{cmd.cat}]
                </span>
                <p className="font-sans text-xs text-[#F5F7F6] group-hover:text-[#19F59A]">
                  "{cmd.text}"
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8B9992] group-hover:text-[#19F59A] group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* 7. Voice Interaction History Log */}
      {history.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#16281F]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#38E1FF]" />
              <span className="font-bold text-xs text-[#F5F7F6] tracking-wider">
                VOICE TELEMETRY & DIRECTIVE AUDIT LOG
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#16281F] text-[#8B9992]">
                {history.length} RECORDS
              </span>
            </div>
            <button
              onClick={clearHistory}
              className="text-[10px] text-[#8B9992] hover:text-[#FF3B30] flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>CLEAR BUFFER</span>
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] hover:border-[#16281F]/80 space-y-2 text-xs transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#00D084]/15 text-[#19F59A]">
                      {item.intent || 'VOICE_COMMAND'}
                    </span>
                    <span className="text-[9px] text-[#8B9992]">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                    {item.execution_time_ms && (
                      <span className="text-[8px] text-[#8B9992]">
                        ({item.execution_time_ms}ms)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => replayInteraction(item)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0A100D] border border-[#16281F] text-[10px] text-[#8B9992] hover:text-[#38E1FF] transition-colors"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>REPLAY</span>
                  </button>
                </div>

                <div className="font-sans text-xs text-[#F5F7F6]">
                  <span className="text-[#8B9992] font-mono text-[10px]">OPERATOR:</span> "{item.transcript}"
                </div>

                {item.actionExecuted && (
                  <div className="text-[10px] text-[#19F59A] bg-[#00D084]/10 p-1.5 rounded border border-[#00D084]/20 flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 shrink-0" />
                    <span>{item.actionExecuted}</span>
                  </div>
                )}

                <p className="font-sans text-[11px] text-[#8B9992] bg-[#0A100D] p-2 rounded border border-[#16281F]/60 line-clamp-2">
                  {item.response}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
