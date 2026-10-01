import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Copy, Check, LogOut, Edit, Save, ArrowLeft, Award, Zap } from 'lucide-react';
import { RoutePath } from '../types';

interface ProfileProps {
  onNavigate: (path: RoutePath) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
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
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#19F59A]" />
            OPERATOR DOSSIER
          </h1>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            TACTICAL IDENTITY & PERMISSION MATRIX
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>
          <button
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#121C17] border border-[#00D084]/40 text-[#19F59A] font-bold hover:bg-[#00D084] hover:text-[#050706] transition-all"
          >
            {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'SAVE DOSSIER' : 'EDIT CALLSIGN'}</span>
          </button>
        </div>
      </div>

      {/* ID Card */}
      <div className="p-6 rounded-2xl bg-[#0A100D] border border-[#16281F] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-[#121C17] border-2 border-[#00D084] flex items-center justify-center text-xl font-black text-[#19F59A] shrink-0 overflow-hidden shadow-[0_0_20px_rgba(0,208,132,0.3)]">
            <img src="/jarvis-zoro.jpg" alt="Operator Avatar" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
            <Shield className="w-10 h-10 text-[#19F59A] shrink-0" />
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-lg font-black text-[#F5F7F6] bg-[#050706] border border-[#00D084] rounded px-3 py-1 outline-none"
              />
            ) : (
              <div className="text-xl font-black text-[#F5F7F6] tracking-wider">
                {profile?.display_name || currentSession?.displayName || 'COMMANDER'}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-[#00D084]/15 border border-[#00D084]/30 text-[#19F59A] font-bold">
                RANK: GRAND MASTER SWORDSMAN
              </span>
              <span className="px-2 py-0.5 rounded bg-[#38E1FF]/15 border border-[#38E1FF]/30 text-[#38E1FF]">
                SWORD STYLE: SANTORYU
              </span>
              <span className="px-2 py-0.5 rounded bg-[#FFB000]/15 border border-[#FFB000]/30 text-[#FFB000]">
                {isSupabase ? 'SUPABASE AUTH' : 'LOCAL SANDBOX'}
              </span>
            </div>
          </div>
        </div>

        {/* Credentials and Telemetry Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-6 border-t border-[#16281F]">
          <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#8B9992] block">OPERATOR CALLSIGN</span>
              <span className="font-bold text-[#F5F7F6]">
                {profile?.display_name || currentSession?.displayName}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-[#8B9992] block">TACTICAL OPERATOR ID</span>
              <span className="font-bold text-[#F5F7F6] truncate block">
                {currentSession?.userId || 'N/A'}
              </span>
            </div>
            <button
              onClick={handleCopyId}
              className="p-1.5 rounded bg-[#121C17] text-[#8B9992] hover:text-[#19F59A]"
              title="Copy ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#19F59A]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F]">
            <span className="text-[10px] text-[#8B9992] block">SECURITY CLEARANCE</span>
            <span className="font-bold text-[#19F59A]">LEVEL 5 ASURA OMNISCIENCE</span>
          </div>

          <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F]">
            <span className="text-[10px] text-[#8B9992] block">DISCIPLINE REGISTRATION</span>
            <span className="font-bold text-[#F5F7F6]">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'INITIAL CALIBRATION'}
            </span>
          </div>
        </div>
      </div>

      {/* Badges / Tactical Commendations */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-3">
        <h3 className="font-bold text-xs text-[#F5F7F6] tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-[#FFB000]" />
          <span>TACTICAL COMMENDATIONS & MEDALS</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
            <div className="text-[10px] font-bold text-[#19F59A]">THREE BLADES ALIGNED</div>
            <p className="text-[10px] text-[#8B9992]">Harmonized Enma, Wado, and Kitetsu simultaneously.</p>
          </div>
          <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
            <div className="text-[10px] font-bold text-[#38E1FF]">NEURAL SYNAPSE ACE</div>
            <p className="text-[10px] text-[#8B9992]">Continuous Google Gemini intelligence integration.</p>
          </div>
          <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
            <div className="text-[10px] font-bold text-[#FFB000]">RELENTLESS DISCIPLINE</div>
            <p className="text-[10px] text-[#8B9992]">Zero hesitation in focus protocol execution.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
