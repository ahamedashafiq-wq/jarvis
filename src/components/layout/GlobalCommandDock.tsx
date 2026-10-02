import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Mic,
  Send,
  Sparkles,
  X,
  FileImage,
  ArrowRight,
  Shield,
  Loader2,
} from 'lucide-react';
import { speechService } from '../../services/speech';
import { soundService } from '../../services/sound';

interface GlobalCommandDockProps {
  onExecuteCommand: (text: string, imageFile?: File | null) => void;
  onOpenVoiceHUD: () => void;
  activeContextTitle?: string;
  isExecuting?: boolean;
}

export const GlobalCommandDock: React.FC<GlobalCommandDockProps> = ({
  onExecuteCommand,
  onOpenVoiceHUD,
  activeContextTitle = 'AI Assistant',
  isExecuting = false,
}) => {
  const [commandText, setCommandText] = useState('');
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isListeningDirect, setIsListeningDirect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Global Ctrl + / shortcut to focus the dock
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = commandText.trim();
    if (!clean && !attachedImage) return;

    soundService.play('COMMAND_RECEIVED');
    onExecuteCommand(clean, attachedImage);
    setCommandText('');
    removeAttachment();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDirectMicToggle = () => {
    if (isListeningDirect) {
      speechService.stopListening();
      setIsListeningDirect(false);
      soundService.play('CLICK');
    } else {
      soundService.play('VOICE_ACTIVATED');
      setIsListeningDirect(true);
      speechService.startListening({
        onInterim: (text) => {
          setCommandText(text);
        },
        onFinal: (text) => {
          setCommandText(text);
          setIsListeningDirect(false);
        },
        onError: (err) => {
          console.warn('Direct mic error', err);
          setIsListeningDirect(false);
        },
      });
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-jarvis-border/80 bg-jarvis-bg/85 backdrop-blur-xl px-4 py-2.5 transition-all">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        {/* Attachment preview banner */}
        {attachedImage && imagePreviewUrl && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-jarvis-secondary/40 bg-jarvis-surfaceElevated w-fit text-xs font-mono">
            <FileImage className="w-3.5 h-3.5 text-jarvis-secondary" />
            <span className="text-jarvis-text truncate max-w-xs">{attachedImage.name}</span>
            <button
              onClick={removeAttachment}
              className="text-jarvis-textMuted hover:text-jarvis-danger transition-colors p-0.5"
              aria-label="Remove image attachment"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Command bar input row */}
        <div className="flex items-center gap-2">
          {/* Active Context Capsule */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 rounded border border-jarvis-border bg-jarvis-surface text-[11px] font-mono text-jarvis-textSecondary shrink-0">
            <span className="text-jarvis-textMuted">CONTEXT:</span>
            <span className="text-jarvis-primary font-medium truncate max-w-[130px]">
              {activeContextTitle}
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
            id="dock-attachment-input"
            aria-label="Upload image or file"
          />

          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded border transition-colors shrink-0 flex items-center justify-center ${
              attachedImage
                ? 'border-jarvis-secondary bg-jarvis-secondary/10 text-jarvis-secondary'
                : 'border-jarvis-border bg-jarvis-surface text-jarvis-textSecondary hover:text-jarvis-text hover:border-jarvis-borderHover'
            }`}
            title="Attach Image / Screenshot for Vision Analysis"
            aria-label="Attach Image"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={handleDirectMicToggle}
            className={`p-2 rounded border transition-all shrink-0 flex items-center justify-center ${
              isListeningDirect
                ? 'border-jarvis-primary bg-jarvis-primary/20 text-jarvis-primary shadow-[0_0_12px_rgba(0,245,160,0.5)] animate-pulse'
                : 'border-jarvis-border bg-jarvis-surface text-jarvis-textSecondary hover:text-jarvis-text hover:border-jarvis-borderHover'
            }`}
            title={isListeningDirect ? 'Listening... click to stop' : 'Direct Voice Command (or Ctrl+Space for Full Voice HUD)'}
            aria-label="Microphone command"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Input field */}
          <div className="flex-1 relative flex items-center">
            <textarea
              ref={inputRef}
              rows={1}
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="JARVIS OS Universal Command... (e.g. 'Show active missions', 'Create task', or Ctrl+K)"
              className="w-full resize-none py-2 px-3 rounded border border-jarvis-border bg-jarvis-surface text-jarvis-text placeholder:text-jarvis-textMuted text-xs font-mono focus:border-jarvis-primary/60 focus:bg-jarvis-surfaceElevated transition-all focus:outline-none"
              id="dock-universal-command-input"
              name="universalCommand"
              aria-label="Universal Command Input"
            />
            <div className="hidden sm:flex absolute right-2.5 items-center gap-1 text-[9px] font-mono text-jarvis-textMuted pointer-events-none">
              <span>CTRL</span>
              <span>+</span>
              <span>/</span>
            </div>
          </div>

          {/* Execute Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isExecuting || (!commandText.trim() && !attachedImage)}
            className={`px-3.5 py-2 rounded border font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              commandText.trim() || attachedImage
                ? 'border-jarvis-primary bg-jarvis-primary text-black hover:bg-jarvis-primary/90 shadow-glow-primary'
                : 'border-jarvis-border bg-jarvis-surface text-jarvis-textMuted opacity-50 cursor-not-allowed'
            }`}
            aria-label="Execute Command"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">PROCESSING</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">EXEC</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};
