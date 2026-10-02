import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AIOrb } from '../components/AIOrb';
import { Shield, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { RoutePath } from '../types';

interface ForgotPasswordProps {
  onNavigate: (path: RoutePath) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#050706] text-[#F5F7F6] flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <AIOrb state={submitted ? 'SUCCESS' : 'IDLE'} size={120} />
          <div className="text-center space-y-1">
            <h1 className="text-xl font-black tracking-widest text-[#F5F7F6]">
              CIPHER RECOVERY
            </h1>
            <p className="text-[10px] text-[#8B9992] tracking-widest">
              CREDENTIAL OVERRIDE & RESTORATION
            </p>
          </div>
        </div>

        <div className="bg-[#0A100D] border border-[#16281F] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#00D084]/20 border border-[#00D084] flex items-center justify-center mx-auto text-[#19F59A]">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-[#F5F7F6]">RECOVERY VECTOR DISPATCHED</h3>
              <p className="text-xs text-[#8B9992] leading-relaxed">
                If the operator address is indexed in the core database, recovery directives have been dispatched.
              </p>
              <button
                onClick={() => onNavigate('/login')}
                className="w-full py-2.5 rounded-xl bg-[#00D084] text-[#050706] font-bold text-xs hover:bg-[#19F59A] transition-all"
              >
                RETURN TO LOGIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <p className="text-[#8B9992] text-xs leading-relaxed">
                Provide your registered operator address to receive recovery verification ciphers.
              </p>

              <div>
                <label htmlFor="forgot-email" className="text-[10px] text-jarvis-textMuted block mb-1">REGISTERED EMAIL</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-jarvis-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-email"
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

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#00D084] text-[#050706] font-bold text-xs tracking-wider hover:bg-[#19F59A] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,208,132,0.3)]"
              >
                <span>TRANSMIT RECOVERY CIPHER</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 border-t border-[#16281F]">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="text-[#8B9992] hover:text-[#19F59A] text-xs flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>BACK TO LOGIN</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
