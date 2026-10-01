import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsType, RoutePath } from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { isGeminiConfigured } from '../services/gemini';
import { speechService } from '../services/speech';
import { Settings as SettingsIcon, Volume2, Shield, Trash2, LogOut, Check } from 'lucide-react';

interface SettingsProps {
  onNavigate: (path: RoutePath) => void;
}

export const Settings: React.FC<SettingsProps> = () => {
  const { currentSession, logout, isSupabase } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [settings, setSettings] = useState<SettingsType>(() =>
    getLocalStore<SettingsType>(`settings_${userId}`, {
      user_id: userId,
      assistant_name: 'JARVIS',
      response_mode: 'TACTICAL',
      voice_enabled: true,
      voice_rate: 1.0,
      voice_pitch: 1.0,
      theme: 'ZORO TACTICAL',
      auto_speak: false,
    })
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const updateSetting = <K extends keyof SettingsType>(key: K, val: SettingsType[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    setLocalStore(`settings_${userId}`, updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleTestSpeech = () => {
    speechService.speak(
      'Three blades synchronized. Speech synthesis calibrated, Commander.',
      settings.voice_rate,
      settings.voice_pitch
    );
  };

  const handleClearMemories = () => {
    if (confirm('CONFIRM PURGE: Clear all persistent memory nodes from storage?')) {
      localStorage.removeItem(`jarvis_zoro_memories_${userId}`);
      alert('Memory bank purged.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider">
            SYSTEM CONFIGURATION
          </h1>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            VOICE SYNAPSE, INTELLIGENCE PARAMETERS & STORAGE
          </p>
        </div>

        {savedSuccess && (
          <span className="text-[#19F59A] flex items-center gap-1 font-bold">
            <Check className="w-3.5 h-3.5" /> PARAMETERS SAVED
          </span>
        )}
      </div>

      {/* Voice Parameters Card */}
      <div className="p-5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-4">
        <h2 className="text-sm font-bold text-[#19F59A] tracking-wider flex items-center gap-2">
          <Volume2 className="w-4 h-4" /> SPEECH SYNTHESIS ENGINE
        </h2>

        <div className="space-y-3 max-w-md">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[#8B9992]">SPEECH RATE: {settings.voice_rate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.voice_rate}
              onChange={(e) => updateSetting('voice_rate', parseFloat(e.target.value))}
              className="w-full accent-[#00D084]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[#8B9992]">SPEECH PITCH: {settings.voice_pitch}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.voice_pitch}
              onChange={(e) => updateSetting('voice_pitch', parseFloat(e.target.value))}
              className="w-full accent-[#00D084]"
            />
          </div>

          <button
            onClick={handleTestSpeech}
            className="py-1.5 px-3 rounded bg-[#121C17] border border-[#00D084]/40 text-[#19F59A] hover:bg-[#00D084] hover:text-[#050706] font-bold transition-all"
          >
            TEST VOCALIZATION
          </button>
        </div>
      </div>

      {/* AI & Response Modes */}
      <div className="p-5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-4">
        <h2 className="text-sm font-bold text-[#19F59A] tracking-wider">
          AI SYNAPSE & RESPONSE MODES
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['CONCISE', 'NORMAL', 'TACTICAL', 'EXHAUSTIVE'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSetting('response_mode', mode)}
              className={`p-3 rounded border text-center transition-all ${
                settings.response_mode === mode
                  ? 'bg-[#121C17] border-[#00D084] text-[#19F59A] font-bold'
                  : 'bg-[#050706] border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="p-3 rounded bg-[#050706] border border-[#16281F] space-y-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-[#8B9992]">GEMINI INTELLIGENCE:</span>
            <span className={isGeminiConfigured ? 'text-[#19F59A] font-bold' : 'text-[#FFB000]'}>
              {isGeminiConfigured ? 'LIVE API KEY CONFIGURED' : 'SANDBOX SIMULATED SYNAPSE'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8B9992]">DATABASE BACKEND:</span>
            <span className={isSupabase ? 'text-[#38E1FF] font-bold' : 'text-[#FFB000]'}>
              {isSupabase ? 'SUPABASE POSTGRESQL' : 'LOCAL ISOLATED STORAGE'}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-xl bg-[#0A100D] border border-[#FF3B30]/30 space-y-3">
        <h2 className="text-sm font-bold text-[#FF3B30] tracking-wider">
          TACTICAL DATA & SESSION CONTROL
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleClearMemories}
            className="flex-1 py-2 px-3 rounded bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white transition-all font-bold flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> PURGE MEMORY BANK
          </button>
          <button
            onClick={logout}
            className="flex-1 py-2 px-3 rounded bg-[#050706] border border-[#FF3B30]/30 text-[#FF3B30] hover:bg-[#FF3B30]/20 transition-all font-bold flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> TERMINATE SESSION
          </button>
        </div>
      </div>

      <div className="text-center text-[10px] text-[#8B9992] pt-4">
        JARVIS — ZORO EDITION v2.0.0 • THREE BLADES. ONE INTELLIGENCE.
      </div>
    </div>
  );
};
