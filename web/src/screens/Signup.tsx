import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AIOrb } from '../components/AIOrb';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';
import { RoutePath } from '../types';

interface AuthScreenProps {
  onNavigate: (path: RoutePath) => void;
}

export const Signup: React.FC<AuthScreenProps> = ({ onNavigate }) => {
  const { signup } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setError('Please provide all operator credentials.');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await signup(email, password, displayName);
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
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00D084] to-transparent" />

        <div className="flex flex-col items-center text-center mb-6">
          <AIOrb state={loading ? 'THINKING' : 'IDLE'} size={80} className="mb-3" />
          <h1 className="text-lg font-black tracking-wider text-[#F5F7F6]">REGISTER OPERATOR</h1>
          <p className="text-[10px] font-mono text-[#8B9992] tracking-widest mt-1">
            ENLIST INTO JARVIS ZORO THREE-BLADES MATRIX
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
              CALLSIGN / DISPLAY NAME
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8B9992] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#050706] border border-[#16281F] rounded text-sm text-[#F5F7F6] focus:border-[#00D084] focus:outline-none font-mono"
                placeholder="e.g. RONIN, ZORO, COMMANDER"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#8B9992] mb-1">
              OPERATOR EMAIL
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8B9992] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#050706] border border-[#16281F] rounded text-sm text-[#F5F7F6] focus:border-[#00D084] focus:outline-none font-mono"
                placeholder="commander@sector.ai"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#8B9992] mb-1">
              SECURITY CIPHER (PASSWORD)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8B9992] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#050706] border border-[#16281F] rounded text-sm text-[#F5F7F6] focus:border-[#00D084] focus:outline-none font-mono"
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#00D084] hover:bg-[#19F59A] text-[#050706] rounded font-mono font-bold text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,208,132,0.3)] disabled:opacity-50"
          >
            {loading ? 'INITIALIZING MATRIX...' : 'CREATE ACCOUNT'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#16281F] text-center">
          <p className="text-xs text-[#8B9992] font-mono">
            ALREADY AUTHORIZED?{' '}
            <button
              onClick={() => onNavigate('/login')}
              className="text-[#19F59A] hover:underline font-bold"
            >
              INITIALIZE LOGIN
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
