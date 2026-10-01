import React, { useState, useEffect } from 'react';
import { AIOrb } from '../components/AIOrb';
import { Shield, Check, ArrowRight, Terminal } from 'lucide-react';

interface BootScreenProps {
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const bootSteps = [
    'INITIALIZING JARVIS PROTOCOL...',
    'CALIBRATING THREE BLADES SYNAPSE...',
    'BLADE 01 (ENMA / KNOWLEDGE) ...... ONLINE',
    'GEMINI 3.8 FLASH CORE ........... SYNCHRONIZED',
    'BLADE 02 (WADO ICHIMONJI / ACTION) READY',
    'BLADE 03 (SANDAI KITETSU / MEMORY) CONNECTED',
    'SPEECH SYNTHESIS & RECOGNITION .. ARMED',
    'TACTICAL PERIMETER SECURED',
    'SYSTEM STATUS: ALL MATRICES OPTIMAL',
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let timeout: any;
    if (currentStepIndex < bootSteps.length) {
      timeout = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 260);
    } else {
      timeout = setTimeout(() => {
        setIsFinished(true);
      }, 350);
    }
    return () => clearTimeout(timeout);
  }, [currentStepIndex, bootSteps.length]);

  return (
    <div className="min-h-screen bg-[#050706] text-[#F5F7F6] flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-lg space-y-6 flex flex-col items-center">
        {/* Animated AI Orb */}
        <AIOrb state={isFinished ? 'SUCCESS' : 'EXECUTING'} size={150} />

        {/* Title */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-[#19F59A]" />
            <h1 className="text-lg font-black tracking-widest text-[#F5F7F6]">
              JARVIS — ZORO EDITION
            </h1>
          </div>
          <p className="text-[10px] text-[#8B9992] tracking-widest">
            SANTORYU AUTONOMOUS WARRIOR INTELLIGENCE
          </p>
        </div>

        {/* Boot Logs Terminal */}
        <div className="w-full bg-[#0A100D] border border-[#16281F] rounded-xl p-4 shadow-2xl space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#16281F] text-[10px] text-[#8B9992]">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#19F59A]" />
              <span>KERNEL BOOT TELEMETRY</span>
            </div>
            <span className="text-[#19F59A]">
              {Math.min(Math.round((currentStepIndex / bootSteps.length) * 100), 100)}%
            </span>
          </div>

          <div className="space-y-1.5 min-h-[160px] text-xs">
            {bootSteps.slice(0, currentStepIndex).map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[#00D084] font-bold">›</span>
                <span className={idx === currentStepIndex - 1 ? 'text-[#19F59A] font-bold' : 'text-[#8B9992]'}>
                  {step}
                </span>
                {idx < currentStepIndex - 1 && (
                  <Check className="w-3 h-3 text-[#19F59A] ml-auto shrink-0" />
                )}
              </div>
            ))}
            {!isFinished && (
              <div className="flex items-center gap-2 text-[#00D084] animate-pulse">
                <span>›</span>
                <span className="inline-block w-2 h-4 bg-[#19F59A]" />
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full flex items-center justify-center gap-3">
          <button
            onClick={onComplete}
            className="w-full py-3 rounded-lg bg-[#00D084] text-[#050706] font-bold text-xs tracking-wider hover:bg-[#19F59A] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,208,132,0.3)]"
          >
            <span>{isFinished ? 'ENTER COMMAND DECK' : 'SKIP INITIALIZATION'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
