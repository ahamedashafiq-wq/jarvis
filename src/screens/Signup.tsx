import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AIOrb } from '../components/AIOrb';
import { Shield, Lock, Mail, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { RoutePath } from '../types';

interface SignupProps {
  onNavigate: (path: RoutePath) => void;
}

export const Signup: React.FC<SignupProps> = ({ onNavigate }) => {
  const { signup, isSupabase } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError('Please fill in all operator registration fields.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await signup(email, password, displayName);
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050706] text-[#F5F7F6] flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Holographic Header */}
        <div className="flex flex-col items-center space-y-3">
          <AIOrb state={loading ? 'THINKING' : 'IDLE'} size={120} />
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-[#19F59A]" />
              <h1 className="text-xl font-black tracking-widest text-[#F5F7F6]">
                OPERATOR ENLISTMENT
              </h1>
            </div>
            <p className="text-[10px] text-[#8B9992] tracking-widest">
              SANTORYU SENSORY MATRIX REGISTRATION
            </p>
          </div>
        </div>

        {/* Box */}
        <div className="bg-[#0A100D] border border-[#16281F] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#16281F] pb-3 text-xs">
            <span className="font-bold text-[#19F59A] tracking-wider">NEW OPERATOR DOSSIER</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              isSupabase ? 'bg-[#38E1FF]/10 text-[#38E1FF]' : 'bg-[#FFB000]/10 text-[#FFB000]'
            }`}>
              {isSupabase ? 'SUPABASE' : 'SANDBOX'}
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#FF3B30] text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="signup-callsign" className="text-[10px] text-jarvis-textMuted block mb-1">CALLSIGN (DISPLAY NAME)</label>
              <div className="relative">
                <User className="w-4 h-4 text-jarvis-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-callsign"
                  name="displayName"
                  type="text"
                  required
                  placeholder="e.g. Roronoa, Phoenix, Commander"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-jarvis-bg border border-jarvis-border rounded-lg pl-9 pr-3 py-2.5 text-xs text-jarvis-text focus:border-jarvis-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="text-[10px] text-jarvis-textMuted block mb-1">OPERATOR EMAIL</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-jarvis-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  placeholder="commander@zoro.omnia"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-jarvis-bg border border-jarvis-border rounded-lg pl-9 pr-3 py-2.5 text-xs text-jarvis-text focus:border-jarvis-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="text-[10px] text-jarvis-textMuted block mb-1">SECURITY CIPHER</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-jarvis-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-jarvis-bg border border-jarvis-border rounded-lg pl-9 pr-10 py-2.5 text-xs text-jarvis-text focus:border-jarvis-primary outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-jarvis-textMuted hover:text-jarvis-text"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00D084] text-[#050706] font-bold text-xs tracking-wider hover:bg-[#19F59A] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,208,132,0.3)] disabled:opacity-50"
            >
              <span>{loading ? 'REGISTERING...' : 'INITIALIZE OPERATOR ACCOUNT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-[11px] text-[#8B9992] pt-2 border-t border-[#16281F]">
            Already holding tactical commission?{' '}
            <button
              onClick={() => onNavigate('/login')}
              className="text-[#19F59A] font-bold hover:underline"
            >
              OPERATOR LOGIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
