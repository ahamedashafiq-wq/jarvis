import React, { useState, useRef, useEffect, ReactNode } from 'react';
import {
  Minus,
  Square,
  Copy,
  X,
  Pin,
  Move,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { OSWindow } from '../../types';
import { WindowErrorBoundary } from './WindowErrorBoundary';

interface OSWindowFrameProps {
  window: OSWindow;
  isActive: boolean;
  onFocus: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onPin: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  containerBounds?: { width: number; height: number };
  children: ReactNode;
}

export const OSWindowFrame: React.FC<OSWindowFrameProps> = ({
  window: win,
  isActive,
  onFocus,
  onMinimize,
  onMaximize,
  onClose,
  onPin,
  onMove,
  onResize,
  containerBounds = { width: 1920, height: 1080 },
  children,
}) => {
  // If minimized, do not render body
  if (win.state === 'MINIMIZED') {
    return null;
  }

  const isMaximized = win.state === 'MAXIMIZED' || win.state === 'FULLSCREEN';

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; startW: number; startH: number }>({
    mouseX: 0,
    mouseY: 0,
    startW: 0,
    startH: 0,
  });

  // Drag listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      const newX = dragStartRef.current.startX + deltaX;
      const newY = dragStartRef.current.startY + deltaY;

      onMove(newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onMove]);

  // Resize listeners
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartRef.current.mouseX;
      const deltaY = e.clientY - resizeStartRef.current.mouseY;

      const newW = resizeStartRef.current.startW + deltaX;
      const newH = resizeStartRef.current.startH + deltaY;

      onResize(newW, newH);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    onFocus();

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: win.position.x,
      startY: win.position.y,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    e.stopPropagation();
    onFocus();

    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: win.size.width,
      startH: win.size.height,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'se-resize';
  };

  const style: React.CSSProperties = isMaximized
    ? {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        bottom: 8,
        width: 'calc(100% - 16px)',
        height: 'calc(100% - 16px)',
        zIndex: win.pinned ? 45 : win.zIndex + 20,
      }
    : {
        position: 'absolute',
        left: `${win.position.x}px`,
        top: `${win.position.y}px`,
        width: `${win.size.width}px`,
        height: `${win.size.height}px`,
        zIndex: win.pinned ? 40 : win.zIndex,
      };

  return (
    <div
      style={style}
      onMouseDown={onFocus}
      className={`rounded-2xl flex flex-col overflow-hidden font-mono shadow-2xl transition-shadow ${
        isActive
          ? 'border border-[#00D084] shadow-[0_0_25px_rgba(0,208,132,0.18)] bg-[#0A100D]'
          : 'border border-[#16281F] opacity-95 hover:border-[#16281F]/90 bg-[#0A100D]/95'
      }`}
    >
      {/* Window Title Bar */}
      <div
        onMouseDown={handleDragStart}
        onDoubleClick={onMaximize}
        className={`px-3.5 py-2.5 flex items-center justify-between border-b select-none cursor-move transition-colors ${
          isActive
            ? 'bg-[#121C17] border-[#00D084]/40 text-[#F5F7F6]'
            : 'bg-[#050706] border-[#16281F] text-[#8B9992]'
        }`}
      >
        {/* Left: Indicator & Title */}
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {/* Zoro Three-Blade Indicator Dot */}
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isActive ? 'bg-[#19F59A] shadow-[0_0_6px_#19F59A]' : 'bg-[#8B9992]/60'
            }`}
          />
          <span className="font-bold text-xs truncate tracking-wide">
            {win.title}
          </span>
          {win.pinned && (
            <span className="text-[8px] font-bold px-1 rounded bg-[#00D084]/20 text-[#19F59A]">
              PINNED
            </span>
          )}
        </div>

        {/* Right: Custom Zoro Window Controls */}
        <div className="flex items-center gap-1 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          {/* Pin toggle */}
          <button
            onClick={onPin}
            className={`p-1 rounded transition-colors ${
              win.pinned
                ? 'text-[#19F59A] bg-[#00D084]/15'
                : 'text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#16281F]'
            }`}
            title={win.pinned ? 'Unpin window' : 'Pin window to top'}
          >
            <Pin className="w-3 h-3" />
          </button>

          {/* Minimize button (─) */}
          <button
            onClick={onMinimize}
            className="p-1 rounded text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#16281F] transition-colors"
            title="Minimize window"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Maximize / Restore button (□) */}
          <button
            onClick={onMaximize}
            className="p-1 rounded text-[#8B9992] hover:text-[#19F59A] hover:bg-[#16281F] transition-colors"
            title={isMaximized ? 'Restore window size' : 'Maximize window'}
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>

          {/* Close button (×) */}
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8B9992] hover:text-[#FF3B30] hover:bg-[#FF3B30]/20 transition-colors"
            title="Close window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body Container wrapped in ErrorBoundary */}
      <div className="flex-1 overflow-y-auto bg-[#050706] relative">
        <WindowErrorBoundary moduleTitle={win.title}>
          {children}
        </WindowErrorBoundary>
      </div>

      {/* Resize Handle (Bottom-Right corner) */}
      {!isMaximized && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 select-none z-10 text-[#8B9992]/60 hover:text-[#19F59A]"
          title="Drag to resize window"
        >
          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 6 6">
            <circle cx="5" cy="5" r="0.75" />
            <circle cx="5" cy="2.5" r="0.75" />
            <circle cx="2.5" cy="5" r="0.75" />
          </svg>
        </div>
      )}
    </div>
  );
};
