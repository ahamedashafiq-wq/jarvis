import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsType, RoutePath } from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { speechService } from '../services/speech';
import { Settings as SettingsIcon, Volume2, Shield, Trash2, LogOut, Check, ArrowLeft, Sliders, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  onNavigate: (path: RoutePath) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const { currentSession, logout, isSupabase, createNotification, trackEvent } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [settings, setSettings] = useState<SettingsType>(() =>
    getLocalStore<SettingsType>(`settings_${userId}`, {
      user_id: userId,
      assistant_name: 'JARVIS',
      response_mode: 'TACTICAL',
      voice_enabled: true,
      voice_rate: 1.0,
      voice_volume: 1.0,
      voice_pitch: 1.0,
      theme: 'ZORO TACTICAL',
      auto_speak: false,
    })
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  const updateSetting = <K extends keyof SettingsType>(key: K, val: SettingsType[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    setLocalStore(`settings_${userId}`, updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    trackEvent('SETTING_CHANGED', JSON.stringify({ [key]: val }));
  };

  const handleTestSpeech = () => {
    speechService.speak(
      'Three blades synchronized. Speech synthesis calibrated, Commander.',
      settings.voice_rate,
      settings.voice_pitch,
      settings.voice_volume
    );
  };

  const handlePurgeConfirmed = () => {
    localStorage.removeItem(`jarvis_zoro_memories_${userId}`);
    localStorage.removeItem(`jarvis_zoro_tasks_${userId}`);
    setShowPurgeConfirm(false);
    createNotification('CACHE PURGED', 'Local memory bank and action queue reset to default.', 'WARNING');
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#19F59A]" />
            SYSTEM CONFIGURATION
          </h1>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            AI SYNAPSE BEHAVIOR • AUDIO PARAMETERS • DATA STORAGE
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-[#19F59A] text-[10px] font-bold flex items-center gap-1 animate-pulse">
              <Check className="w-3.5 h-3.5" />
              <span>SAVED</span>
            </span>
          )}
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>
        </div>
      </div>

      {/* AI Synapse Profile Section */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
        <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#19F59A]" />
          <span>BLADE 01 (INTELLIGENCE) PARAMETERS</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-[#8B9992] block mb-1">ASSISTANT CALLSIGN</label>
            <input
              type="text"
              value={settings.assistant_name}
              onChange={(e) => updateSetting('assistant_name', e.target.value)}
              className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#00D084] outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-[#8B9992] block mb-1">TACTICAL RESPONSE MODE</label>
            <select
              value={settings.response_mode}
              onChange={(e) => updateSetting('response_mode', e.target.value as any)}
              className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#00D084] outline-none"
            >
              <option value="CONCISE">CONCISE (ZERO FLUFF)</option>
              <option value="TACTICAL">TACTICAL (BALANCED & DISCIPLINED)</option>
              <option value="NORMAL">NORMAL (CONVERSATIONAL)</option>
              <option value="EXHAUSTIVE">EXHAUSTIVE (DETAILED ANALYSIS)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="font-bold text-[#F5F7F6] block">AUTOMATIC SPEECH RESPONSE</span>
            <span className="text-[10px] text-[#8B9992]">Vocalize assistant answers automatically upon generation</span>
          </div>
          <input
            type="checkbox"
            checked={settings.auto_speak}
            onChange={(e) => updateSetting('auto_speak', e.target.checked)}
            className="w-4 h-4 rounded border-[#16281F] bg-[#050706] text-[#00D084] focus:ring-0"
          />
        </div>
      </div>

      {/* Voice Synthesis Controls */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#38E1FF]" />
            <span>VOICE SYNTHESIS & ACOUSTIC PARAMETERS</span>
          </h2>
          <button
            onClick={handleTestSpeech}
            className="px-3 py-1 rounded bg-[#050706] border border-[#16281F] text-[#38E1FF] hover:border-[#38E1FF] text-[10px] font-bold"
          >
            TEST VOICE
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-[10px] text-[#8B9992] mb-1">
              <span>SPEECH SPEED RATE ({settings.voice_rate}x)</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.voice_rate}
              onChange={(e) => updateSetting('voice_rate', parseFloat(e.target.value))}
              className="w-full accent-[#38E1FF]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] text-[#8B9992] mb-1">
              <span>PITCH FREQUENCY ({settings.voice_pitch}x)</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.voice_pitch}
              onChange={(e) => updateSetting('voice_pitch', parseFloat(e.target.value))}
              className="w-full accent-[#38E1FF]"
            />
          </div>
        </div>
      </div>

      {/* Theme & Aesthetics */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
        <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#FFB000]" />
          <span>VISUAL MATRIX THEME</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['ZORO TACTICAL', 'ENMA PURPLE', 'WADO FROST', 'NIGHT RAID'].map((t) => (
            <button
              key={t}
              onClick={() => updateSetting('theme', t)}
              className={`p-3 rounded-xl border text-center transition-all ${
                settings.theme === t
                  ? 'bg-[#121C17] border-[#00D084] text-[#19F59A] font-bold'
                  : 'bg-[#050706] border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Danger Zone: Storage purge & Logout */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#FF3B30]/30 space-y-4">
        <h2 className="text-xs font-bold tracking-wider text-[#FF3B30] flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          <span>TACTICAL PURGE & REINITIALIZATION</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-[#F5F7F6] block">RESET CACHED DIRECTIVES & MEMORY</span>
            <span className="text-[10px] text-[#8B9992]">
              Flushes local storage envelopes for tasks and memories.
            </span>
          </div>

          <button
            onClick={() => setShowPurgeConfirm(true)}
            className="px-4 py-2 rounded-lg bg-[#FF3B30]/15 border border-[#FF3B30]/40 text-[#FF3B30] hover:bg-[#FF3B30] hover:text-[#F5F7F6] text-xs font-bold transition-all shrink-0"
          >
            PURGE CACHE
          </button>
        </div>

        <div className="pt-3 border-t border-[#16281F] flex items-center justify-between">
          <div>
            <span className="font-bold text-[#F5F7F6] block">TERMINATE SESSION</span>
            <span className="text-[10px] text-[#8B9992]">Safely disconnect current operator session</span>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-[#050706] border border-[#16281F] hover:border-[#FF3B30] text-[#8B9992] hover:text-[#FF3B30] text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Purge Confirm Dialog */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A100D] border border-[#FF3B30]/50 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-[#FF3B30]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm">CONFIRM PURGE DIRECTIVE</h3>
            </div>
            <p className="text-xs text-[#8B9992]">
              Are you certain you wish to wipe local memory nodes and task directives? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPurgeConfirm(false)}
                className="px-3 py-1.5 rounded text-xs text-[#8B9992] hover:text-[#F5F7F6]"
              >
                CANCEL
              </button>
              <button
                onClick={handlePurgeConfirmed}
                className="px-4 py-1.5 rounded bg-[#FF3B30] text-[#F5F7F6] font-bold text-xs hover:bg-[#FF3B30]/90"
              >
                CONFIRM PURGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
