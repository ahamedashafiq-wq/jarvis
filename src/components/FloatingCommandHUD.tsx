import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Paperclip,
  Send,
  X,
  Sparkles,
  Command as CommandIcon,
  ChevronUp,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { speechService } from '../services/speech';
import { RoutePath } from '../types';

interface FloatingCommandHUDProps {
  onExecute: (text: string, imageFile?: File | null) => void;
  onOpenFullSurface: () => void;
  currentPath: RoutePath;
}

export const FloatingCommandHUD: React.FC<FloatingCommandHUDProps> = ({
  onExecute,
  onOpenFullSurface,
  currentPath,
}) => {
  // Hide if already on /command or /commands or /voice
  if (currentPath === '/command' || currentPath === '/commands' || currentPath === '/voice') {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Shortcut Ctrl/Cmd + / expands and focuses
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isExpanded]);

  const toggleRecording = async () => {
    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
      return;
    }

    const perm = await speechService.requestMicrophonePermission();
    if (!perm.granted) return;

    setIsRecording(true);
    speechService.startListening({
      onInterim: (recognized) => {},
      onFinal: (recognized) => {
        setText((prev) => (prev ? `${prev} ${recognized}` : recognized));
      },
      onError: () => setIsRecording(false),
      onEnd: () => setIsRecording(false),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachedImage) return;

    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
    }

    onExecute(text, attachedImage);
    setText('');
    setAttachedImage(null);
    setIsExpanded(false);
    onOpenFullSurface();
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 hidden md:block font-mono">
      {!isExpanded ? (
        // Compact floating trigger pill
        <div
          onClick={() => {
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#0A100D]/95 border border-[#00D084]/40 hover:border-[#19F59A] text-[#19F59A] shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105"
          title="Open Floating Command HUD (Ctrl + /)"
        >
          <div className="w-2 h-2 rounded-full bg-[#19F59A] animate-pulse" />
          <CommandIcon className="w-4 h-4 text-[#19F59A]" />
          <span className="text-xs font-bold tracking-wider text-[#F5F7F6]">
            COMMAND HUD
          </span>
          <span className="text-[10px] text-[#8B9992] bg-[#050706] px-1.5 py-0.5 rounded border border-[#16281F]">
            Ctrl+/
          </span>
        </div>
      ) : (
        // Expanded compact command card
        <div className="w-80 sm:w-96 rounded-2xl bg-[#0A100D]/95 border border-[#16281F] shadow-2xl backdrop-blur-xl p-3 space-y-2.5 animate-scaleUp">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#16281F]/60 text-xs">
            <div className="flex items-center gap-1.5 text-[#19F59A] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>JARVIS COMMAND HUD</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenFullSurface}
                className="text-[10px] text-[#8B9992] hover:text-[#19F59A] px-1.5 py-0.5 rounded border border-[#16281F] hover:border-[#00D084]/40"
              >
                EXPAND DECK
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded text-[#8B9992] hover:text-[#FF3B30]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask JARVIS anything..."
              className="w-full bg-[#050706] p-2.5 rounded-xl border border-[#16281F] text-xs text-[#F5F7F6] outline-none placeholder-[#8B9992]/60 focus:border-[#00D084]/60 font-mono"
            />

            {attachedImage && (
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#050706] border border-[#00D084]/40 text-[10px] text-[#19F59A]">
                <span className="truncate max-w-[200px]">{attachedImage.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="text-[#8B9992] hover:text-[#FF3B30]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAttachedImage(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A]"
                  title="Attach Screenshot"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-lg border ${
                    isRecording
                      ? 'bg-[#FF3B30]/20 border-[#FF3B30] text-[#FF3B30]'
                      : 'bg-[#050706] border-[#16281F] text-[#8B9992] hover:text-[#19F59A]'
                  }`}
                  title="Voice Command"
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!text.trim() && !attachedImage}
                className="px-3 py-1.5 rounded-xl bg-[#00D084] text-[#050706] font-bold text-xs hover:bg-[#19F59A] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>RUN</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
