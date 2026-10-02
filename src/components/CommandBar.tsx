import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Paperclip,
  Send,
  X,
  Compass,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { speechService } from '../services/speech';
import { RoutePath } from '../types';

interface CommandBarProps {
  onExecute: (text: string, imageFile?: File | null) => void;
  activeMissionContext?: { id: string; title: string } | null;
  onChangeContext?: () => void;
  onClearContext?: () => void;
  placeholder?: string;
  isProcessing?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onExecute,
  activeMissionContext,
  onChangeContext,
  onClearContext,
  placeholder = 'Ask JARVIS anything...',
  isProcessing = false,
  className = '',
  autoFocus = false,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  // Focus shortcut listener: Ctrl/Cmd + /
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        textInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Set autofocus
  useEffect(() => {
    if (autoFocus) {
      textInputRef.current?.focus();
    }
  }, [autoFocus]);

  // Handle Image Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    }
  };

  const removeAttachment = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setAttachedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Voice Dictation Toggle
  const toggleRecording = async () => {
    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
      if (interimText) {
        setText((prev) => (prev ? `${prev} ${interimText}` : interimText));
        setInterimText('');
      }
      return;
    }

    const perm = await speechService.requestMicrophonePermission();
    if (!perm.granted) {
      alert('Microphone access is required for voice commands.');
      return;
    }

    setIsRecording(true);
    setInterimText('');

    speechService.startListening({
      onInterim: (recognized) => {
        setInterimText(recognized);
      },
      onFinal: (recognized) => {
        setText((prev) => (prev ? `${prev} ${recognized}` : recognized));
        setInterimText('');
      },
      onError: (err) => {
        console.warn('Voice recognition notice:', err.message);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalQuery = (text + (interimText ? ` ${interimText}` : '')).trim();
    if (!finalQuery && !attachedImage) return;

    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
    }

    onExecute(finalQuery, attachedImage);
    setText('');
    setInterimText('');
    removeAttachment();
  };

  return (
    <div
      className={`relative w-full rounded-2xl bg-[#0A100D]/95 border border-[#16281F] shadow-2xl backdrop-blur-xl transition-all ${
        isProcessing ? 'border-[#00D084]/60 shadow-[0_0_20px_rgba(0,208,132,0.15)]' : 'hover:border-[#16281F]/90'
      } ${className}`}
    >
      {/* Three Blade Slash Top Accent Bar */}
      <div className="absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#00D084]/80 to-transparent pointer-events-none" />

      {/* Context Badge row if active */}
      {activeMissionContext && (
        <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-mono border-b border-[#16281F]/50">
          <div className="flex items-center gap-2">
            <span className="text-[#8B9992] flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#19F59A]" />
              CONTEXT:
            </span>
            <span className="font-bold text-[#F5F7F6] bg-[#050706] px-2 py-0.5 rounded border border-[#16281F]">
              {activeMissionContext.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onChangeContext && (
              <button
                type="button"
                onClick={onChangeContext}
                className="text-[#19F59A] hover:underline text-[10px]"
              >
                CHANGE
              </button>
            )}
            {onClearContext && (
              <button
                type="button"
                onClick={onClearContext}
                className="text-[#8B9992] hover:text-[#FF3B30] text-[10px]"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>
      )}

      {/* Attached Image Preview Pill */}
      {imagePreviewUrl && (
        <div className="px-4 pt-2 flex items-center gap-2">
          <div className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-[#050706] border border-[#00D084]/40 text-xs font-mono">
            <img
              src={imagePreviewUrl}
              alt="attachment"
              className="w-7 h-7 rounded object-cover border border-[#16281F]"
            />
            <span className="text-[#F5F7F6] max-w-[160px] truncate text-[11px]">
              {attachedImage?.name}
            </span>
            <button
              type="button"
              onClick={removeAttachment}
              className="p-1 rounded hover:bg-[#FF3B30]/20 text-[#8B9992] hover:text-[#FF3B30]"
              title="Remove attachment"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Command Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 sm:p-3">
        {/* Multimodal Attachment Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-xl border transition-all text-[#8B9992] hover:text-[#19F59A] ${
            attachedImage
              ? 'bg-[#00D084]/15 border-[#00D084] text-[#19F59A]'
              : 'bg-[#050706] border-[#16281F] hover:border-[#00D084]/40'
          }`}
          title="Attach Screenshot or Image (PNG, JPG, WEBP)"
          aria-label="Attach Screenshot or Image"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Voice Toggle Button */}
        <button
          type="button"
          onClick={toggleRecording}
          className={`p-2.5 rounded-xl border transition-all ${
            isRecording
              ? 'bg-[#FF3B30]/20 border-[#FF3B30] text-[#FF3B30] animate-pulse'
              : 'bg-[#050706] border-[#16281F] text-[#8B9992] hover:text-[#19F59A] hover:border-[#00D084]/40'
          }`}
          title={isRecording ? 'Listening (Click to finalize)' : 'Voice Dictation'}
          aria-label="Voice Dictation"
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Input Field */}
        <div className="flex-1 relative flex items-center">
          <input
            ref={textInputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isProcessing}
            placeholder={
              isRecording
                ? interimText || 'Listening to tactical directive...'
                : placeholder
            }
            className="w-full bg-transparent text-[#F5F7F6] text-xs sm:text-sm font-mono placeholder-[#8B9992]/60 outline-none pr-6"
            aria-label="Universal Command Input"
          />

          {/* Shortcut Hint */}
          <div className="hidden lg:flex items-center gap-1 text-[9px] font-mono text-[#8B9992]/60 select-none mr-1">
            <kbd className="px-1 py-0.5 rounded bg-[#050706] border border-[#16281F]">
              Ctrl
            </kbd>
            <span>+</span>
            <kbd className="px-1 py-0.5 rounded bg-[#050706] border border-[#16281F]">
              /
            </kbd>
          </div>
        </div>

        {/* Submit Execution Action Button */}
        <button
          type="submit"
          disabled={isProcessing || (!text.trim() && !attachedImage && !interimText)}
          className={`px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
            isProcessing || (!text.trim() && !attachedImage && !interimText)
              ? 'bg-[#121C17] text-[#8B9992]/40 border border-[#16281F] cursor-not-allowed'
              : 'bg-[#00D084] text-[#050706] hover:bg-[#19F59A] shadow-[0_0_12px_rgba(0,208,132,0.25)] hover:scale-[1.02]'
          }`}
          title="Execute Directive"
        >
          {isProcessing ? (
            <span className="flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#050706]" />
              <span>ROUTING</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span>EXEC</span>
              <Send className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
};
