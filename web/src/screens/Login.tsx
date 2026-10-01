import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AIOrb } from '../components/AIOrb';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { RoutePath } from '../types';

interface AuthScreenProps {
  onNavigate: (path: RoutePath) => void;
}

export const Login: React.FC<AuthScreenProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('commander@jarvis.ai');
  const [password, setPassword] = useState('tactical123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      onNavigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#050706] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0A100D] border border-[#16281F] rounded-xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Glowing tactical top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00D084] to-transparent" />

        {/* AI Core header */}
        <div className="flex flex-col items-center text-center mb-6">
          <AIOrb state={loading ? 'THINKING' : 'IDLE'} size={90} className="mb-3" />
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-wider text-[#F5F7F6]">JARVIS</h1>
            <span className="text-xs font-mono font-bold text-[#19F59A] px-2 py-0.5 rounded bg-[#00D084]/15 border border-[#00D084]/30">
              ZORO EDITION
            </span>
          </div>
          <p className="text-[10px] font-mono text-[#8B9992] tracking-widest mt-1">
            AUTHENTICATION REQUIRED • THREE BLADES PROTOCOL
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-xs font-mono text-[#FF3B30]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-[#8B9992] mb-1">
              OPERATOR IDENTIFIER (EMAIL)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8B9992] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#050706] border border-[#16281F] rounded text-sm text-[#F5F7F6] focus:border-[#00D084] focus:outline-none font-mono"
                placeholder="operator@sector.ai"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono text-[#8B9992]">
                SECURITY CIPHER (PASSWORD)
              </label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-[10px] font-mono text-[#00D084] hover:underline"
              >
                FORGOT CIPHER?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8B9992] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#050706] border border-[#16281F] rounded text-sm text-[#F5F7F6] focus:border-[#00D084] focus:outline-none font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              await login('commander@jarvis.ai', 'tactical123');
              setLoading(false);
              onNavigate('/dashboard');
            }}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#19F59A] hover:bg-[#00D084] text-[#050706] rounded font-mono font-bold text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(25,245,154,0.4)] disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            ONE-TAP DEMO ACCESS
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 px-4 bg-[#0A100D] hover:bg-[#16281F] text-[#F5F7F6] border border-[#16281F] hover:border-[#00D084] rounded font-mono font-bold text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING CORE...' : 'INITIALIZE WITH CREDENTIALS'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-3 text-center text-[10px] font-mono text-[#8B9992]">
          DEFAULT: commander@jarvis.ai / tactical123
        </p>

        <div className="mt-6 pt-4 border-t border-[#16281F] text-center">
          <p className="text-xs text-[#8B9992] font-mono">
            NEW OPERATOR?{' '}
            <button
              onClick={() => onNavigate('/signup')}
              className="text-[#19F59A] hover:underline font-bold"
            >
              REGISTER DOSSIER
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
