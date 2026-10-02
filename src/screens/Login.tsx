import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AIOrb } from '../components/AIOrb';
import { Shield, Lock, Mail, ArrowRight, UserCheck, Eye, EyeOff } from 'lucide-react';
import { RoutePath } from '../types';

interface LoginProps {
  onNavigate: (path: RoutePath) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login, isSupabase } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide tactical credentials.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('commander@jarvis.ai');
    setPassword('SantoryuMaster2026!');
    setError('');
    setLoading(true);
    await login('commander@jarvis.ai', 'SantoryuMaster2026!');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050706] text-[#F5F7F6] flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Holographic AI Core Header */}
        <div className="flex flex-col items-center space-y-3">
          <AIOrb state={loading ? 'THINKING' : 'IDLE'} size={120} />
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-[#19F59A]" />
              <h1 className="text-xl font-black tracking-widest text-[#F5F7F6]">
                JARVIS — ZORO EDITION
              </h1>
            </div>
            <p className="text-[10px] text-[#8B9992] tracking-widest">
              THREE BLADES. ONE INTELLIGENCE.
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-[#0A100D] border border-[#16281F] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#16281F] pb-3 text-xs">
            <span className="font-bold text-[#19F59A] tracking-wider">OPERATOR AUTHENTICATION</span>
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
              <label htmlFor="login-email" className="text-[10px] text-jarvis-textMuted block mb-1">OPERATOR EMAIL</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-jarvis-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  placeholder="commander@jarvis.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-jarvis-bg border border-jarvis-border rounded-lg pl-9 pr-3 py-2.5 text-xs text-jarvis-text focus:border-jarvis-primary outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] text-jarvis-textMuted mb-1">
                <label htmlFor="login-password">SECURITY CIPHER (PASSWORD)</label>
                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-jarvis-primary hover:underline"
                >
                  RECOVER?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-jarvis-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
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
              <span>{loading ? 'AUTHENTICATING...' : 'ENGAGE COMMAND CENTER'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo quick access */}
          <div className="pt-2 border-t border-[#16281F]">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 rounded-xl bg-[#050706] border border-[#16281F] hover:border-[#00D084]/40 text-[#8B9992] hover:text-[#19F59A] text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>INSTANT COMMANDER DEMO ACCESS</span>
            </button>
          </div>

          <div className="text-center text-[11px] text-[#8B9992]">
            New operator aboard?{' '}
            <button
              onClick={() => onNavigate('/signup')}
              className="text-[#19F59A] font-bold hover:underline"
            >
              REGISTER CALLSIGN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
