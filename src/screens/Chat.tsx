import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AIOrb } from '../components/AIOrb';
import { streamGeminiResponse } from '../services/gemini';
import { speechService } from '../services/speech';
import {
  detectIntentWithGemini,
  executeIntent,
  extractMemoryCandidate,
  validateIntent,
} from '../services/intentRouter';
import { MemoryService } from '../services/memory';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import {
  Send,
  Square,
  RotateCcw,
  Volume2,
  Trash2,
  Plus,
  MessageSquare,
  Bot,
  User as UserIcon,
  Shield,
  CheckCircle,
  Database,
  Terminal,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import {
  Conversation,
  Message,
  RoutePath,
  Task,
  Memory,
  AIOrbState,
  DetectedIntent,
} from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { realtimeService } from '../services/realtime';
import { useToast } from '../components/Toast';

interface ChatProps {
  onNavigate: (path: RoutePath) => void;
}

export const Chat: React.FC<ChatProps> = ({ onNavigate }) => {
  const { currentSession, trackEvent, createNotification } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    getLocalStore<Conversation[]>(`convs_${userId}`, [
      {
        id: 'default',
        user_id: userId,
        title: 'Tactical Synchronization',
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ])
  );

  const [activeConvId, setActiveConvId] = useState<string>('default');
  const [messages, setMessages] = useState<Message[]>(() =>
    getLocalStore<Message[]>(`msgs_${activeConvId}`, [
      {
        id: 'msg_welcome',
        conversation_id: 'default',
        user_id: userId,
        role: 'assistant',
        content:
          'JARVIS Zoro Edition online. Three blades aligned. Persistent memory core active. How may I assist your command?',
        created_at: Date.now(),
      },
    ])
  );

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [orbState, setOrbState] = useState<AIOrbState>('IDLE');
  const [activeIntentTag, setActiveIntentTag] = useState<string | null>(null);

  // Destructive Confirmation Dialog (e.g. Memory Forget)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detail?: string;
    pendingAction?: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const abortControllerRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if we came from dashboard quick prompt
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_chat_prompt');
    if (pending) {
      sessionStorage.removeItem('pending_chat_prompt');
      setInput(pending);
      setTimeout(() => {
        handleSendPrompt(pending);
      }, 100);
    }
  }, []);

  useEffect(() => {
    const loaded = getLocalStore<Message[]>(`msgs_${activeConvId}`, []);
    if (loaded.length === 0 && activeConvId === 'default') {
      setMessages([
        {
          id: 'msg_welcome',
          conversation_id: 'default',
          user_id: userId,
          role: 'assistant',
          content:
            'JARVIS Zoro Edition online. Three blades aligned. Persistent memory core active. How may I assist your command?',
          created_at: Date.now(),
        },
      ]);
    } else {
      setMessages(loaded);
    }
  }, [activeConvId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, orbState]);

  const handleCreateConversation = () => {
    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      user_id: userId,
      title: `Directive #${conversations.length + 1}`,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    setLocalStore(`convs_${userId}`, updated);
    setActiveConvId(newConv.id);
    setMessages([]);
    trackEvent('CONVERSATION_CREATED', JSON.stringify({ id: newConv.id }));
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    setLocalStore(`convs_${userId}`, updated);
    localStorage.removeItem(`jarvis_zoro_msgs_${id}`);

    if (activeConvId === id) {
      setActiveConvId(updated[0]?.id || 'default');
    }
    trackEvent('CONVERSATION_DELETED', JSON.stringify({ id }));
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isStreaming) return;
    setInput('');

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      conversation_id: activeConvId,
      user_id: userId,
      role: 'user',
      content: prompt,
      created_at: Date.now(),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    setLocalStore(`msgs_${activeConvId}`, updatedWithUser);
    trackEvent('MESSAGE_SENT', JSON.stringify({ length: prompt.length }));

    // AI Core State Progression:
    // LISTENING -> THINKING -> ANALYZING -> EXECUTING -> SUCCESS -> IDLE
    setOrbState('THINKING');
    setIsStreaming(true);
    abortControllerRef.current = false;

    // 1. Detect Intent with Gemini / Heuristic router
    setOrbState('ANALYZING');
    const history = updatedWithUser
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const detectedIntent = await detectIntentWithGemini(prompt, history);
    setActiveIntentTag(detectedIntent.intent);

    // 2. Validate Intent
    const validation = validateIntent(detectedIntent, userId);

    // Check if missing parameters (e.g. "Create a task" without title)
    if (!validation.isValid && validation.promptUser) {
      setIsStreaming(false);
      setOrbState('IDLE');
      const clarifyMsg: Message = {
        id: 'ast_' + Date.now(),
        conversation_id: activeConvId,
        user_id: userId,
        role: 'assistant',
        content: validation.promptUser,
        created_at: Date.now(),
        intentTag: `${detectedIntent.intent}: PARAMETER REQUIRED`,
      };
      const finalWithClarify = [...updatedWithUser, clarifyMsg];
      setMessages(finalWithClarify);
      setLocalStore(`msgs_${activeConvId}`, finalWithClarify);
      return;
    }

    // Check if destructive confirmation required (e.g. "Forget my programming preference")
    if (validation.requiresConfirmation && validation.confirmationDetails) {
      setIsStreaming(false);
      setOrbState('IDLE');

      setConfirmDialog({
        isOpen: true,
        title: validation.confirmationDetails.title,
        message: validation.confirmationDetails.message,
        detail: validation.confirmationDetails.detail,
        pendingAction: async () => {
          setConfirmDialog({ isOpen: false, title: '', message: '' });
          // Execute deletion after confirmation
          const res = await executeIntent(detectedIntent, userId, onNavigate);
          const confirmMsg: Message = {
            id: 'ast_' + Date.now(),
            conversation_id: activeConvId,
            user_id: userId,
            role: 'assistant',
            content: res.message,
            created_at: Date.now(),
            intentTag: 'MEMORY_DELETE: CONFIRMED',
          };
          setMessages((prev) => {
            const next = [...prev, confirmMsg];
            setLocalStore(`msgs_${activeConvId}`, next);
            return next;
          });
        },
      });
      return;
    }

    let actionContext: string | undefined = undefined;
    let actionBadge: string | undefined = undefined;

    // 3. If intentional application command, execute safe action router
    if (detectedIntent.intent !== 'CHAT') {
      setOrbState('EXECUTING');
      const actionResult = await executeIntent(detectedIntent, userId, onNavigate);

      actionContext = actionResult.message;
      actionBadge = `${detectedIntent.intent} [${actionResult.success ? 'SUCCESS' : 'FAILED'}]`;

      if (actionResult.success) {
        setOrbState('SUCCESS');
        createNotification(
          `${detectedIntent.intent} COMPLETED`,
          actionResult.message,
          'SUCCESS'
        );
      } else {
        setOrbState('ERROR');
        createNotification(
          `${detectedIntent.intent} FAILED`,
          actionResult.message,
          'ALERT'
        );
      }
    } else {
      // Automatic memory extraction in background for general chat statements
      // e.g. "My favorite programming language is Python", "I am studying AI and Data Science"
      extractMemoryCandidate(prompt).then((candidate) => {
        if (candidate.shouldRemember && candidate.confidence >= 0.85) {
          const dup = MemoryService.detectDuplicateOrConflict(userId, candidate.content, candidate.category);
          if (!dup.isDuplicate) {
            MemoryService.saveMemory(userId, {
              content: candidate.content,
              category: candidate.category,
              importance: candidate.importance,
              source: 'AI',
            });
            createNotification(
              'MEMORY AUTOMATICALLY PRESERVED',
              `Blade 03 indexed: "${candidate.content}"`,
              'INFO'
            );
          }
        }
      });
    }

    // 4. Retrieve ONLY relevant memories for Gemini context
    const relevantMemories = MemoryService.findRelevantMemories(userId, prompt, 4);
    const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);

    // 5. Stream Assistant Response with grounded action result
    const assistantMsgId = 'ast_' + Date.now();
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      conversation_id: activeConvId,
      user_id: userId,
      role: 'assistant',
      content: '',
      created_at: Date.now(),
      isStreaming: true,
      intentTag: actionBadge || detectedIntent.intent,
    };

    setMessages([...updatedWithUser, assistantPlaceholder]);

    try {
      let accumulated = '';
      const stream = streamGeminiResponse(
        prompt,
        history,
        relevantMemories,
        tasks,
        actionContext
      );

      for await (const chunk of stream) {
        if (abortControllerRef.current) break;
        accumulated += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: accumulated, isStreaming: true } : msg
          )
        );
      }

      setMessages((prev) => {
        const finalMessages = prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: accumulated, isStreaming: false, intentTag: actionBadge || detectedIntent.intent }
            : msg
        );
        setLocalStore(`msgs_${activeConvId}`, finalMessages);
        return finalMessages;
      });

      trackEvent('MESSAGE_RECEIVED', JSON.stringify({ length: accumulated.length }));

      // Auto speak if enabled in settings
      const settings = getLocalStore<any>(`settings_${userId}`, null);
      if (settings?.auto_speak) {
        setOrbState('SPEAKING');
        speechService.speak(accumulated.slice(0, 200), settings.voice_rate, settings.voice_pitch);
        setTimeout(() => setOrbState('IDLE'), 3000);
      } else {
        setTimeout(() => setOrbState('IDLE'), 800);
      }
    } catch (err) {
      console.error(err);
      setOrbState('ERROR');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStopStream = () => {
    abortControllerRef.current = true;
    setIsStreaming(false);
    setOrbState('IDLE');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto overflow-hidden font-mono text-xs">
      {/* Conversations Drawer Sidebar */}
      <div className="w-64 border-r border-[#16281F] bg-[#0A100D] hidden md:flex flex-col justify-between shrink-0">
        <div className="p-3 border-b border-[#16281F] flex items-center justify-between">
          <span className="font-bold text-[11px] text-[#8B9992] tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#19F59A]" />
            DIRECTIVE LOGS
          </span>
          <button
            onClick={handleCreateConversation}
            className="p-1.5 rounded-lg bg-[#16281F] text-[#19F59A] hover:bg-[#00D084]/20 transition-colors"
            title="New Directive Thread"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                activeConvId === c.id
                  ? 'bg-[#16281F] text-[#19F59A] font-bold border border-[#00D084]/40 shadow-[0_0_10px_rgba(0,208,132,0.1)]'
                  : 'text-[#8B9992] hover:bg-[#16281F]/50 hover:text-[#F5F7F6]'
              }`}
            >
              <div className="truncate text-xs flex-1 pr-2">{c.title}</div>
              {conversations.length > 1 && (
                <button
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#8B9992] hover:text-[#FF3B30] transition-opacity"
                  title="Purge Thread"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Telemetry pill */}
        <div className="p-3 border-t border-[#16281F] text-[10px] text-[#8B9992] flex items-center justify-between">
          <span>AI INTEL ROUTER</span>
          <span className="text-[#19F59A] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#19F59A] animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>

      {/* Main Chat Deck */}
      <div className="flex-1 flex flex-col justify-between bg-[#050706] relative">
        {/* Top Intelligence Ribbon */}
        <div className="p-3 px-4 border-b border-[#16281F] bg-[#0A100D]/60 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="scale-75 -my-2">
              <AIOrb state={orbState} size={48} />
            </div>
            <div>
              <div className="font-bold text-xs text-[#F5F7F6] flex items-center gap-2">
                <span>JARVIS ZORO INTELLIGENCE</span>
                {activeIntentTag && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-[#19F59A]/15 text-[#19F59A] border border-[#19F59A]/30">
                    {activeIntentTag}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8B9992]">
                STATUS: {orbState} • THREE BLADES SYNCHRONIZED
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/memory')}
              className="px-2.5 py-1 rounded-lg bg-[#0A100D] border border-[#16281F] text-[#FFB000] hover:border-[#FFB000]/40 transition-colors flex items-center gap-1.5 text-[10px]"
              title="Open Blade 03 Memory Core"
            >
              <Database className="w-3 h-3" />
              <span className="hidden sm:inline">MEMORY BANK</span>
            </button>
            <button
              onClick={() => onNavigate('/commands')}
              className="px-2.5 py-1 rounded-lg bg-[#0A100D] border border-[#16281F] text-[#19F59A] hover:border-[#19F59A]/40 transition-colors flex items-center gap-1.5 text-[10px]"
              title="Open Tactical CLI"
            >
              <Terminal className="w-3 h-3" />
              <span className="hidden sm:inline">TERMINAL</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    isUser
                      ? 'bg-[#16281F] text-[#19F59A] border-[#00D084]/40'
                      : 'bg-[#0A100D] text-[#38E1FF] border-[#38E1FF]/40'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl border text-xs leading-relaxed space-y-2 relative shadow-lg ${
                    isUser
                      ? 'bg-[#16281F]/90 border-[#00D084]/40 text-[#F5F7F6]'
                      : 'bg-[#0A100D] border-[#16281F] text-[#F5F7F6]'
                  }`}
                >
                  {/* Intent Badge if present */}
                  {msg.intentTag && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-[#19F59A]/10 text-[#19F59A] border border-[#19F59A]/20">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{msg.intentTag}</span>
                    </div>
                  )}

                  {/* Body text */}
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px]">
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-3.5 ml-1 bg-[#19F59A] animate-pulse" />
                    )}
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between text-[9px] text-[#8B9992] pt-1">
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isUser && (
                      <button
                        onClick={() => speechService.speak(msg.content)}
                        className="hover:text-[#19F59A] transition-colors p-1"
                        title="Vocalize response"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#16281F] bg-[#0A100D] space-y-2">
          {/* Quick suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[10px] text-[#8B9992]">
            <span className="shrink-0 text-[#19F59A] font-bold">DIRECTIVE CUES:</span>
            {[
              'Remember that my favorite programming language is Python.',
              'What do you remember about my programming preferences?',
              'Create a high priority task called Finish AI project.',
              'Show my tasks.',
              'Start a 25 minute focus session.',
              'What’s the system status?',
            ].map((cue, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(cue)}
                className="px-2.5 py-1 rounded bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] hover:border-[#19F59A]/40 transition-colors shrink-0 truncate max-w-[220px]"
                title={cue}
              >
                {cue}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="State tactical directive, question, or memory cue..."
              disabled={isStreaming}
              className="flex-1 bg-[#050706] border border-[#16281F] rounded-xl px-4 py-3 text-xs text-[#F5F7F6] placeholder-[#8B9992] focus:border-[#19F59A] focus:ring-1 focus:ring-[#19F59A] outline-none transition-all font-mono"
            />

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopStream}
                className="px-4 py-3 rounded-xl bg-[#FF3B30] text-[#F5F7F6] font-bold hover:bg-[#FF4D42] transition-colors flex items-center gap-1.5"
                title="Halt output"
              >
                <Square className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">HALT</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-4 py-3 rounded-xl bg-[#19F59A] text-[#050706] font-bold hover:bg-[#00D084] transition-all disabled:opacity-40 disabled:hover:bg-[#19F59A] flex items-center gap-1.5 shadow-[0_0_15px_rgba(25,245,154,0.3)]"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">DISPATCH</span>
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive Operations */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        detail={confirmDialog.detail}
        confirmLabel="FORGET"
        cancelLabel="CANCEL"
        danger={true}
        onConfirm={() => {
          if (confirmDialog.pendingAction) {
            confirmDialog.pendingAction();
          }
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
};
