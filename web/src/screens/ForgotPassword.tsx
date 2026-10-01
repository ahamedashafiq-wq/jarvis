import React, { useState } from 'react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { RoutePath } from '../types';
import { AIOrb } from '../components/AIOrb';

interface ForgotPasswordProps {
  onNavigate: (path: RoutePath) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#050706] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0A100D] border border-[#16281F] rounded-xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="flex flex-col items-center text-center mb-6">
          <AIOrb state="IDLE" size={70} className="mb-3" />
          <h1 className="text-lg font-black tracking-wider text-[#F5F7F6]">RECOVER CIPHER</h1>
          <p className="text-[10px] font-mono text-[#8B9992] tracking-widest mt-1">
            CIPHER RESTORATION PROTOCOL
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded bg-[#00D084]/10 border border-[#00D084]/30 text-center font-mono space-y-2">
            <p className="text-xs text-[#19F59A] font-bold">RECOVERY DISPATCH TRANSMITTED</p>
            <p className="text-[11px] text-[#8B9992]">
              Security access instructions have been dispatched to <span className="text-[#F5F7F6] font-bold">{email}</span>.
            </p>
            <button
              onClick={() => onNavigate('/login')}
              className="mt-4 px-4 py-2 bg-[#00D084] text-[#050706] rounded text-xs font-bold tracking-wider"
            >
              RETURN TO LOGIN
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-[#8B9992] mb-1">
                REGISTERED OPERATOR EMAIL
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

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#00D084] hover:bg-[#19F59A] text-[#050706] rounded font-mono font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              TRANSMIT RECOVERY KEY
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#16281F] text-center">
          <button
            onClick={() => onNavigate('/login')}
            className="inline-flex items-center gap-1.5 text-xs text-[#8B9992] hover:text-[#19F59A] font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            RETURN TO ACCESS PORTAL
          </button>
        </div>
      </div>
    </div>
  );
};
