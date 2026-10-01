import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Copy, Check, LogOut, Edit, Save } from 'lucide-react';
import { RoutePath } from '../types';

interface ProfileProps {
  onNavigate: (path: RoutePath) => void;
}

export const Profile: React.FC<ProfileProps> = () => {
  const { currentSession, profile, updateProfile, logout, isSupabase } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.display_name || currentSession?.displayName || '');
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (currentSession?.userId) {
      navigator.clipboard.writeText(currentSession.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    if (editName.trim()) {
      updateProfile({ display_name: editName.trim() });
      setIsEditing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider">
            OPERATOR DOSSIER
          </h1>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            TACTICAL IDENTITY & PERMISSION MATRIX
          </p>
        </div>

        <button
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#121C17] border border-[#00D084]/40 text-[#19F59A] font-bold hover:bg-[#00D084] hover:text-[#050706] transition-all"
        >
          {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
          {isEditing ? 'SAVE DOSSIER' : 'EDIT CALLSIGN'}
        </button>
      </div>

      {/* ID Card */}
      <div className="p-6 rounded-xl bg-[#0A100D] border border-[#16281F] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-[#121C17] border-2 border-[#00D084] flex items-center justify-center text-xl font-black text-[#19F59A] shrink-0 shadow-[0_0_20px_rgba(0,208,132,0.3)]">
            <Shield className="w-8 h-8 text-[#19F59A]" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[#050706] border border-[#00D084] rounded px-2 py-1 text-sm font-bold text-[#F5F7F6] focus:outline-none"
                />
              ) : (
                <h2 className="text-lg font-black text-[#F5F7F6] tracking-wide">
                  {profile?.display_name || currentSession?.displayName || 'COMMANDER'}
                </h2>
              )}
              <div className="text-xs text-[#8B9992] mt-0.5">{currentSession?.email || 'N/A'}</div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-[#00D084]/15 border border-[#00D084]/30 text-[#19F59A] font-bold">
                COMMAND LEVEL: ZERO ERROR
              </span>
              <span className="px-2 py-0.5 rounded bg-[#38E1FF]/15 border border-[#38E1FF]/30 text-[#38E1FF] font-bold">
                THREE BLADES ALIGNED
              </span>
            </div>
          </div>
        </div>

        {/* User UUID Bar */}
        <div className="mt-5 pt-4 border-t border-[#16281F] flex items-center justify-between bg-[#050706] p-2.5 rounded border">
          <div>
            <span className="text-[9px] text-[#8B9992] block">OPERATOR UUID</span>
            <span className="text-[11px] text-[#F5F7F6] font-mono">{currentSession?.userId || 'GUEST_USER'}</span>
          </div>
          <button
            onClick={handleCopyId}
            className="p-1.5 rounded hover:bg-[#121C17] text-[#8B9992] hover:text-[#19F59A] transition-colors"
            title="Copy ID"
          >
            {copied ? <Check className="w-4 h-4 text-[#19F59A]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Security & System Matrix */}
      <div className="p-5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-3">
        <h3 className="text-xs font-bold text-[#19F59A] tracking-wider">
          SECURITY MATRIX & PROTOCOL STATUS
        </h3>

        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between p-2 rounded bg-[#050706] border border-[#16281F]">
            <span className="text-[#8B9992]">DATABASE ENGINE:</span>
            <span className={isSupabase ? 'text-[#38E1FF] font-bold' : 'text-[#FFB000]'}>
              {isSupabase ? 'SUPABASE POSTGRESQL [CONNECTED]' : 'LOCAL SANDBOX [SECURE]'}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded bg-[#050706] border border-[#16281F]">
            <span className="text-[#8B9992]">ROW LEVEL SECURITY (RLS):</span>
            <span className="text-[#19F59A] font-bold">ENFORCED (USER_ID ISOLATION)</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-[#050706] border border-[#16281F]">
            <span className="text-[#8B9992]">INTELLIGENCE CORE:</span>
            <span className="text-[#19F59A] font-bold">GOOGLE GEMINI 1.5 FLASH</span>
          </div>
        </div>
      </div>

      {/* Terminate Session */}
      <button
        onClick={logout}
        className="w-full py-2.5 px-4 rounded bg-[#FF3B30]/10 border border-[#FF3B30]/40 text-[#FF3B30] hover:bg-[#FF3B30] hover:text-[#050706] font-bold transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        TERMINATE OPERATOR SESSION
      </button>
    </div>
  );
};
