import React from 'react';
import {
  Wifi,
  WifiOff,
  Database,
  Radio,
  Sparkles,
  Mic,
  Eye,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useRealtime } from '../../hooks/useRealtime';
import { speechService } from '../../services/speech';

interface SystemStatusBarProps {
  isSupabaseConfigured: boolean;
  onReconnect?: () => void;
}

export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({
  isSupabaseConfigured,
  onReconnect,
}) => {
  const { connectionStatus, networkStatus, isConnected, isOnline, reconnect } = useRealtime();

  const handleReconnect = () => {
    reconnect();
    onReconnect?.();
  };

  return (
    <div className="flex flex-col space-y-1 font-mono text-[10px]">
      {/* Offline Alert Banner if network is lost (Section 23 & 24) */}
      {!isOnline && (
        <div className="px-3 py-1.5 rounded-lg bg-[#FF3B30]/15 border border-[#FF3B30] text-[#FF3B30] flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="font-bold">CONNECTION LOST: Attempting to reconnect...</span>
            <span className="hidden sm:inline text-[#8B9992] text-[9px]">
              Offline navigation active. Server-side mutations require connection.
            </span>
          </div>

          <button
            onClick={handleReconnect}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#FF3B30] text-[#050706] font-bold text-[9px] hover:bg-[#FF3B30]/90"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>RETRY</span>
          </button>
        </div>
      )}

      {/* Main Persistent Status Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[#8B9992] flex-wrap">
        {/* Core State */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#050706] border border-[#00D084]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#19F59A] animate-pulse" />
          <span className="font-bold text-[#19F59A]">CORE ONLINE</span>
        </div>

        {/* Database State */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#050706] border border-[#16281F]">
          <Database className="w-3 h-3 text-[#38E1FF]" />
          <span className="hidden sm:inline">DB:</span>
          <span className={`font-bold ${isOnline ? 'text-[#38E1FF]' : 'text-[#FF3B30]'}`}>
            {isOnline ? (isSupabaseConfigured ? 'CONNECTED' : 'LOCAL') : 'OFFLINE'}
          </span>
        </div>

        {/* AI State */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#050706] border border-[#16281F]">
          <Sparkles className="w-3 h-3 text-[#19F59A]" />
          <span>AI:</span>
          <span className="font-bold text-[#19F59A]">READY</span>
        </div>

        {/* Voice State */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#050706] border border-[#16281F]">
          <Mic className="w-3 h-3 text-[#38E1FF]" />
          <span>VOICE:</span>
          <span className="font-bold text-[#38E1FF]">
            {speechService.isRecognitionSupported() ? 'READY' : 'TEXT ONLY'}
          </span>
        </div>

        {/* Vision State */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#050706] border border-[#16281F]">
          <Eye className="w-3 h-3 text-[#19F59A]" />
          <span>VISION:</span>
          <span className="font-bold text-[#19F59A]">READY</span>
        </div>

        {/* Realtime State */}
        <div
          onClick={handleReconnect}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#050706] border border-[#16281F] cursor-pointer hover:border-[#00D084]/40"
          title="Click to verify realtime connection"
        >
          {isOnline ? (
            <Wifi className="w-3 h-3 text-[#19F59A]" />
          ) : (
            <WifiOff className="w-3 h-3 text-[#FF3B30]" />
          )}
          <span>RT:</span>
          <span
            className={`font-bold ${
              !isOnline
                ? 'text-[#FF3B30]'
                : isConnected
                ? 'text-[#19F59A]'
                : 'text-[#FFB000]'
            }`}
          >
            {!isOnline ? 'OFFLINE' : isConnected ? 'CONNECTED' : connectionStatus}
          </span>
        </div>
      </div>
    </div>
  );
};
