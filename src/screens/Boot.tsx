import React, { useState, useEffect } from 'react';
import { AIOrb } from '../components/AIOrb';
import { Shield, Check, ArrowRight, Terminal } from 'lucide-react';
import { soundService } from '../services/sound';

interface BootScreenProps {
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const bootSteps = [
    'INITIALIZING CORE...',
    'LOADING MEMORY...',
    'CONNECTING SERVICES...',
    'VERIFYING AGENTS...',
    'SYSTEM READY',
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let timeout: any;
    if (currentStepIndex < bootSteps.length) {
      timeout = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
        soundService.play('CLICK');
      }, 250);
    } else {
      timeout = setTimeout(() => {
        setIsFinished(true);
        soundService.play('COMMAND_SUCCESS');
        // Auto transition after short 400ms confirmation
        setTimeout(() => {
          onComplete();
        }, 500);
      }, 300);
    }
    return () => clearTimeout(timeout);
  }, [currentStepIndex, bootSteps.length]);

  return (
    <div className="min-h-screen bg-jarvis-bg text-jarvis-text flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-md space-y-6 flex flex-col items-center">
        {/* Animated AI Orb */}
        <AIOrb state={isFinished ? 'SUCCESS' : 'EXECUTING'} size={130} />

        {/* Title */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-jarvis-primary" />
            <h1 className="text-base sm:text-lg font-black tracking-widest text-jarvis-text">
              ZORO 2.0
            </h1>
          </div>
          <p className="text-[10px] text-jarvis-textMuted tracking-widest uppercase">
            AI COMMAND CENTER • THREE BLADES MATRIX
          </p>
        </div>

        {/* Boot Terminal */}
        <div className="w-full bg-jarvis-surfaceElevated border border-jarvis-border rounded-lg p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-jarvis-border/60 text-[10px] text-jarvis-textMuted">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-jarvis-primary" />
              <span>KERNEL INITIALIZATION</span>
            </div>
            <span className="text-jarvis-primary tabular-nums">
              {Math.min(Math.round((currentStepIndex / bootSteps.length) * 100), 100)}%
            </span>
          </div>

          <div className="space-y-2 min-h-[140px] text-xs">
            {bootSteps.slice(0, currentStepIndex).map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-jarvis-primary font-bold">›</span>
                <span className={idx === currentStepIndex - 1 ? 'text-jarvis-primary font-bold' : 'text-jarvis-textSecondary'}>
                  {step}
                </span>
                {idx < currentStepIndex - 1 && (
                  <Check className="w-3 h-3 text-jarvis-primary ml-auto shrink-0" />
                )}
              </div>
            ))}
            {!isFinished && (
              <div className="flex items-center gap-2 text-jarvis-primary animate-pulse">
                <span>›</span>
                <span className="inline-block w-2 h-4 bg-jarvis-primary" />
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full flex items-center justify-center">
          <button
            onClick={onComplete}
            className="w-full py-2.5 rounded border border-jarvis-primary bg-jarvis-primary text-black font-bold text-xs tracking-wider hover:bg-jarvis-primary/90 transition-all flex items-center justify-center gap-2 shadow-glow-primary"
          >
            <span>{isFinished ? 'ENTER COMMAND DECK' : 'SKIP INITIALIZATION'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
