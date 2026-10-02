import React, { useState } from 'react';
import { Target, Layers, ChevronDown, Check, X, FolderKanban } from 'lucide-react';
import { MissionService } from '../../services/mission';
import { OSWorkspace } from '../../types';

interface ContextBarProps {
  userId: string;
  activeWorkspace: OSWorkspace;
  onSwitchWorkspace: (workspaceId: string) => void;
  allWorkspaces: OSWorkspace[];
  onAssociateProject: (projectId: string, projectName: string) => void;
}

export const ContextBar: React.FC<ContextBarProps> = ({
  userId,
  activeWorkspace,
  onSwitchWorkspace,
  allWorkspaces,
  onAssociateProject,
}) => {
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  const missions = MissionService.getMissions(userId);
  const activeProjectName =
    activeWorkspace.associatedProjectName ||
    (missions.length > 0 ? missions[0].title : 'System Default Context');

  return (
    <div className="flex items-center gap-2 sm:gap-4 px-3 py-1.5 rounded-xl bg-[#0A100D] border border-[#16281F] text-[11px] font-mono shadow-sm">
      {/* Current Project / Mission Context */}
      <div className="relative">
        <button
          onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#050706] border border-[#16281F] hover:border-[#38E1FF]/50 text-[#8B9992] hover:text-[#F5F7F6] transition-colors"
          title="Click to switch project context"
        >
          <Target className="w-3.5 h-3.5 text-[#38E1FF]" />
          <span className="text-[10px] text-[#8B9992] hidden sm:inline">PROJECT:</span>
          <span className="font-bold text-[#F5F7F6] max-w-[120px] sm:max-w-[160px] truncate">
            {activeProjectName}
          </span>
          <ChevronDown className="w-3 h-3 text-[#8B9992]" />
        </button>

        {isProjectMenuOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#0A100D] border border-[#16281F] rounded-xl shadow-2xl p-2 z-50 space-y-1">
            <div className="text-[9px] font-bold text-[#8B9992] px-2 py-1 uppercase border-b border-[#16281F]">
              Select Project Context
            </div>
            <div className="max-h-52 overflow-y-auto space-y-0.5">
              {missions.length === 0 ? (
                <div className="p-3 text-center text-[#8B9992] text-[10px]">
                  No active projects found.
                </div>
              ) : (
                missions.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onAssociateProject(m.id, m.title);
                      setIsProjectMenuOpen(false);
                    }}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      activeProjectName === m.title
                        ? 'bg-[#121C17] text-[#19F59A] font-bold'
                        : 'text-[#8B9992] hover:bg-[#121C17]/40 hover:text-[#F5F7F6]'
                    }`}
                  >
                    <span className="truncate">{m.title}</span>
                    {activeProjectName === m.title && <Check className="w-3.5 h-3.5" />}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Workspace Switcher */}
      <div className="relative">
        <button
          onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#050706] border border-[#16281F] hover:border-[#00D084]/50 text-[#8B9992] hover:text-[#F5F7F6] transition-colors"
          title="Click to switch workspace"
        >
          <Layers className="w-3.5 h-3.5 text-[#19F59A]" />
          <span className="text-[10px] text-[#8B9992] hidden sm:inline">WORKSPACE:</span>
          <span className="font-bold text-[#19F59A] max-w-[110px] truncate">
            {activeWorkspace.name}
          </span>
          <ChevronDown className="w-3 h-3 text-[#8B9992]" />
        </button>

        {isWorkspaceMenuOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#0A100D] border border-[#16281F] rounded-xl shadow-2xl p-2 z-50 space-y-1">
            <div className="text-[9px] font-bold text-[#8B9992] px-2 py-1 uppercase border-b border-[#16281F]">
              Workspaces (Ctrl + 1-4)
            </div>
            {allWorkspaces.map((ws, idx) => (
              <div
                key={ws.id}
                onClick={() => {
                  onSwitchWorkspace(ws.id);
                  setIsWorkspaceMenuOpen(false);
                }}
                className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  activeWorkspace.id === ws.id
                    ? 'bg-[#121C17] text-[#19F59A] font-bold'
                    : 'text-[#8B9992] hover:bg-[#121C17]/40 hover:text-[#F5F7F6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-1 py-0.5 rounded bg-[#050706] text-[#8B9992]">
                    #{idx + 1}
                  </span>
                  <span>{ws.name}</span>
                </div>
                {activeWorkspace.id === ws.id && <Check className="w-3.5 h-3.5" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
