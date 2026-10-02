import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Activity,
  Layers,
  Copy,
  Trash2,
  X,
  Check,
  Search,
  Cpu,
  Radio,
  Clock,
} from 'lucide-react';
import { getLocalStore } from '../../services/supabase';
import { realtimeService } from '../../services/realtime';
import { AgentCore } from '../../services/agent';
import { soundService } from '../../services/sound';

interface DeveloperConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const DeveloperConsoleModal: React.FC<DeveloperConsoleModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'AGENT_PLANS' | 'REALTIME' | 'STORAGE'>('LOGS');
  const [logs, setLogs] = useState<any[]>([]);
  const [realtimeLogs, setRealtimeLogs] = useState<any[]>([]);
  const [agentExecutions, setAgentExecutions] = useState<any[]>([]);
  const [filterText, setFilterText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = () => {
    // Load command logs
    const cmdLogs = getLocalStore<any[]>(`cmds_${userId}`, []);
    setLogs(cmdLogs);

    // Load agent executions
    const execs = AgentCore.getExecutions(userId);
    setAgentExecutions(execs);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      soundService.play('CLICK');

      const unsub = realtimeService.on('*', (event) => {
        setRealtimeLogs((prev) => [
          {
            id: event.id || String(Date.now() + Math.random()),
            time: new Date(event.timestamp).toLocaleTimeString(),
            type: event.type,
            payload: JSON.stringify(event.payload),
          },
          ...prev.slice(0, 49),
        ]);
      });

      return () => unsub();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundService.play('CLICK');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredLogs = logs.filter(
    (l) =>
      !filterText ||
      l.command?.toLowerCase().includes(filterText.toLowerCase()) ||
      l.result?.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono text-xs">
      <div className="w-full max-w-4xl rounded-lg border border-jarvis-border bg-jarvis-surfaceElevated shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-jarvis-border flex items-center justify-between bg-jarvis-surface">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-jarvis-secondary" />
            <div>
              <h2 className="text-sm font-bold text-jarvis-text tracking-wider">
                ZORO DEVELOPER CONSOLE & KERNEL TRACE
              </h2>
              <p className="text-[10px] text-jarvis-textMuted">
                Raw Event Stream, Tool Invocations, Latency & Agent Plan State
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded border border-jarvis-border bg-jarvis-surfaceElevated hover:border-jarvis-danger text-jarvis-textSecondary hover:text-jarvis-danger transition-colors"
            aria-label="Close Developer Console"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation & Search */}
        <div className="px-4 py-2.5 border-b border-jarvis-border/60 bg-jarvis-surface/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('LOGS')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'LOGS'
                  ? 'bg-jarvis-secondary/20 text-jarvis-secondary border border-jarvis-secondary/40 font-semibold'
                  : 'text-jarvis-textSecondary hover:text-jarvis-text'
              }`}
            >
              COMMAND LOGS ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('AGENT_PLANS')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'AGENT_PLANS'
                  ? 'bg-jarvis-primary/20 text-jarvis-primary border border-jarvis-primary/40 font-semibold'
                  : 'text-jarvis-textSecondary hover:text-jarvis-text'
              }`}
            >
              AGENT TRACES ({agentExecutions.length})
            </button>
            <button
              onClick={() => setActiveTab('REALTIME')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'REALTIME'
                  ? 'bg-jarvis-accent/20 text-jarvis-accent border border-jarvis-accent/40 font-semibold'
                  : 'text-jarvis-textSecondary hover:text-jarvis-text'
              }`}
            >
              WEBSOCKET EVENTS ({realtimeLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('STORAGE')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'STORAGE'
                  ? 'bg-jarvis-warning/20 text-jarvis-warning border border-jarvis-warning/40 font-semibold'
                  : 'text-jarvis-textSecondary hover:text-jarvis-text'
              }`}
            >
              STORAGE KEYS
            </button>
          </div>

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-jarvis-textMuted absolute left-2 pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter trace..."
              className="pl-7 pr-3 py-1 rounded border border-jarvis-border bg-jarvis-bg text-jarvis-text placeholder:text-jarvis-textMuted text-[11px] focus:outline-none focus:border-jarvis-secondary"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-jarvis-bg/60">
          {activeTab === 'LOGS' && (
            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-jarvis-textMuted">
                  NO COMMAND LOGS RECORDED YET. EXECUTE A COMMAND IN THE COMMAND CENTER.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded border border-jarvis-border bg-jarvis-surface/90 hover:border-jarvis-borderHover transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-jarvis-textMuted">
                      <div className="flex items-center gap-2">
                        <span className="text-jarvis-primary font-bold">[{log.status || 'SUCCESS'}]</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                        <span>ID: {log.id}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(log, null, 2), log.id)}
                        className="text-jarvis-textSecondary hover:text-jarvis-primary flex items-center gap-1"
                      >
                        {copiedId === log.id ? <Check className="w-3 h-3 text-jarvis-primary" /> : <Copy className="w-3 h-3" />}
                        <span>COPY JSON</span>
                      </button>
                    </div>

                    <div className="text-jarvis-text font-semibold flex items-center gap-2">
                      <span className="text-jarvis-secondary">›</span>
                      <span>{log.command}</span>
                    </div>

                    {log.result && (
                      <pre className="text-[11px] text-jarvis-textSecondary bg-jarvis-bg p-2 rounded border border-jarvis-border/40 overflow-x-auto whitespace-pre-wrap">
                        {typeof log.result === 'string' ? log.result : JSON.stringify(log.result, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'AGENT_PLANS' && (
            <div className="space-y-3">
              {agentExecutions.length === 0 ? (
                <div className="text-center py-12 text-jarvis-textMuted">
                  NO AGENT PLAN EXECUTIONS RECORDED YET.
                </div>
              ) : (
                agentExecutions.map((exec) => (
                  <div
                    key={exec.id}
                    className="p-3 rounded border border-jarvis-border bg-jarvis-surface space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="text-jarvis-primary font-bold">{exec.objective}</span>
                        <span className="px-1.5 py-0.5 rounded bg-jarvis-surfaceElevated border border-jarvis-border text-jarvis-secondary">
                          {exec.status}
                        </span>
                      </div>
                      <span className="text-jarvis-textMuted">ID: {exec.id}</span>
                    </div>

                    {exec.plan?.steps && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-jarvis-textMuted uppercase font-semibold">
                          Execution Steps ({exec.plan.steps.length}):
                        </div>
                        {exec.plan.steps.map((st: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-[11px] bg-jarvis-bg p-1.5 rounded border border-jarvis-border/40"
                          >
                            <span className="text-jarvis-text">
                              {st.step_number}. Tool: <span className="text-jarvis-primary">{st.tool}</span>
                            </span>
                            <span className="text-[10px] text-jarvis-textMuted">{st.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'REALTIME' && (
            <div className="space-y-1.5">
              {realtimeLogs.length === 0 ? (
                <div className="text-center py-12 text-jarvis-textMuted">
                  LISTENING FOR WEBSOCKET EVENTS...
                </div>
              ) : (
                realtimeLogs.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2 rounded border border-jarvis-border/60 bg-jarvis-surface text-[10px] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-jarvis-accent font-semibold">{evt.type}</span>
                      <span className="text-jarvis-textSecondary truncate">{evt.payload}</span>
                    </div>
                    <span className="text-jarvis-textMuted shrink-0">{evt.time}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'STORAGE' && (
            <div className="space-y-2">
              <div className="text-[10px] text-jarvis-textMuted">
                LOCAL PERSISTENT STORAGE KEYS (Prefix: jarvis_zoro_):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.keys(localStorage)
                  .filter((k) => k.startsWith('jarvis_'))
                  .map((k) => {
                    const rawVal = localStorage.getItem(k) || '';
                    return (
                      <div
                        key={k}
                        className="p-2.5 rounded border border-jarvis-border bg-jarvis-surface text-[11px]"
                      >
                        <div className="font-semibold text-jarvis-primary truncate mb-1">{k}</div>
                        <div className="text-[10px] text-jarvis-textMuted truncate">
                          Size: {rawVal.length} bytes
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-jarvis-border bg-jarvis-surface flex items-center justify-between text-[11px] text-jarvis-textMuted">
          <span>DEVELOPER MODE • EPHEMERAL IN-MEMORY DEBUG TRACES</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded border border-jarvis-border bg-jarvis-surfaceElevated hover:border-jarvis-primary text-jarvis-text text-xs"
          >
            CLOSE CONSOLE
          </button>
        </div>
      </div>
    </div>
  );
};
