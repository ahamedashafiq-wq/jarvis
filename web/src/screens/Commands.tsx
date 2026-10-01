import React, { useState } from 'react';
import { Terminal as TerminalIcon, Send, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CommandLog, RoutePath } from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';

interface CommandsProps {
  onNavigate: (path: RoutePath) => void;
}

export const Commands: React.FC<CommandsProps> = ({ onNavigate }) => {
  const { currentSession, profile, logout, isSupabase } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [logs, setLogs] = useState<CommandLog[]>(() =>
    getLocalStore<CommandLog[]>(`cmds_${userId}`, [
      {
        id: '1',
        user_id: userId,
        command: '/status',
        status: 'SUCCESS',
        result: `SYSTEM TELEMETRY REPORT:
• KERNEL: JARVIS ZORO EDITION v2.0
• ARCHITECTURE: REACT + TYPESCRIPT + TAILWIND + GEMINI
• OPERATOR: ${profile?.display_name || currentSession?.displayName || 'COMMANDER'}
• BACKEND: ${isSupabase ? 'SUPABASE POSTGRESQL' : 'LOCAL SANDBOX'}
• BLADE 01: GEMINI 1.5 FLASH [ONLINE]
• BLADE 02: ACTIVE QUEUE SYNCHRONIZED
• BLADE 03: PERSISTENT MEMORY SECURE`,
        created_at: Date.now() - 3600000,
      },
    ])
  );

  const [input, setInput] = useState('');

  const quickCommands = [
    '/help',
    '/status',
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
      setLogs([]);
      setLocalStore(`cmds_${userId}`, []);
      return;
    }

    let result = '';
    let status: CommandLog['status'] = 'SUCCESS';

    switch (true) {
      case cmd === '/help':
        result = `AVAILABLE TACTICAL DIRECTIVES:
• /status     - System integrity, connection matrix & blade status
• /tasks      - List active tactical directives in Action Queue
• /memory     - Query indexed memory recall nodes
• /focus [m]  - Trigger combat focus timer (e.g. /focus 25)
• /analytics  - Open productivity & directive telemetry
• /profile    - View operator dossier & security credentials
• /settings   - Open core configuration & voice parameters
• /logout     - Terminate active session
• /clear      - Flush terminal log history`;
        break;

      case cmd === '/status':
        result = `SYSTEM TELEMETRY REPORT:
• KERNEL: JARVIS ZORO EDITION v2.0
• OPERATOR: ${profile?.display_name || currentSession?.displayName || 'COMMANDER'}
• BACKEND: ${isSupabase ? 'SUPABASE POSTGRESQL [CONNECTED]' : 'LOCAL SANDBOX'}
• AI ENGINE: GOOGLE GEMINI 1.5 FLASH [ONLINE]
• BLADE STATUS: 3 BLADES SYNCHRONIZED`;
        break;

      case cmd === '/tasks':
        onNavigate('/tasks');
        result = 'Routing operator to Action Queue...';
        break;

      case cmd === '/memory':
        onNavigate('/memory');
        result = 'Routing operator to Memory Bank...';
        break;

      case cmd === '/analytics':
        onNavigate('/analytics');
        result = 'Routing operator to Productivity Analytics...';
        break;

      case cmd === '/profile':
        onNavigate('/profile');
        result = 'Routing operator to Dossier...';
        break;

      case cmd === '/settings':
        onNavigate('/settings');
        result = 'Opening system settings...';
        break;

      case cmd === '/logout':
        logout();
        result = 'Session terminated. Operator logged out.';
        break;

      case cmd.startsWith('/focus'):
        onNavigate('/dashboard');
        result = 'Focus session initialized on Tactical Dashboard.';
        break;

      default:
        result = `Directive executed: "${cmd}". System acknowledged.`;
        break;
    }

    const newLog: CommandLog = {
      id: 'cmd_' + Date.now(),
      user_id: userId,
      command: cmd,
      status,
      result,
      created_at: Date.now(),
    };

    const updated = [newLog, ...logs];
    setLogs(updated);
    setLocalStore(`cmds_${userId}`, updated);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#16281F] pb-4">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-[#19F59A]" />
          <div>
            <h1 className="text-base font-bold text-[#F5F7F6] tracking-wider">
              TACTICAL CLI TERMINAL
            </h1>
            <p className="text-[10px] text-[#8B9992]">
              DIRECT COMMAND EXECUTION PIPELINE • KERNEL ACCESS
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setLogs([]);
            setLocalStore(`cmds_${userId}`, []);
          }}
          className="text-xs text-[#8B9992] hover:text-[#FF3B30] flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> CLEAR LOGS
        </button>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {quickCommands.map((q) => (
          <button
            key={q}
            onClick={() => handleExecute(q)}
            className="px-2.5 py-1 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] hover:border-[#00D084]/50 shrink-0 transition-all text-[11px]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Terminal Output Window */}
      <div className="rounded-xl bg-[#0A100D] border border-[#16281F] p-4 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4 text-xs">
        <div className="text-[11px] text-[#8B9992]">
          JARVIS ZORO OS [Version 2.0.0-tactical]
          <br />
          (c) Autonomous Defense Systems. Type <span className="text-[#19F59A]">/help</span> for instruction set.
        </div>

        {logs.map((log) => (
          <div key={log.id} className="space-y-1 border-t border-[#16281F]/60 pt-2">
            <div className="flex items-center gap-2 text-[#00D084]">
              <span className="text-[#8B9992]">zoro@jarvis:~$</span>
              <span className="font-bold text-[#F5F7F6]">{log.command}</span>
            </div>
            <pre className="text-[#8B9992] whitespace-pre-wrap pl-4 font-mono text-[11px]">
              {log.result}
            </pre>
          </div>
        ))}
      </div>

      {/* Prompt Input */}
      <div className="flex items-center gap-2 bg-[#0A100D] border border-[#16281F] rounded-lg p-2">
        <span className="text-xs text-[#00D084] pl-2 font-bold select-none">
          zoro@jarvis:~$
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
          placeholder="Enter command directive (e.g. /status, /help, /tasks)..."
          className="flex-1 bg-transparent text-xs text-[#F5F7F6] focus:outline-none font-mono"
        />
        <button
          onClick={() => handleExecute()}
          className="p-1.5 rounded bg-[#00D084] text-[#050706] hover:bg-[#19F59A] transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
