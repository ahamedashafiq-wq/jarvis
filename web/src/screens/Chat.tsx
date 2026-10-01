import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AIOrb } from '../components/AIOrb';
import { streamGeminiResponse } from '../services/gemini';
import { speechService } from '../services/speech';
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
} from 'lucide-react';
import { Conversation, Message, RoutePath } from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';

interface ChatProps {
  onNavigate: (path: RoutePath) => void;
}

export const Chat: React.FC<ChatProps> = () => {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

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
          'JARVIS Zoro Edition online. Three blades aligned. All sensory grids operational. How may I assist your command?',
        created_at: Date.now(),
      },
    ])
  );

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [orbState, setOrbState] = useState<'IDLE' | 'THINKING' | 'SPEAKING'>('IDLE');
  const abortControllerRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = getLocalStore<Message[]>(`msgs_${activeConvId}`, []);
    if (loaded.length === 0 && activeConvId === 'default') {
      setMessages([
        {
          id: 'msg_welcome',
          conversation_id: 'default',
          user_id: userId,
          role: 'assistant',
          content: 'JARVIS Zoro Edition online. Three blades aligned. How may I assist your command?',
          created_at: Date.now(),
        },
      ]);
    } else {
      setMessages(loaded);
    }
  }, [activeConvId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const prompt = input.trim();
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

    setIsStreaming(true);
    setOrbState('THINKING');
    abortControllerRef.current = false;

    const botMsgId = 'bot_' + Date.now();
    const initialBotMsg: Message = {
      id: botMsgId,
      conversation_id: activeConvId,
      user_id: userId,
      role: 'assistant',
      content: '',
      created_at: Date.now(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, initialBotMsg]);

    let accumulated = '';
    try {
      const history = updatedWithUser.map((m) => ({ role: m.role as any, content: m.content }));
      const stream = streamGeminiResponse(prompt, history);

      for await (const chunk of stream) {
        if (abortControllerRef.current) break;
        accumulated += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, content: accumulated } : m))
        );
      }
    } catch (err) {
      console.error(err);
      accumulated += '\n[COMMUNICATION ANOMALY]';
    } finally {
      setIsStreaming(false);
      setOrbState('IDLE');
      const finalMsgs = updatedWithUser.concat({
        ...initialBotMsg,
        content: accumulated,
        isStreaming: false,
      });
      setMessages(finalMsgs);
      setLocalStore(`msgs_${activeConvId}`, finalMsgs);
    }
  };

  const handleStop = () => {
    abortControllerRef.current = true;
    setIsStreaming(false);
    setOrbState('IDLE');
  };

  const createNewConversation = () => {
    const newId = 'conv_' + Date.now();
    const newConv: Conversation = {
      id: newId,
      user_id: userId,
      title: `Mission ${conversations.length + 1}`,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    setLocalStore(`convs_${userId}`, updated);
    setActiveConvId(newId);
    setMessages([]);
  };

  const deleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== convId);
    setConversations(updated);
    setLocalStore(`convs_${userId}`, updated);
    localStorage.removeItem(`jarvis_zoro_msgs_${convId}`);
    if (activeConvId === convId && updated.length > 0) {
      setActiveConvId(updated[0].id);
    }
  };

  const speakMessage = (text: string) => {
    setOrbState('SPEAKING');
    speechService.speak(text, 1.0, 1.0, undefined, () => setOrbState('IDLE'));
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#050706] text-[#F5F7F6] overflow-hidden">
      {/* Conversation History Drawer */}
      <div className="w-64 border-r border-[#16281F] bg-[#0A100D] flex flex-col justify-between hidden md:flex">
        <div className="p-3 border-b border-[#16281F]">
          <button
            onClick={createNewConversation}
            className="w-full py-2 px-3 rounded bg-[#00D084] hover:bg-[#19F59A] text-[#050706] text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(0,208,132,0.2)]"
          >
            <Plus className="w-4 h-4" />
            NEW DIRECTIVE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((c) => {
            const isActive = c.id === activeConvId;
            return (
              <div
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full p-2 rounded text-xs font-mono flex items-center justify-between cursor-pointer group transition-all ${
                  isActive
                    ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A] font-bold'
                    : 'text-[#8B9992] hover:bg-[#121C17]/50 hover:text-[#F5F7F6]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </div>
                {conversations.length > 1 && (
                  <button
                    onClick={(e) => deleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#FF3B30] transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Flow */}
      <div className="flex-1 flex flex-col h-full bg-[#050706]">
        {/* Chat Header */}
        <div className="h-12 border-b border-[#16281F] bg-[#0A100D]/50 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AIOrb state={orbState} size={32} />
            <div>
              <span className="text-xs font-mono font-bold text-[#F5F7F6] tracking-wider">
                TACTICAL INTELLIGENCE CHANNEL
              </span>
              <span className="text-[9px] font-mono text-[#00D084] ml-2 font-bold">
                STREAMING ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${
                    isUser
                      ? 'bg-[#00D084]/20 border-[#00D084] text-[#19F59A]'
                      : 'bg-[#0A100D] border-[#16281F] text-[#38E1FF]'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`rounded-lg p-3 text-xs font-mono leading-relaxed max-w-[85%] border ${
                    isUser
                      ? 'bg-[#121C17] border-[#00D084]/40 text-[#F5F7F6]'
                      : 'bg-[#0A100D] border-[#16281F] text-[#F5F7F6]'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {!isUser && !m.isStreaming && (
                    <div className="mt-2 pt-2 border-t border-[#16281F] flex items-center justify-between text-[10px] text-[#8B9992]">
                      <button
                        onClick={() => speakMessage(m.content)}
                        className="flex items-center gap-1 hover:text-[#19F59A] transition-colors"
                      >
                        <Volume2 className="w-3 h-3" /> VOCALIZE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#16281F] bg-[#0A100D]">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Transmit directive or query Gemini intelligence..."
              className="flex-1 bg-[#050706] border border-[#16281F] rounded px-3 py-2 text-xs font-mono text-[#F5F7F6] focus:border-[#00D084] focus:outline-none"
            />

            {isStreaming ? (
              <button
                onClick={handleStop}
                className="p-2 rounded bg-[#FF3B30] text-[#050706] font-bold text-xs flex items-center gap-1 hover:bg-[#FF3B30]/80 transition-colors"
                title="Halt generation"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 rounded bg-[#00D084] text-[#050706] font-bold text-xs hover:bg-[#19F59A] transition-colors disabled:opacity-40"
                title="Send directive"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
