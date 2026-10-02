import React, { useState } from 'react';
import { Terminal as TerminalIcon, Send, Trash2, ArrowLeft, CheckCircle2, XCircle, Clock, Activity, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CommandLog, RoutePath, Task, Memory } from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { MemoryService } from '../services/memory';
import { MissionService } from '../services/mission';
import { useRealtimeCommands } from '../hooks/useRealtime';

interface CommandsProps {
  onNavigate: (path: RoutePath) => void;
}

export const Commands: React.FC<CommandsProps> = ({ onNavigate }) => {
  const { currentSession, profile, logout, isSupabase, trackEvent } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const { commands: logs, recordCommand, clearCommands } = useRealtimeCommands();
  const [input, setInput] = useState('');

  const quickCommands = [
    '/help',
    '/status',
    '/missions',
    '/tasks',
    '/memory',
    '/focus 25',
    '/analytics',
    '/profile',
    '/settings',
    '/clear',
  ];

  const handleExecute = (cmdToRun?: string) => {
    const cmd = (cmdToRun || input).trim();
    if (!cmd) return;
    setInput('');

    if (cmd === '/clear') {
      clearCommands();
      trackEvent('COMMAND_EXECUTED', JSON.stringify({ command: '/clear' }));
      return;
    }

    const startTime = performance.now();
    let result = '';
    let status: CommandLog['status'] = 'SUCCESS';

    switch (true) {
      case cmd === '/help':
        result = `AVAILABLE TACTICAL DIRECTIVES:
• /status     - System integrity, connection matrix & blade status
• /missions   - List active missions in Mission Control OS
• /tasks      - List active tactical directives in Action Queue
• /memory     - Query indexed memory recall nodes in Blade 03
• /focus [m]  - Trigger combat focus timer (e.g. /focus 25)
• /analytics  - Open productivity & directive telemetry
• /profile    - View operator dossier & security credentials
• /settings   - Open core configuration & voice parameters
• /logout     - Terminate active session
• /clear      - Flush terminal log history`;
        break;

      case cmd === '/missions': {
        const msns = MissionService.getMissions(userId);
        const active = msns.filter((m) => m.status === 'ACTIVE');
        result =
          active.length === 0
            ? 'Mission Control: No active missions in queue. Create one with "Plan a mission called..."'
            : `ACTIVE MISSIONS (${active.length}):\n` +
              active.map((m) => `• [${m.priority}] ${m.title} — ${m.progress}% complete (Goal: ${m.goal})`).join('\n');
        break;
      }

      case cmd === '/status': {
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED').length;
        const memoryCount = MemoryService.getMemories(userId).length;

        result = `SYSTEM TELEMETRY REPORT:
• KERNEL: JARVIS ZORO EDITION v2.0
• OPERATOR: ${profile?.display_name || currentSession?.displayName || 'COMMANDER'} (${userId})
• BACKEND: ${isSupabase ? 'SUPABASE POSTGRESQL [CONNECTED]' : 'LOCAL SANDBOX [ACTIVE]'}
• BLADE 01 (KNOWLEDGE): GEMINI 3.8 FLASH [ONLINE]
• BLADE 02 (ACTION): ${activeTasks} ACTIVE DIRECTIVES PENDING
• BLADE 03 (MEMORY): ${memoryCount} PERSISTENT NODES ARMED
• PERSISTENT MEMORY RETRIEVAL: READY`;
        break;
      }

      case cmd === '/tasks': {
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const active = tasks.filter((t) => t.status !== 'COMPLETED');
        result =
          active.length === 0
            ? 'Action Queue is clear. Zero pending directives in Blade 02.'
            : `ACTIVE DIRECTIVES (${active.length}):\n` +
              active.map((t) => `• [${t.priority}] ${t.title} (Due: ${t.due_date})`).join('\n');
        break;
      }

      case cmd === '/memory': {
        const memories = MemoryService.getMemories(userId);
        result =
          memories.length === 0
            ? 'Blade 03 memory bank is currently vacant.'
            : `PERSISTENT MEMORY NODES (${memories.length}):\n` +
              memories.slice(0, 6).map((m) => `• [${m.category}] ${m.content}`).join('\n');
        break;
      }

      case cmd.startsWith('/focus'): {
        const mins = parseInt(cmd.replace('/focus', '').trim(), 10) || 25;
        result = `Routing to Santoryu Focus protocol with ${mins} minute duration...`;
        onNavigate('/focus');
        break;
      }

      case cmd === '/analytics':
        result = 'Routing to Productivity & Combat Analytics screen...';
        onNavigate('/analytics');
        break;

      case cmd === '/profile':
        result = 'Routing to Operator Dossier...';
        onNavigate('/profile');
        break;

      case cmd === '/settings':
        result = 'Opening system configuration deck...';
        onNavigate('/settings');
        break;

      case cmd === '/logout':
        logout();
        return;

      default:
        result = `Directive executed: Command "${cmd}" registered and processed by tactical parser.`;
    }

    const execTime = Math.round(performance.now() - startTime);
    const newLog: CommandLog = {
      id: 'cmd_' + Date.now(),
      user_id: userId,
      command: cmd,
      command_type: 'CLI',
      status,
      result,
      execution_time: execTime,
      created_at: Date.now(),
    };

    recordCommand(newLog);
    trackEvent('COMMAND_EXECUTED', JSON.stringify({ command: cmd }));
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-[#19F59A]" />
            COMMAND CENTER
          </h1>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            INTENT ROUTING AUDIT TRAIL • DIRECTIVE EXECUTION PIPELINE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>
          <button
            onClick={() => handleExecute('/clear')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#FF3B30] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR SCREEN</span>
          </button>
        </div>
      </div>

      {/* Recent Commands Feed (Section 27 requirement) */}
      <div className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-[#16281F] pb-2">
          <span className="font-bold text-[11px] text-[#19F59A] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            RECENT DIRECTIVE AUDIT TRAIL
          </span>
          <span className="text-[10px] text-[#8B9992]">{logs.length} RECORDS LOGGED</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {logs.slice(0, 4).map((log) => {
            const timeStr = new Date(log.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
            const isSuccess = log.status === 'SUCCESS';

            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-between space-x-2"
              >
                <div>
                  <div className="text-[10px] text-[#8B9992]">{timeStr}</div>
                  <div className="font-bold text-xs text-[#F5F7F6] truncate max-w-[130px]">
                    {log.command}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded ${
                      isSuccess
                        ? 'bg-[#19F59A]/15 text-[#19F59A] border border-[#19F59A]/30'
                        : 'bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30'
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    ) : (
                      <XCircle className="w-2.5 h-2.5" />
                    )}
                    {log.status}
                  </span>
                  {log.execution_time !== undefined && (
                    <div className="text-[9px] text-[#8B9992] mt-0.5">
                      {log.execution_time}ms
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Directives Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-[#8B9992]">QUICK DIRECTIVES:</span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleExecute(cmd)}
            className="px-2.5 py-1 rounded-lg bg-[#0A100D] border border-[#16281F] text-[11px] text-[#19F59A] hover:border-[#00D084] transition-colors font-mono"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Display */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0A100D] border border-[#16281F] shadow-2xl flex flex-col min-h-[460px] justify-between">
        {/* Output Stream */}
        <div className="space-y-4 overflow-y-auto max-h-[380px] pr-2">
          <div className="text-[#8B9992] text-[11px] pb-2 border-b border-[#16281F]/50">
            JARVIS ZORO COMMAND CENTER ENVIRONMENT v2.0 (x86_64-pc-linux-gnu)<br />
            Type <span className="text-[#19F59A]">/help</span> for list of directives.
          </div>

          {logs.map((log) => (
            <div key={log.id} className="space-y-1.5 font-mono">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#00D084] font-bold">
                  {profile?.display_name?.toLowerCase() || 'commander'}@jarvis-zoro:~$
                </span>
                <span className="text-[#F5F7F6] font-bold">{log.command}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    log.status === 'SUCCESS'
                      ? 'text-[#19F59A] bg-[#19F59A]/10'
                      : 'text-[#FF3B30] bg-[#FF3B30]/10'
                  }`}
                >
                  {log.status}
                </span>
                <span className="text-[9px] text-[#8B9992] ml-auto">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="bg-[#050706] p-3 rounded-xl border border-[#16281F] text-[#8B9992] leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                {log.result}
              </div>
            </div>
          ))}
        </div>

        {/* Input Line */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecute();
          }}
          className="mt-4 pt-3 border-t border-[#16281F] flex items-center gap-2"
        >
          <span className="text-[#00D084] font-bold text-xs shrink-0">
            {profile?.display_name?.toLowerCase() || 'commander'}@jarvis-zoro:~$
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type directive (e.g. /status, /tasks, /memory, /help)..."
            className="flex-1 bg-transparent text-[#F5F7F6] text-xs outline-none font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-[#00D084] text-[#050706] hover:bg-[#19F59A] transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
