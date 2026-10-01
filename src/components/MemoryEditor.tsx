import React, { useState, useEffect } from 'react';
import { Memory } from '../types';
import { X, Database, Save } from 'lucide-react';

interface MemoryEditorProps {
  isOpen: boolean;
  initialMemory?: Memory | null;
  onSave: (data: {
    id?: string;
    content: string;
    category: Memory['category'];
    importance: Memory['importance'];
    pinned: boolean;
  }) => void;
  onClose: () => void;
}

export const MemoryEditor: React.FC<MemoryEditorProps> = ({
  isOpen,
  initialMemory,
  onSave,
  onClose,
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Memory['category']>('GENERAL');
  const [importance, setImportance] = useState<Memory['importance']>('MEDIUM');
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMemory) {
      setContent(initialMemory.content);
      setCategory(initialMemory.category);
      setImportance(initialMemory.importance);
      setPinned(initialMemory.pinned);
    } else {
      setContent('');
      setCategory('GENERAL');
      setImportance('MEDIUM');
      setPinned(false);
    }
    setError(null);
  }, [initialMemory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Memory content cannot be empty. Specify tactical parameters.');
      return;
    }

    onSave({
      id: initialMemory?.id,
      content: trimmed,
      category,
      importance,
      pinned,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono text-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0A100D] border border-[#FFB000]/40 p-6 shadow-[0_0_50px_rgba(255,176,0,0.15)] space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#8B9992] hover:text-[#F5F7F6] transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#16281F] pb-3">
          <div className="p-2 rounded-xl bg-[#FFB000]/15 text-[#FFB000] border border-[#FFB000]/30 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#FFB000] font-bold tracking-widest block">
              BLADE 03 • PERSISTENT MEMORY CORE
            </span>
            <h3 className="text-base font-black text-[#F5F7F6] tracking-wide">
              {initialMemory ? 'EDIT MEMORY NODE' : 'STORE NEW MEMORY NODE'}
            </h3>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#FF3B30] text-[11px]">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-[#8B9992] font-bold block mb-1.5 tracking-wider">
              MEMORY CONTENT / INTEL
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Operator prefers Python for data engineering and C++ for low-latency systems."
              className="w-full bg-[#050706] border border-[#16281F] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F7F6] placeholder-[#8B9992]/60 focus:border-[#FFB000] focus:ring-1 focus:ring-[#FFB000] outline-none font-sans"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#8B9992] font-bold block mb-1.5 tracking-wider">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Memory['category'])}
                className="w-full bg-[#050706] border border-[#16281F] rounded-xl px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#FFB000] outline-none"
              >
                <option value="GENERAL">GENERAL</option>
                <option value="PROFILE">PROFILE</option>
                <option value="PREFERENCE">PREFERENCE</option>
                <option value="PROJECT">PROJECT</option>
                <option value="ACADEMIC">ACADEMIC</option>
                <option value="IMPORTANT_DATE">IMPORTANT_DATE</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#8B9992] font-bold block mb-1.5 tracking-wider">
                IMPORTANCE
              </label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value as Memory['importance'])}
                className="w-full bg-[#050706] border border-[#16281F] rounded-xl px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#FFB000] outline-none"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="editor_pinned"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="rounded border-[#16281F] bg-[#050706] text-[#FFB000] focus:ring-0 cursor-pointer w-4 h-4"
            />
            <label htmlFor="editor_pinned" className="text-xs text-[#8B9992] cursor-pointer">
              Pin memory to priority retrieval envelope
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#16281F]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] font-bold text-xs transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FFB000] text-[#050706] font-bold text-xs hover:bg-[#FFC030] shadow-[0_0_15px_rgba(255,176,0,0.3)] transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>SAVE MEMORY</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
