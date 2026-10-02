import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Paperclip,
  Image as ImageIcon,
  Sparkles,
  Clock,
  X,
  CornerDownLeft,
  Search,
} from 'lucide-react';
import { soundService } from '../../services/sound';
import { VoiceEngine, VoiceEngineState } from '../../services/voiceEngine';

interface CommandBarProps {
  onExecute: (commandText: string, imageFile?: File | null) => void;
  isExecuting?: boolean;
  onOpenVoiceHUD?: () => void;
  className?: string;
  recentCommands?: string[];
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onExecute,
  isExecuting = false,
  onOpenVoiceHUD,
  className = '',
  recentCommands = [],
}) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceEngineState>('IDLE');
  const [showHistory, setShowHistory] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to VoiceEngine
  useEffect(() => {
    const unsub = VoiceEngine.subscribe((state, data) => {
      setVoiceState(state);
      if (data?.transcript && state === 'LISTENING') {
        setInput(data.transcript);
      }
    });
    return () => unsub();
  }, []);

  // Global Ctrl + / to focus command bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        soundService.play('CLICK');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      soundService.play('CLICK');
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    soundService.play('CLICK');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = input.trim();
    if (!clean && !selectedImage) return;

    onExecute(clean, selectedImage);
    setInput('');
    handleClearImage();
    setShowHistory(false);
    soundService.play('COMMAND_RECEIVED');
  };

  const handleSuggestionClick = (cmd: string) => {
    setInput(cmd);
    onExecute(cmd, null);
    soundService.play('CLICK');
  };

  const defaultSuggestions = [
    'Continue my AI project',
    "Show today's priorities",
    'Create a new mission',
    'Analyze this image',
    'Search my memory',
    'Start focus mode',
  ];

  return (
    <div className={`w-full font-mono select-none space-y-2.5 ${className}`}>
      {/* Attached Image Thumbnail */}
      {imagePreview && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-zoro-cyan/40 bg-zoro-panelElevated/90 max-w-sm shadow-lg">
          <img
            src={imagePreview}
            alt="Attached Telemetry Image"
            className="w-12 h-12 object-cover rounded-lg border border-zoro-border"
          />
          <div className="flex-1 min-w-0 text-xs">
            <div className="font-bold text-zoro-cyan truncate">
              {selectedImage?.name}
            </div>
            <div className="text-[10px] text-zoro-textMuted">
              {Math.round((selectedImage?.size || 0) / 1024)} KB · Vision Ready
            </div>
          </div>
          <button
            onClick={handleClearImage}
            className="p-1 rounded-lg text-zoro-textMuted hover:text-zoro-critical hover:bg-zoro-panel transition-colors"
            title="Remove Image"
            aria-label="Remove Image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Command Input Box */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl border-2 border-zoro-border bg-gradient-to-r from-zoro-panelElevated to-zoro-panel shadow-2xl focus-within:border-zoro-cyan focus-within:shadow-[0_0_25px_rgba(25,217,255,0.2)] transition-all"
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          id="zoro-command-file-input"
          aria-label="Attach image for vision analysis"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 sm:p-2.5 rounded-xl text-zoro-textMuted hover:text-zoro-cyan hover:bg-zoro-panelHighlight transition-colors shrink-0"
          title="Attach image for multimodal analysis"
          aria-label="Attach Image"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Text Input Field */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            id="zoro-universal-command-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowHistory(true)}
            placeholder="Ask Zoro anything..."
            disabled={isExecuting}
            className="w-full bg-transparent text-sm sm:text-base text-zoro-text placeholder:text-zoro-textMuted focus:outline-none py-1.5"
            aria-label="Universal Command Input"
          />
        </div>

        {/* Voice Trigger Button */}
        <button
          type="button"
          onClick={() => {
            if (onOpenVoiceHUD) {
              onOpenVoiceHUD();
            } else {
              VoiceEngine.listen({
                onFinal: (txt) => {
                  if (txt.trim()) onExecute(txt);
                },
              });
            }
            soundService.play('VOICE_ACTIVATED');
          }}
          className={`p-2 sm:p-2.5 rounded-xl transition-all shrink-0 ${
            voiceState === 'LISTENING'
              ? 'bg-zoro-cyan text-black shadow-[0_0_15px_#19D9FF] animate-pulse'
              : 'text-zoro-textMuted hover:text-zoro-cyan hover:bg-zoro-panelHighlight'
          }`}
          title="Voice command (Ctrl + Space)"
          aria-label="Voice Command"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Submit Execution Button */}
        <button
          type="submit"
          disabled={isExecuting || (!input.trim() && !selectedImage)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-zoro-cyan to-zoro-blue text-black font-black text-xs tracking-wider uppercase hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(25,217,255,0.3)] shrink-0"
          aria-label="Execute Command"
        >
          <span>EXECUTE</span>
          <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </form>

      {/* Suggested Directives Row */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
        <span className="text-[10px] text-zoro-textMuted font-bold uppercase tracking-wider shrink-0">
          SUGGESTIONS:
        </span>
        {defaultSuggestions.map((sug) => (
          <button
            key={sug}
            onClick={() => handleSuggestionClick(sug)}
            className="px-2.5 py-1 rounded-lg border border-zoro-border bg-zoro-panelElevated hover:border-zoro-cyan/40 hover:bg-zoro-panelHighlight text-zoro-textSecondary hover:text-zoro-text text-[11px] whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
          >
            <span className="text-zoro-cyan font-bold">›</span>
            <span>{sug}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
