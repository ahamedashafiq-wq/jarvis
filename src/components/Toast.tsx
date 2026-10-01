import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToastNotification } from '../types';
import {
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  Database,
  Terminal,
  Activity,
  Sparkles,
  X,
  Radio,
} from 'lucide-react';

interface ToastContextType {
  toasts: ToastNotification[];
  showToast: (title: string, message: string, type?: ToastNotification['type']) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const recentToastsRef = useRef<Map<string, number>>(new Map());

  const showToast = useCallback(
    (title: string, message: string, type: ToastNotification['type'] = 'INFO') => {
      // Deduplication: Avoid showing identical toasts within 2.5 seconds
      const key = `${title}__${message}`;
      const now = Date.now();
      const lastShown = recentToastsRef.current.get(key);
      if (lastShown && now - lastShown < 2500) {
        return;
      }
      recentToastsRef.current.set(key, now);

      const id = 'toast_' + now + '_' + Math.random().toString(36).substring(2, 6);
      const newToast: ToastNotification = {
        id,
        title,
        message,
        type,
        created_at: now,
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 4));

      // Auto dismiss after 3.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {/* Toast HUD Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none font-mono text-xs">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem: React.FC<{ toast: ToastNotification; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  const getTheme = () => {
    switch (toast.type) {
      case 'SUCCESS':
      case 'TASK':
        return {
          border: 'border-[#19F59A]/50',
          bg: 'bg-[#0A100D]/95',
          text: 'text-[#19F59A]',
          glow: 'shadow-[0_0_20px_rgba(25,245,154,0.15)]',
          icon: <CheckCircle className="w-4 h-4 text-[#19F59A]" />,
        };
      case 'MEMORY':
        return {
          border: 'border-[#FFB000]/50',
          bg: 'bg-[#0A100D]/95',
          text: 'text-[#FFB000]',
          glow: 'shadow-[0_0_20px_rgba(255,176,0,0.15)]',
          icon: <Database className="w-4 h-4 text-[#FFB000]" />,
        };
      case 'COMMAND':
        return {
          border: 'border-[#38E1FF]/50',
          bg: 'bg-[#0A100D]/95',
          text: 'text-[#38E1FF]',
          glow: 'shadow-[0_0_20px_rgba(56,225,255,0.15)]',
          icon: <Terminal className="w-4 h-4 text-[#38E1FF]" />,
        };
      case 'SYSTEM':
        return {
          border: 'border-[#19F59A]/40',
          bg: 'bg-[#0A100D]/95',
          text: 'text-[#19F59A]',
          glow: 'shadow-[0_0_20px_rgba(25,245,154,0.15)]',
          icon: <Radio className="w-4 h-4 text-[#19F59A]" />,
        };
      case 'WARNING':
        return {
          border: 'border-[#FFB000]/60',
          bg: 'bg-[#0A100D]/95',
          text: 'text-[#FFB000]',
          glow: 'shadow-[0_0_20px_rgba(255,176,0,0.2)]',
          icon: <AlertTriangle className="w-4 h-4 text-[#FFB000]" />,
        };
      case 'ERROR':
      case 'ALERT':
        return {
          border: 'border-[#FF3B30]/60',
          bg: 'bg-[#0A100D]/95',
          text: 'text-[#FF3B30]',
          glow: 'shadow-[0_0_25px_rgba(255,59,48,0.25)]',
          icon: <XCircle className="w-4 h-4 text-[#FF3B30]" />,
        };
      case 'AI':
        return {
          border: 'border-[#38E1FF]/60',
          bg: 'bg-[#0A100D]/95',
          text: 'text-[#38E1FF]',
          glow: 'shadow-[0_0_20px_rgba(56,225,255,0.2)]',
          icon: <Sparkles className="w-4 h-4 text-[#38E1FF]" />,
        };
      default:
        return {
          border: 'border-[#16281F]',
          bg: 'bg-[#0A100D]/95',
          text: 'text-[#8B9992]',
          glow: 'shadow-lg',
          icon: <Info className="w-4 h-4 text-[#19F59A]" />,
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-xl border ${theme.border} ${theme.bg} ${theme.glow} backdrop-blur-md transition-all animate-slide-up flex items-start gap-3 relative`}
    >
      <div className="shrink-0 mt-0.5">{theme.icon}</div>
      <div className="flex-1 pr-4">
        <div className={`font-bold text-[11px] tracking-wide ${theme.text}`}>{toast.title}</div>
        <div className="text-[#8B9992] text-[10px] mt-0.5 leading-relaxed font-sans">
          {toast.message}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-[#8B9992] hover:text-[#F5F7F6] p-1 -mr-1 -mt-1 transition-colors"
        title="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
