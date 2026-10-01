import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FocusSession, RoutePath } from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { speechService } from '../services/speech';
import { Play, Pause, RotateCcw, Square, Clock, Shield, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

interface FocusProps {
  onNavigate: (path: RoutePath) => void;
}

export const FocusScreen: React.FC<FocusProps> = ({ onNavigate }) => {
  const { currentSession, trackEvent, createNotification } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [targetMinutes, setTargetMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const [sessions, setSessions] = useState<FocusSession[]>(() =>
    getLocalStore<FocusSession[]>(`focus_sessions_${userId}`, [
      {
        id: '1',
        user_id: userId,
        duration: 25,
        status: 'COMPLETED',
        completed_at: Date.now() - 7200000,
      },
      {
        id: '2',
        user_id: userId,
        duration: 45,
        status: 'COMPLETED',
        completed_at: Date.now() - 86400000,
      },
    ])
  );

  useEffect(() => {
    let interval: any = null;
    if (isRunning && !isPaused && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, secondsRemaining]);

  const handleStart = (mins = targetMinutes) => {
    setTargetMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsRunning(true);
    setIsPaused(false);
    trackEvent('FOCUS_STARTED', JSON.stringify({ minutes: mins }));
    createNotification('FOCUS PROTOCOL ENGAGED', `Combat focus timer set for ${mins} minutes.`, 'INFO');
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    if (!isRunning) return;
    const completedMinutes = Math.floor((targetMinutes * 60 - secondsRemaining) / 60);
    if (completedMinutes > 0) {
      const newSession: FocusSession = {
        id: 'foc_' + Date.now(),
        user_id: userId,
        duration: completedMinutes,
        status: 'ABORTED',
        completed_at: Date.now(),
      };
      const updated = [newSession, ...sessions];
      setSessions(updated);
      setLocalStore(`focus_sessions_${userId}`, updated);
    }
    setIsRunning(false);
    setIsPaused(false);
    setSecondsRemaining(targetMinutes * 60);
    trackEvent('FOCUS_ABORTED', JSON.stringify({ completedMinutes }));
  };

  const handleComplete = () => {
    setIsRunning(false);
    setIsPaused(false);
    const newSession: FocusSession = {
      id: 'foc_' + Date.now(),
      user_id: userId,
      duration: targetMinutes,
      status: 'COMPLETED',
      completed_at: Date.now(),
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setLocalStore(`focus_sessions_${userId}`, updated);

    trackEvent('FOCUS_COMPLETED', JSON.stringify({ duration: targetMinutes }));
    createNotification('FOCUS OBJECTIVE ACHIEVED', `Completed ${targetMinutes} minutes of uninterrupted warrior focus.`, 'SUCCESS');
    speechService.speak(`Mission accomplished. Focus protocol achieved, Commander.`);
  };

  const totalSecs = targetMinutes * 60;
  const progressFraction = totalSecs > 0 ? (totalSecs - secondsRemaining) / totalSecs : 0;
  const strokeDashoffset = 283 - 283 * progressFraction;

  const minsDisplay = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
  const secsDisplay = String(secondsRemaining % 60).padStart(2, '0');

  const presetTimes = [15, 25, 45, 60];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#19F59A]" />
            SANTORYU FOCUS PROTOCOL
          </h1>
          <p className="text-xs text-[#8B9992] mt-0.5">
            TACTICAL IMMERSION TIMER • ZERO DISTRACTIONS
          </p>
        </div>

        <button
          onClick={() => onNavigate('/dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] text-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>COMMAND DECK</span>
        </button>
      </div>

      {/* Main Timer Display */}
      <div className="p-8 rounded-2xl bg-[#0A100D] border border-[#16281F] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute w-72 h-72 rounded-full filter blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
            isRunning && !isPaused ? 'bg-[#00D084]' : 'bg-[#16281F]'
          }`}
        />

        {/* Circular Progress Ring */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="#16281F"
              strokeWidth="5"
            />
            {/* Progress Stroke */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke={isRunning && !isPaused ? '#19F59A' : '#00D084'}
              strokeWidth="5"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center Digital Readout */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-[#F5F7F6] tracking-tighter">
              {minsDisplay}:{secsDisplay}
            </span>
            <span
              className={`text-[10px] font-bold mt-2 px-2.5 py-0.5 rounded tracking-widest ${
                isRunning && !isPaused
                  ? 'bg-[#00D084]/20 text-[#19F59A] animate-pulse'
                  : isPaused
                  ? 'bg-[#FFB000]/20 text-[#FFB000]'
                  : 'bg-[#16281F] text-[#8B9992]'
              }`}
            >
              {isRunning && !isPaused ? 'WARRIOR FOCUS' : isPaused ? 'PAUSED' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        {!isRunning && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {presetTimes.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setTargetMinutes(m);
                  setSecondsRemaining(m * 60);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  targetMinutes === m
                    ? 'bg-[#00D084] text-[#050706]'
                    : 'bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] hover:border-[#00D084]/40'
                }`}
              >
                {m} MIN
              </button>
            ))}
            <button
              onClick={() => setShowCustomModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] hover:border-[#00D084]/40"
            >
              CUSTOM
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="mt-8 flex items-center gap-4">
          {!isRunning ? (
            <button
              onClick={() => handleStart()}
              className="px-8 py-3 rounded-xl bg-[#00D084] text-[#050706] font-bold text-sm tracking-wider hover:bg-[#19F59A] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,208,132,0.3)]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>COMMENCE PROTOCOL</span>
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={handleResume}
                  className="px-6 py-2.5 rounded-xl bg-[#00D084] text-[#050706] font-bold text-xs hover:bg-[#19F59A] flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>RESUME</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="px-6 py-2.5 rounded-xl bg-[#FFB000] text-[#050706] font-bold text-xs hover:bg-[#FFC030] flex items-center gap-2"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </button>
              )}

              <button
                onClick={handleStop}
                className="px-5 py-2.5 rounded-xl bg-[#050706] border border-[#FF3B30]/40 text-[#FF3B30] hover:bg-[#FF3B30] hover:text-[#F5F7F6] font-bold text-xs transition-colors flex items-center gap-2"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>TERMINATE</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Focus Protocol Logs Table */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-3">
        <div className="flex items-center justify-between text-xs text-[#8B9992] border-b border-[#16281F] pb-3">
          <div className="flex items-center gap-2 font-bold text-[#F5F7F6]">
            <Shield className="w-4 h-4 text-[#19F59A]" />
            <span>FOCUS PROTOCOL AUDIT LOG</span>
          </div>
          <span className="text-[10px] text-[#00D084]">
            {sessions.filter((s) => s.status === 'COMPLETED').length} MISSIONS ACCOMPLISHED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#8B9992] border-b border-[#16281F]">
                <th className="pb-2 font-semibold">SESSION ID</th>
                <th className="pb-2 font-semibold">DURATION</th>
                <th className="pb-2 font-semibold">RESULT</th>
                <th className="pb-2 font-semibold text-right">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#16281F]/50">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-[#8B9992]">
                    No focus sessions recorded yet. Engage the protocol above.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#121C17]/40">
                    <td className="py-2.5 font-mono text-[#8B9992]">{s.id.slice(0, 10)}</td>
                    <td className="py-2.5 font-bold text-[#F5F7F6]">{s.duration} MIN</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                          s.status === 'COMPLETED'
                            ? 'bg-[#00D084]/15 text-[#19F59A]'
                            : 'bg-[#FF3B30]/15 text-[#FF3B30]'
                        }`}
                      >
                        {s.status === 'COMPLETED' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[#8B9992] text-[10px]">
                      {new Date(s.completed_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Minutes Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A100D] border border-[#00D084]/40 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-[#F5F7F6]">CUSTOM FOCUS DURATION</h3>
            <p className="text-xs text-[#8B9992]">Specify tactical protocol duration in minutes (1–180):</p>
            <input
              type="number"
              min={1}
              max={180}
              placeholder="e.g. 50"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-sm text-[#F5F7F6] focus:border-[#00D084] outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 rounded text-xs text-[#8B9992] hover:text-[#F5F7F6]"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  const val = parseInt(customInput, 10);
                  if (val > 0 && val <= 180) {
                    setTargetMinutes(val);
                    setSecondsRemaining(val * 60);
                    setShowCustomModal(false);
                  }
                }}
                className="px-4 py-1.5 rounded bg-[#00D084] text-[#050706] font-bold text-xs hover:bg-[#19F59A]"
              >
                APPLY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
