import { Memory } from '../types';
import { getLocalStore, setLocalStore, supabase, isSupabaseConfigured } from './supabase';
import { realtimeService } from './realtime';

const SENSITIVE_PATTERNS = [
  /password\s*[:=]\s*\S+/i,
  /api[_-]?key\s*[:=]\s*\S+/i,
  /secret[_-]?key\s*[:=]\s*\S+/i,
  /bearer\s+[a-zA-Z0-9_\-\.]{20,}/i,
  /ghp_[a-zA-Z0-9]{30,}/i, // GitHub personal access token
  /AIza[0-9A-Za-z-_]{35}/i, // Google API key
  /eyJh[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9_\-\.]+/i, // JWT
  /(?:private[_-]?key|rsa[_-]?private)/i,
  /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/, // Credit card
];

export function isSecretOrSensitive(text: string): boolean {
  if (!text) return false;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

const DEFAULT_MEMORIES = (userId: string): Memory[] => [
  {
    id: 'mem_seed_1',
    user_id: userId,
    content: 'Operator prefers concise tactical directives with zero conversational filler.',
    category: 'PREFERENCE',
    importance: 'HIGH',
    source: 'USER',
    pinned: true,
    created_at: Date.now() - 86400000 * 2,
  },
  {
    id: 'mem_seed_2',
    user_id: userId,
    content: 'Primary combat mission: Master AI-driven personal autonomy using Google Gemini.',
    category: 'PROJECT',
    importance: 'CRITICAL',
    source: 'USER',
    pinned: true,
    created_at: Date.now() - 86400000,
  },
  {
    id: 'mem_seed_3',
    user_id: userId,
    content: 'Daily training routine begins at 0600 hours with kata meditation.',
    category: 'GENERAL',
    importance: 'MEDIUM',
    source: 'USER',
    pinned: false,
    created_at: Date.now() - 43200000,
  },
];

export class MemoryService {
  static getMemories(userId: string): Memory[] {
    const memories = getLocalStore<Memory[]>(`memories_${userId}`, []);
    if (memories.length === 0) {
      const seeded = DEFAULT_MEMORIES(userId);
      setLocalStore(`memories_${userId}`, seeded);
      return seeded;
    }
    return memories;
  }

  static async fetchRemoteMemories(userId: string): Promise<Memory[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('memories')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Memory[] = data.map((d: any) => ({
            id: d.id,
            user_id: d.user_id,
            content: d.content,
            category: d.category,
            importance: d.importance,
            source: d.source || 'USER',
            pinned: Boolean(d.pinned),
            created_at: typeof d.created_at === 'string' ? new Date(d.created_at).getTime() : d.created_at,
            updated_at: d.updated_at ? (typeof d.updated_at === 'string' ? new Date(d.updated_at).getTime() : d.updated_at) : undefined,
          }));
          setLocalStore(`memories_${userId}`, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase memory fetch fallback to local sandbox', err);
      }
    }
    return this.getMemories(userId);
  }

  static saveMemory(
    userId: string,
    params: {
      content: string;
      category?: Memory['category'];
      importance?: Memory['importance'];
      pinned?: boolean;
      source?: Memory['source'];
    }
  ): { success: boolean; memory?: Memory; error?: string } {
    const cleanContent = params.content.trim();
    if (!cleanContent) {
      return { success: false, error: 'Memory content cannot be empty.' };
    }

    if (isSecretOrSensitive(cleanContent)) {
      return {
        success: false,
        error: 'REFUSED: Sensitive credentials (passwords, tokens, API keys) cannot be stored in persistent memory.',
      };
    }

    const current = this.getMemories(userId);
    const newMem: Memory = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      content: cleanContent,
      category: params.category || 'GENERAL',
      importance: params.importance || 'MEDIUM',
      source: params.source || 'USER',
      pinned: params.pinned ?? (params.importance === 'CRITICAL'),
      created_at: Date.now(),
    };

    const updated = [newMem, ...current];
    setLocalStore(`memories_${userId}`, updated);

    // Sync to Supabase in background if configured
    if (isSupabaseConfigured && supabase) {
      supabase.from('memories').insert({
        id: newMem.id,
        user_id: userId,
        content: newMem.content,
        category: newMem.category,
        importance: newMem.importance,
        source: newMem.source,
        pinned: newMem.pinned,
        created_at: new Date(newMem.created_at).toISOString(),
      }).then(() => {}, () => {});
    }

    this.auditAction(userId, 'MEMORY_CREATED', {
      category: newMem.category,
      importance: newMem.importance,
      source: newMem.source,
    });

    realtimeService.broadcast('MEMORY_CREATED', newMem);

    return { success: true, memory: newMem };
  }

  static updateMemory(
    userId: string,
    id: string,
    updates: Partial<Omit<Memory, 'id' | 'user_id' | 'created_at'>>
  ): Memory | null {
    if (updates.content && isSecretOrSensitive(updates.content)) {
      throw new Error('REFUSED: Sensitive credentials cannot be stored in memory.');
    }

    const current = this.getMemories(userId);
    let updatedMem: Memory | null = null;

    const newList = current.map((m) => {
      if (m.id === id) {
        updatedMem = {
          ...m,
          ...updates,
          content: updates.content !== undefined ? updates.content.trim() : m.content,
          updated_at: Date.now(),
        };
        return updatedMem;
      }
      return m;
    });

    if (updatedMem) {
      setLocalStore(`memories_${userId}`, newList);
      if (isSupabaseConfigured && supabase) {
        supabase.from('memories').update({
          ...updates,
          updated_at: new Date().toISOString(),
        }).eq('id', id).eq('user_id', userId).then(() => {}, () => {});
      }
      this.auditAction(userId, 'MEMORY_UPDATED', { id });
      realtimeService.broadcast('MEMORY_UPDATED', updatedMem);
    }

    return updatedMem;
  }

  static deleteMemory(userId: string, id: string): boolean {
    const current = this.getMemories(userId);
    const filtered = current.filter((m) => m.id !== id);
    if (filtered.length === current.length) return false;

    setLocalStore(`memories_${userId}`, filtered);

    if (isSupabaseConfigured && supabase) {
      supabase.from('memories').delete().eq('id', id).eq('user_id', userId).then(() => {}, () => {});
    }

    this.auditAction(userId, 'MEMORY_DELETED', { id });
    realtimeService.broadcast('MEMORY_DELETED', { id });
    return true;
  }

  static togglePin(userId: string, id: string): Memory | null {
    const current = this.getMemories(userId);
    let toggled: Memory | null = null;

    const updated = current.map((m) => {
      if (m.id === id) {
        toggled = { ...m, pinned: !m.pinned, updated_at: Date.now() };
        return toggled;
      }
      return m;
    });

    if (toggled) {
      setLocalStore(`memories_${userId}`, updated);
      if (isSupabaseConfigured && supabase) {
        supabase.from('memories').update({
          pinned: (toggled as Memory).pinned,
          updated_at: new Date().toISOString(),
        }).eq('id', id).eq('user_id', userId).then(() => {}, () => {});
      }
      this.auditAction(userId, (toggled as Memory).pinned ? 'MEMORY_PINNED' : 'MEMORY_UNPINNED', { id });
      realtimeService.broadcast((toggled as Memory).pinned ? 'MEMORY_PINNED' : 'MEMORY_UNPINNED', toggled);
    }

    return toggled;
  }

  static searchMemories(
    userId: string,
    query: string,
    categoryFilter: string = 'ALL',
    importanceFilter: string = 'ALL'
  ): Memory[] {
    const memories = this.getMemories(userId);
    const q = query.toLowerCase().trim();

    return memories.filter((m) => {
      const matchCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
      const matchImportance = importanceFilter === 'ALL' || m.importance === importanceFilter;
      const matchQuery =
        !q ||
        m.content.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.importance.toLowerCase().includes(q);

      return matchCategory && matchImportance && matchQuery;
    });
  }

  /**
   * Semantic & keyword retrieval for relevant memory injection into Gemini context.
   * Prioritizes pinned nodes, keyword overlap, category relevance, importance, and recency.
   * Keeps payload minimal and strictly relevant.
   */
  static findRelevantMemories(userId: string, userQuery: string, limit: number = 4): Memory[] {
    const memories = this.getMemories(userId);
    if (memories.length === 0) return [];

    const lowerQuery = userQuery.toLowerCase();
    const queryTokens = lowerQuery
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    // Calculate score for each memory
    const scored = memories.map((mem) => {
      let score = 0;
      const lowerContent = mem.content.toLowerCase();
      const contentTokens = lowerContent
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);

      // Pinned bonus
      if (mem.pinned) score += 5;

      // Importance weighting
      switch (mem.importance) {
        case 'CRITICAL':
          score += 4;
          break;
        case 'HIGH':
          score += 3;
          break;
        case 'MEDIUM':
          score += 1;
          break;
      }

      // Keyword token overlap
      let tokenMatches = 0;
      for (const token of queryTokens) {
        if (lowerContent.includes(token)) {
          score += 4;
          tokenMatches++;
        }
        if (mem.category.toLowerCase().includes(token)) {
          score += 3;
        }
      }

      // Semantic domain triggers
      if (
        (lowerQuery.includes('project') || lowerQuery.includes('build') || lowerQuery.includes('code') || lowerQuery.includes('software')) &&
        mem.category === 'PROJECT'
      ) {
        score += 4;
      }
      if (
        (lowerQuery.includes('prefer') || lowerQuery.includes('like') || lowerQuery.includes('favorite') || lowerQuery.includes('style')) &&
        mem.category === 'PREFERENCE'
      ) {
        score += 4;
      }
      if (
        (lowerQuery.includes('study') || lowerQuery.includes('academic') || lowerQuery.includes('college') || lowerQuery.includes('learn')) &&
        mem.category === 'ACADEMIC'
      ) {
        score += 4;
      }
      if (
        (lowerQuery.includes('who am i') || lowerQuery.includes('profile') || lowerQuery.includes('my name') || lowerQuery.includes('identity')) &&
        mem.category === 'PROFILE'
      ) {
        score += 6;
      }
      if (
        (lowerQuery.includes('date') || lowerQuery.includes('deadline') || lowerQuery.includes('when') || lowerQuery.includes('schedule')) &&
        mem.category === 'IMPORTANT_DATE'
      ) {
        score += 4;
      }

      return { mem, score, tokenMatches };
    });

    // If query is specifically asking about memory or identity, return top scored with any positive correlation
    const relevant = scored
      .filter((s) => s.tokenMatches > 0 || s.score >= 7)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.mem);

    if (relevant.length > 0) {
      this.auditAction(userId, 'MEMORY_RETRIEVED', { count: relevant.length });
    }

    return relevant;
  }

  /**
   * Duplicate and conflict detection
   */
  static detectDuplicateOrConflict(
    userId: string,
    newContent: string,
    category?: Memory['category']
  ): { isDuplicate: boolean; conflictWith?: Memory; reason?: string } {
    const memories = this.getMemories(userId);
    const clean = newContent.toLowerCase().trim();

    // Check exact or near-identical duplicate
    for (const mem of memories) {
      const existing = mem.content.toLowerCase().trim();
      if (clean === existing) {
        return { isDuplicate: true, conflictWith: mem, reason: 'IDENTICAL_CONTENT' };
      }

      // Check key subject overlap e.g. "favorite language is Python" vs "favorite programming language is Python"
      const cleanTokens = clean.split(/\s+/).filter((w) => w.length > 3 && !STOP_WORDS.has(w));
      const existingTokens = existing.split(/\s+/).filter((w) => w.length > 3 && !STOP_WORDS.has(w));
      const common = cleanTokens.filter((t) => existingTokens.includes(t));

      if (cleanTokens.length > 0 && common.length / Math.max(cleanTokens.length, existingTokens.length) > 0.8) {
        return { isDuplicate: true, conflictWith: mem, reason: 'HIGH_SEMANTIC_OVERLAP' };
      }

      // Conflict detection: Same subject with differing target
      // e.g. "favorite language is Python" vs "favorite language is C++"
      if (
        (clean.includes('favorite') && existing.includes('favorite')) ||
        (clean.includes('project is called') && existing.includes('project is called')) ||
        (clean.includes('main project') && existing.includes('main project'))
      ) {
        if (clean !== existing) {
          return { isDuplicate: false, conflictWith: mem, reason: 'CONTRADICTION_DETECTED' };
        }
      }
    }

    return { isDuplicate: false };
  }

  private static auditAction(userId: string, action: string, meta: Record<string, any> = {}) {
    try {
      const existing = getLocalStore<any[]>(`events_${userId}`, []);
      const event = {
        id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        event_type: action,
        payload: JSON.stringify(meta),
        created_at: Date.now(),
      };
      setLocalStore(`events_${userId}`, [event, ...existing.slice(0, 99)]);
    } catch (err) {
      console.error('Failed to log memory audit event', err);
    }
  }
}

const STOP_WORDS = new Set([
  'the', 'and', 'that', 'this', 'with', 'from', 'have', 'were', 'which', 'about',
  'there', 'their', 'what', 'when', 'where', 'will', 'your', 'been', 'would', 'could',
  'should', 'remember', 'save', 'please', 'tell', 'know', 'want', 'like', 'just'
]);
