import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Paperclip,
  Send,
  Sparkles,
  X,
  FileImage,
  ArrowRight,
  Shield,
  Loader2,
  CheckCircle2,
  Database,
  Eye,
  Cpu,
  Radio,
} from 'lucide-react';
import { CommandSurfaceState } from '../../types';
import { speechService } from '../../services/speech';
import { soundService } from '../../services/sound';

interface NeuralCommandSurfaceProps {
  onExecute: (text: string, imageFile?: File | null) => void;
  surfaceState: CommandSurfaceState;
  onOpenVoiceHUD: () => void;
  initialValue?: string;
  isExecuting?: boolean;
}

const COMMAND_SUGGESTIONS = [
  'Show active missions',
  'Continue my AI project',
  'Analyze this image',
  'Create a new task',
  'Search my memory',
  'Prepare my next development session',
];

export const NeuralCommandSurface: React.FC<NeuralCommandSurfaceProps> = ({
  onExecute,
  surfaceState,
  onOpenVoiceHUD,
  initialValue = '',
  isExecuting = false,
}) => {
  const [inputText, setInputText] = useState(initialValue);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setInputText(initialValue);
      textareaRef.current?.focus();
    }
  }, [initialValue]);

  // Global Ctrl + / to focus this surface
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        textareaRef.current?.focus();
        soundService.play('CLICK');
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, WEBP).');
        return;
      }
      setAttachedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      soundService.play('CLICK');
    }
  };

  const removeAttachment = () => {
    setAttachedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    soundService.play('CLICK');
  };

  const handleExecute = (overrideText?: string) => {
    const textToRun = overrideText !== undefined ? overrideText : inputText;
    const clean = textToRun.trim();
    if (!clean && !attachedImage) return;

    soundService.play('COMMAND_RECEIVED');
    onExecute(clean, attachedImage);
    if (!overrideText) {
      setInputText('');
      removeAttachment();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  const toggleMic = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      soundService.play('CLICK');
    } else {
      soundService.play('VOICE_ACTIVATED');
      setIsListening(true);
      speechService.startListening({
        onInterim: (text) => setInputText(text),
        onFinal: (text) => {
          setInputText(text);
          setIsListening(false);
        },
        onError: () => setIsListening(false),
      });
    }
  };

  return (
    <div className="w-full rounded-lg border border-jarvis-border bg-jarvis-surfaceElevated p-4 sm:p-6 shadow-xl space-y-4">
      {/* Title & Status Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-jarvis-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-jarvis-primary shadow-[0_0_8px_#00F5A0] animate-pulse" />
            <h1 className="text-sm sm:text-base font-bold text-jarvis-text tracking-wider font-mono">
              JARVIS NEURAL COMMAND
            </h1>
          </div>
          <p className="text-xs text-jarvis-textSecondary mt-0.5 font-mono">
            &ldquo;How can I help you, Commander?&rdquo;
          </p>
        </div>

        {/* Status Indicators Row */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-jarvis-surface border border-jarvis-border text-jarvis-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-jarvis-primary" />
            <span>CORE ONLINE</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-jarvis-surface border border-jarvis-border text-jarvis-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-jarvis-secondary" />
            <span>VOICE READY</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-jarvis-surface border border-jarvis-border text-jarvis-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-jarvis-secondary" />
            <span>VISION READY</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-jarvis-surface border border-jarvis-border text-jarvis-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-jarvis-primary" />
            <span>AGENT READY</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-jarvis-surface border border-jarvis-border text-jarvis-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-jarvis-accent" />
            <span>MEMORY SYNCED</span>
          </div>
        </div>
      </div>

      {/* Attachment Preview if any */}
      {attachedImage && imagePreviewUrl && (
        <div className="flex items-center gap-3 p-2.5 rounded border border-jarvis-secondary/40 bg-jarvis-surface w-fit text-xs font-mono">
          <img
            src={imagePreviewUrl}
            alt="Upload thumbnail"
            className="w-10 h-10 object-cover rounded border border-jarvis-border"
          />
          <div>
            <div className="text-jarvis-text font-medium truncate max-w-xs">{attachedImage.name}</div>
            <div className="text-[10px] text-jarvis-textMuted">
              {(attachedImage.size / 1024).toFixed(1)} KB • Ready for Vision Core
            </div>
          </div>
          <button
            onClick={removeAttachment}
            className="text-jarvis-textMuted hover:text-jarvis-danger p-1 transition-colors ml-2"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Large Command Field */}
      <div className="relative rounded-md border border-jarvis-border bg-jarvis-surface focus-within:border-jarvis-primary/60 focus-within:shadow-glow-primary transition-all">
        <textarea
          ref={textareaRef}
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask JARVIS anything... (e.g. 'Show active missions', 'Create a new task', 'Analyze this image', or Ctrl + K)"
          className="w-full resize-none p-3.5 bg-transparent text-jarvis-text placeholder:text-jarvis-textMuted font-mono text-sm focus:outline-none"
          id="neural-surface-command-input"
          name="neuralCommand"
          aria-label="Ask JARVIS anything"
        />

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-jarvis-border/40 bg-jarvis-surfaceElevated/50 text-xs font-mono">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
              id="neural-surface-file-input"
              aria-label="Attach file"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
                attachedImage
                  ? 'border-jarvis-secondary bg-jarvis-secondary/10 text-jarvis-secondary'
                  : 'border-jarvis-border bg-jarvis-surface text-jarvis-textSecondary hover:text-jarvis-text hover:border-jarvis-borderHover'
              }`}
              title="Attach Image / Screenshot for Vision Analysis"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ATTACH</span>
            </button>

            <button
              type="button"
              onClick={toggleMic}
              className={`px-2.5 py-1.5 rounded border transition-all flex items-center gap-1.5 ${
                isListening
                  ? 'border-jarvis-primary bg-jarvis-primary/20 text-jarvis-primary animate-pulse'
                  : 'border-jarvis-border bg-jarvis-surface text-jarvis-textSecondary hover:text-jarvis-text hover:border-jarvis-borderHover'
              }`}
              title="Voice Recognition"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isListening ? 'LISTENING...' : 'VOICE'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-[10px] text-jarvis-textMuted">
              <span>ENTER: EXECUTE</span>
              <span>•</span>
              <span>SHIFT+ENTER: NEWLINE</span>
            </div>

            <button
              type="button"
              onClick={() => handleExecute()}
              disabled={isExecuting || (!inputText.trim() && !attachedImage)}
              className={`px-4 py-1.5 rounded border font-mono text-xs font-bold flex items-center gap-1.5 transition-all ${
                inputText.trim() || attachedImage
                  ? 'border-jarvis-primary bg-jarvis-primary text-black hover:bg-jarvis-primary/90 shadow-glow-primary'
                  : 'border-jarvis-border bg-jarvis-surface text-jarvis-textMuted opacity-50 cursor-not-allowed'
              }`}
              aria-label="Execute directive"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PROCESSING</span>
                </>
              ) : (
                <>
                  <span>EXECUTE</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Command Suggestions */}
      <div className="space-y-1.5 font-mono">
        <div className="text-[10px] text-jarvis-textMuted uppercase tracking-wider font-semibold">
          SUGGESTED DIRECTIVES:
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMAND_SUGGESTIONS.map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                setInputText(cmd);
                handleExecute(cmd);
              }}
              className="px-2.5 py-1 rounded text-xs border border-jarvis-border/80 bg-jarvis-surface hover:bg-jarvis-surfaceElevated hover:border-jarvis-primary/40 text-jarvis-textSecondary hover:text-jarvis-text transition-colors flex items-center gap-1.5"
            >
              <span className="text-jarvis-primary text-[10px]">›</span>
              <span>{cmd}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
