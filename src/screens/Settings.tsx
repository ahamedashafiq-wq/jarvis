import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsType, RoutePath, PredictiveSettings } from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { speechService } from '../services/speech';
import { IntelligenceService } from '../services/intelligence';
import {
  Settings as SettingsIcon,
  User,
  Sliders,
  Volume2,
  Eye,
  Database,
  Bell,
  Zap,
  TrendingUp,
  Monitor,
  Shield,
  Info,
  Check,
  ArrowLeft,
  Trash2,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface SettingsProps {
  onNavigate: (path: RoutePath) => void;
}

type SettingsSection =
  | 'ACCOUNT'
  | 'APPEARANCE'
  | 'VOICE'
  | 'VISION'
  | 'MEMORY'
  | 'NOTIFICATIONS'
  | 'AUTOMATION'
  | 'INTELLIGENCE'
  | 'WORKSPACE'
  | 'SECURITY'
  | 'ABOUT ZORO';

export const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const { currentSession, logout, isSupabase, createNotification, trackEvent } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [activeTab, setActiveTab] = useState<SettingsSection>('ACCOUNT');

  const [settings, setSettings] = useState<SettingsType>(() =>
    getLocalStore<SettingsType>(`settings_${userId}`, {
      user_id: userId,
      assistant_name: 'ZORO',
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

  const [predSettings, setPredSettings] = useState<PredictiveSettings>(() =>
    IntelligenceService.getSettings(userId)
  );

  // Vision settings
  const [visionSettings, setVisionSettings] = useState(() =>
    getLocalStore(`vision_settings_${userId}`, {
      highPrecisionOCR: true,
      autoAnalyzeUploaded: true,
      securitySanitization: true,
    })
  );

  // Workspace settings
  const [workspaceSettings, setWorkspaceSettings] = useState(() =>
    getLocalStore(`workspace_settings_${userId}`, {
      defaultPreset: 'COMMAND',
      autoSnapWindows: true,
      rememberWindowPositions: true,
      reducedMotion: false,
    })
  );

  const notifySaved = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const updateSetting = <K extends keyof SettingsType>(key: K, val: SettingsType[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    setLocalStore(`settings_${userId}`, updated);
    notifySaved();
    trackEvent('SETTING_CHANGED', JSON.stringify({ [key]: val }));
  };

  const togglePredSetting = (key: keyof PredictiveSettings) => {
    const updated = IntelligenceService.updateSettings(userId, { [key]: !predSettings[key] });
    setPredSettings(updated);
    notifySaved();
    trackEvent('PREDICTIVE_SETTING_CHANGED', JSON.stringify({ [key]: updated[key] }));
  };

  const updateVisionSetting = (key: string, val: boolean) => {
    const updated = { ...visionSettings, [key]: val };
    setVisionSettings(updated);
    setLocalStore(`vision_settings_${userId}`, updated);
    notifySaved();
  };

  const updateWorkspaceSetting = (key: string, val: any) => {
    const updated = { ...workspaceSettings, [key]: val };
    setWorkspaceSettings(updated);
    setLocalStore(`workspace_settings_${userId}`, updated);
    notifySaved();
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
    localStorage.removeItem(`tasks_${userId}`);
    setShowPurgeConfirm(false);
    createNotification('CACHE PURGED', 'Local memory bank and action queue reset to default.', 'WARNING');
  };

  const navItems: { section: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { section: 'ACCOUNT', label: 'Account', icon: <User className="w-3.5 h-3.5" /> },
    { section: 'APPEARANCE', label: 'Appearance', icon: <Sliders className="w-3.5 h-3.5" /> },
    { section: 'VOICE', label: 'Voice', icon: <Volume2 className="w-3.5 h-3.5 text-[#38E1FF]" /> },
    { section: 'VISION', label: 'Vision', icon: <Eye className="w-3.5 h-3.5 text-[#19F59A]" /> },
    { section: 'MEMORY', label: 'Memory', icon: <Database className="w-3.5 h-3.5 text-[#FFB000]" /> },
    { section: 'NOTIFICATIONS', label: 'Notifications', icon: <Bell className="w-3.5 h-3.5 text-[#19F59A]" /> },
    { section: 'AUTOMATION', label: 'Automation', icon: <Zap className="w-3.5 h-3.5 text-[#FFB000]" /> },
    { section: 'INTELLIGENCE', label: 'Intelligence', icon: <TrendingUp className="w-3.5 h-3.5 text-[#38E1FF]" /> },
    { section: 'WORKSPACE', label: 'Workspace', icon: <Monitor className="w-3.5 h-3.5 text-[#38E1FF]" /> },
    { section: 'SECURITY', label: 'Security', icon: <Shield className="w-3.5 h-3.5 text-[#FF3B30]" /> },
    { section: 'ABOUT ZORO', label: 'About ZORO 2.0', icon: <Info className="w-3.5 h-3.5 text-[#19F59A]" /> },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-mono text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#19F59A]" />
            SYSTEM CONFIGURATION
          </h1>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            ZORO 2.0 • AI COMMAND CENTER & TELEMETRY DECK
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
            onClick={() => onNavigate('/command')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND CENTER</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Tabs + Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="space-y-1 md:border-r md:border-[#16281F] md:pr-4">
          <div className="text-[9px] font-bold text-[#8B9992] uppercase px-3 py-1 tracking-wider">
            Configuration Sections
          </div>
          {navItems.map((item) => (
            <button
              key={item.section}
              onClick={() => setActiveTab(item.section)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left ${
                activeTab === item.section
                  ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A] font-bold shadow-[0_0_10px_rgba(0,208,132,0.15)]'
                  : 'text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#121C17]/40 border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Section Content Area */}
        <div className="md:col-span-3 space-y-5">
          {/* 1. ACCOUNT */}
          {activeTab === 'ACCOUNT' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
              <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
                <User className="w-4 h-4 text-[#19F59A]" />
                <span>OPERATOR ACCOUNT & CREDENTIALS</span>
              </h2>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
                  <span className="text-[10px] text-[#8B9992] block">OPERATOR ID</span>
                  <span className="text-xs font-bold text-[#F5F7F6]">{userId}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
                  <span className="text-[10px] text-[#8B9992] block">PRIMARY EMAIL</span>
                  <span className="text-xs font-bold text-[#38E1FF]">
                    {currentSession?.email || 'operator@jarvis.local'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
                  <span className="text-[10px] text-[#8B9992] block">DATABASE PERSISTENCE</span>
                  <span className={`text-xs font-bold ${isSupabase ? 'text-[#19F59A]' : 'text-[#FFB000]'}`}>
                    {isSupabase ? 'SUPABASE POSTGRESQL (RLS SECURED)' : 'BROWSER LOCAL STORAGE (SANDBOX)'}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF3B30]/15 border border-[#FF3B30]/50 text-[#FF3B30] hover:bg-[#FF3B30]/25 transition-colors font-bold text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>TERMINATE OPERATOR SESSION (LOGOUT)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. APPEARANCE */}
          {activeTab === 'APPEARANCE' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
              <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#FFB000]" />
                <span>VISUAL MATRIX & THEME PARAMETERS</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-2">COLOR PALETTE PRESET</label>
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

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                  <div>
                    <span className="font-bold text-[#F5F7F6] block">REDUCED MOTION (A11Y)</span>
                    <span className="text-[10px] text-[#8B9992]">Minimize blade slash animations and transitions</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={workspaceSettings.reducedMotion}
                    onChange={(e) => updateWorkspaceSetting('reducedMotion', e.target.checked)}
                    className="w-4 h-4 rounded border-[#16281F] bg-[#0A100D] text-[#00D084] focus:ring-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. VOICE */}
          {activeTab === 'VOICE' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#38E1FF]" />
                  <span>VOICE SYNTHESIS & SPEECH RECOGNITION</span>
                </h2>
                <button
                  onClick={handleTestSpeech}
                  className="px-3 py-1 rounded bg-[#050706] border border-[#16281F] text-[#38E1FF] hover:border-[#38E1FF] text-[10px] font-bold"
                >
                  TEST SYNTHESIS
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                  <div>
                    <span className="font-bold text-[#F5F7F6] block">AUTOMATIC SPEECH RESPONSE</span>
                    <span className="text-[10px] text-[#8B9992]">Vocalize answers automatically via web speech API</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.auto_speak}
                    onChange={(e) => updateSetting('auto_speak', e.target.checked)}
                    className="w-4 h-4 rounded border-[#16281F] bg-[#0A100D] text-[#00D084] focus:ring-0"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#8B9992] mb-1">
                    <span>SPEECH RATE ({settings.voice_rate}x)</span>
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
          )}

          {/* 4. VISION */}
          {activeTab === 'VISION' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
              <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#19F59A]" />
                <span>VISION CORE & MULTIMODAL TELEMETRY</span>
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                  <div>
                    <span className="font-bold text-[#F5F7F6] block">HIGH-PRECISION OCR EXTRACTION</span>
                    <span className="text-[10px] text-[#8B9992]">Extract code snippets, error traces, and diagrams</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={visionSettings.highPrecisionOCR}
                    onChange={(e) => updateVisionSetting('highPrecisionOCR', e.target.checked)}
                    className="w-4 h-4 rounded border-[#16281F] bg-[#0A100D] text-[#00D084] focus:ring-0"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                  <div>
                    <span className="font-bold text-[#F5F7F6] block">VISUAL PROMPT INJECTION DEFENSE</span>
                    <span className="text-[10px] text-[#8B9992]">Treat text inside images as untrusted content</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={visionSettings.securitySanitization}
                    onChange={(e) => updateVisionSetting('securitySanitization', e.target.checked)}
                    className="w-4 h-4 rounded border-[#16281F] bg-[#0A100D] text-[#00D084] focus:ring-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. MEMORY */}
          {activeTab === 'MEMORY' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
              <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#FFB000]" />
                <span>NEURAL MEMORY BANK & BOUNDED RETENTION</span>
              </h2>

              <p className="text-[11px] text-[#8B9992]">
                Neural Memory is user-controlled, bounded, source-aware, and never automatically stores conversational chatter without explicit user or agent tagging.
              </p>

              <div className="p-4 rounded-xl border border-[#FF3B30]/40 bg-[#FF3B30]/5 space-y-3">
                <div className="flex items-center gap-2 text-[#FF3B30] font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>DANGER ZONE: PURGE CACHED RECORDS</span>
                </div>
                <p className="text-[10px] text-[#8B9992]">
                  Permanently purge stored memory nodes and queued directive items for this operator.
                </p>

                {showPurgeConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePurgeConfirmed}
                      className="px-3 py-1.5 rounded-lg bg-[#FF3B30] text-[#050706] font-bold text-xs hover:bg-[#FF3B30]/90 transition-colors"
                    >
                      CONFIRM PURGE ALL
                    </button>
                    <button
                      onClick={() => setShowPurgeConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#050706] border border-[#16281F] text-[#8B9992] text-xs hover:text-[#F5F7F6]"
                    >
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPurgeConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050706] border border-[#FF3B30]/50 text-[#FF3B30] hover:bg-[#FF3B30]/20 text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>PURGE CACHE</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 6. NOTIFICATIONS */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
              <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#19F59A]" />
                <span>GLOBAL NOTIFICATION CENTER PROTOCOLS</span>
              </h2>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
                  <span className="font-bold text-[#F5F7F6] block">REAL-TIME TOASTS</span>
                  <span className="text-[10px] text-[#8B9992]">Display temporary status toasts for background automation and agent steps</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
                  <span className="font-bold text-[#F5F7F6] block">AUDIT NOTIFICATIONS</span>
                  <span className="text-[10px] text-[#8B9992]">Retain up to 100 historical notification events with route inspection links</span>
                </div>
              </div>
            </div>
          )}

          {/* 7. AUTOMATION */}
          {activeTab === 'AUTOMATION' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
              <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFB000]" />
                <span>AUTOMATION CORE & RUNTIME GUARDRAILS</span>
              </h2>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
                  <span className="font-bold text-[#F5F7F6] block">RUNAWAY EXECUTION PREVENTION</span>
                  <span className="text-[10px] text-[#8B9992]">Auto-pauses any workflow that fails 3 consecutive triggers</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
                  <span className="font-bold text-[#F5F7F6] block">RATE LIMITING & IDEMPOTENCY</span>
                  <span className="text-[10px] text-[#8B9992]">Enforces minimal 60-second cooldown per trigger to prevent duplicate operations</span>
                </div>
              </div>
            </div>
          )}

          {/* 8. INTELLIGENCE */}
          {activeTab === 'INTELLIGENCE' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
              <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#38E1FF]" />
                <span>PREDICTIVE INTELLIGENCE & PATTERN SENSORS</span>
              </h2>

              <div className="space-y-3">
                {[
                  {
                    key: 'predictiveInsights' as const,
                    title: 'PREDICTIVE INSIGHTS (MASTER SWITCH)',
                    description: 'Analyze real project metrics, bottlenecks, and activity velocity without fabrication.',
                  },
                  {
                    key: 'deadlineDetection' as const,
                    title: 'DEADLINE WATCH SENSORS',
                    description: 'Flag upcoming milestones with incomplete objectives.',
                  },
                  {
                    key: 'workloadAnalysis' as const,
                    title: 'WORKLOAD & BACKLOG SENSORS',
                    description: 'Alert when open task count exceeds historical clearance capability.',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#050706] border border-[#16281F]"
                  >
                    <div>
                      <span className="font-bold text-[#F5F7F6] block">{item.title}</span>
                      <span className="text-[10px] text-[#8B9992]">{item.description}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={predSettings[item.key]}
                      onChange={() => togglePredSetting(item.key)}
                      className="w-4 h-4 rounded border-[#16281F] bg-[#0A100D] text-[#00D084] focus:ring-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. WORKSPACE */}
          {activeTab === 'WORKSPACE' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
              <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#38E1FF]" />
                <span>JARVIS OS WORKSPACE & WINDOW MANAGER</span>
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                  <div>
                    <span className="font-bold text-[#F5F7F6] block">PERSISTENT WINDOW POSITIONS</span>
                    <span className="text-[10px] text-[#8B9992]">Preserve coordinates and sizes across browser reloads</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={workspaceSettings.rememberWindowPositions}
                    onChange={(e) => updateWorkspaceSetting('rememberWindowPositions', e.target.checked)}
                    className="w-4 h-4 rounded border-[#16281F] bg-[#0A100D] text-[#00D084] focus:ring-0"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                  <div>
                    <span className="font-bold text-[#F5F7F6] block">SNAP WINDOWS TO GRID</span>
                    <span className="text-[10px] text-[#8B9992]">Snap dragged panels to 10px boundary increments</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={workspaceSettings.autoSnapWindows}
                    onChange={(e) => updateWorkspaceSetting('autoSnapWindows', e.target.checked)}
                    className="w-4 h-4 rounded border-[#16281F] bg-[#0A100D] text-[#00D084] focus:ring-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. SECURITY */}
          {activeTab === 'SECURITY' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
              <h2 className="text-xs font-bold tracking-wider text-[#F5F7F6] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#FF3B30]" />
                <span>SECURITY & AUTHORIZATION GUARDRAILS</span>
              </h2>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#F5F7F6] block">ROW LEVEL SECURITY (RLS)</span>
                    <span className="text-[10px] text-[#8B9992]">Isolated database records mapped to user UUID</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#00D084]/15 text-[#19F59A] font-bold text-[10px]">ENFORCED</span>
                </div>

                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#F5F7F6] block">PROMPT INJECTION DEFENSE</span>
                    <span className="text-[10px] text-[#8B9992]">Untrusted instructions cannot bypass security or approval rules</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#00D084]/15 text-[#19F59A] font-bold text-[10px]">ACTIVE</span>
                </div>

                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#F5F7F6] block">NO ARBITRARY CODE EXECUTION</span>
                    <span className="text-[10px] text-[#8B9992]">Agent tools run strictly against registered allowlist</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#00D084]/15 text-[#19F59A] font-bold text-[10px]">VERIFIED</span>
                </div>
              </div>
            </div>
          )}

          {/* 11. ABOUT ZORO */}
          {activeTab === 'ABOUT ZORO' && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#00D084]/40 shadow-[0_0_20px_rgba(0,208,132,0.1)] space-y-4">
              <div className="flex items-center gap-3 border-b border-[#16281F] pb-3">
                {/* Original Three Blade Motif */}
                <div className="w-10 h-10 rounded-xl bg-[#050706] border border-[#00D084] flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(0,208,132,0.25)]">
                  <div className="w-1.5 h-6 bg-[#00D084] -skew-x-12 rounded-xs shadow-[0_0_6px_#00D084]" />
                  <div className="w-1.5 h-7 bg-[#38E1FF] -skew-x-12 rounded-xs shadow-[0_0_6px_#38E1FF]" />
                  <div className="w-1.5 h-6 bg-[#FFB000] -skew-x-12 rounded-xs shadow-[0_0_6px_#FFB000]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#F5F7F6] tracking-wider">ZORO 2.0</h2>
                  <p className="text-[10px] text-[#19F59A] font-bold tracking-widest">
                    AI COMMAND CENTER • THREE BLADES. ONE INTELLIGENCE.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                  <span className="text-[9px] text-[#8B9992] block uppercase">Version</span>
                  <span className="font-bold text-[#F5F7F6]">2.0.0</span>
                </div>

                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                  <span className="text-[9px] text-[#8B9992] block uppercase">Edition</span>
                  <span className="font-bold text-[#19F59A]">ZORO COMMAND</span>
                </div>

                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                  <span className="text-[9px] text-[#8B9992] block uppercase">Status</span>
                  <span className="font-bold text-[#38E1FF]">Production Ready</span>
                </div>

                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] col-span-2 sm:col-span-3">
                  <span className="text-[9px] text-[#8B9992] block uppercase">Architecture</span>
                  <span className="font-bold text-[#F5F7F6]">
                    Multimodal AI Workspace with Controlled Agent Execution & Predictive Intelligence
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] text-[#8B9992] block uppercase tracking-wider">Integrated Subsystems:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Command Surface',
                    'Voice Synapse HUD',
                    'Vision Core',
                    'Neural Memory',
                    'Agentic Brain',
                    'Automation Lab',
                    'Predictive Intelligence',
                    'Mission Control',
                    'OS Workspace',
                  ].map((mod) => (
                    <span
                      key={mod}
                      className="px-2 py-0.5 rounded-lg bg-[#050706] border border-[#16281F] text-[#8B9992] text-[10px]"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
