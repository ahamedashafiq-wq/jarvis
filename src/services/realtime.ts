import { RealtimeChannel } from '@supabase/supabase-js';
import {
  NetworkStatus,
  RealtimeEvent,
  RealtimeEventType,
  RealtimeStatus,
} from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

type EventListener = (event: RealtimeEvent) => void;
type StatusListener = (status: RealtimeStatus) => void;
type NetworkListener = (status: NetworkStatus) => void;

class RealtimeService {
  private currentUserId: string | null = null;
  private connectionStatus: RealtimeStatus = 'DISCONNECTED';
  private networkStatus: NetworkStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'ONLINE';

  private supabaseChannel: RealtimeChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  private listeners: Map<RealtimeEventType | '*', Set<EventListener>> = new Map();
  private statusListeners: Set<StatusListener> = new Set();
  private networkListeners: Set<NetworkListener> = new Set();

  private processedEventIds: Set<string> = new Set();
  private reconnectTimer: any = null;
  private hasReportedRestored: boolean = false;

  constructor() {
    this.initNetworkMonitoring();
    this.initCrossTabBroadcast();
  }

  private initNetworkMonitoring() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.networkStatus = 'ONLINE';
      this.notifyNetworkListeners('ONLINE');
      this.reconnect();
    });

    window.addEventListener('offline', () => {
      this.networkStatus = 'OFFLINE';
      this.notifyNetworkListeners('OFFLINE');
      this.setConnectionStatus('DISCONNECTED');
    });

    // Cross-tab storage fallback for older browsers or if BroadcastChannel is blocked
    window.addEventListener('storage', (e) => {
      if (e.key === 'jarvis_cross_tab_sync' && e.newValue) {
        try {
          const event: RealtimeEvent = JSON.parse(e.newValue);
          this.handleIncomingEvent(event);
        } catch {
          // ignore corrupted payload
        }
      }
    });
  }

  private initCrossTabBroadcast() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('jarvis_zoro_realtime');
        this.broadcastChannel.onmessage = (e: MessageEvent<RealtimeEvent>) => {
          if (e.data && e.data.id) {
            this.handleIncomingEvent(e.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel unavailable, using storage events', err);
      }
    }
  }

  public init(userId: string) {
    if (this.currentUserId === userId && this.connectionStatus === 'CONNECTED') {
      return;
    }

    this.currentUserId = userId;
    this.setConnectionStatus('CONNECTING');

    if (this.networkStatus === 'OFFLINE') {
      this.setConnectionStatus('DISCONNECTED');
      return;
    }

    if (isSupabaseConfigured && supabase) {
      this.subscribeSupabase(userId);
    } else {
      // In local sandbox environment, BroadcastChannel + storage events provide 100% real-time cross-tab sync
      setTimeout(() => {
        this.setConnectionStatus('CONNECTED');
      }, 150);
    }
  }

  private subscribeSupabase(userId: string) {
    if (!supabase) return;

    if (this.supabaseChannel) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }

    const channelName = `jarvis_user_${userId}`;
    this.supabaseChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => this.mapPostgresChangeToEvent('TASK', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories', filter: `user_id=eq.${userId}` },
        (payload) => this.mapPostgresChangeToEvent('MEMORY', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'commands', filter: `user_id=eq.${userId}` },
        (payload) => this.mapPostgresChangeToEvent('COMMAND', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => this.mapPostgresChangeToEvent('NOTIFICATION', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_events', filter: `user_id=eq.${userId}` },
        (payload) => this.mapPostgresChangeToEvent('SYSTEM_EVENT', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'missions', filter: `user_id=eq.${userId}` },
        (payload) => this.mapPostgresChangeToEvent('MISSION', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mission_objectives', filter: `user_id=eq.${userId}` },
        (payload) => this.mapPostgresChangeToEvent('OBJECTIVE', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mission_activity', filter: `user_id=eq.${userId}` },
        (payload) => this.mapPostgresChangeToEvent('MISSION_ACTIVITY', payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.setConnectionStatus('CONNECTED');
          if (this.hasReportedRestored) {
            this.broadcastInternal({
              id: 'ev_' + Date.now(),
              type: 'CONNECTION_STATE_CHANGED',
              userId,
              payload: { status: 'CONNECTED', message: 'Realtime connection restored.' },
              timestamp: Date.now(),
            });
            this.hasReportedRestored = false;
          }
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          this.setConnectionStatus('RECONNECTING');
          this.hasReportedRestored = true;
          this.scheduleReconnect();
        } else if (status === 'CLOSED') {
          this.setConnectionStatus('DISCONNECTED');
        }
      });
  }

  private mapPostgresChangeToEvent(domain: string, payload: any) {
    const eventType = payload.eventType; // 'INSERT', 'UPDATE', 'DELETE'
    let realtimeType: RealtimeEventType = 'SYSTEM_EVENT_CREATED';

    if (domain === 'TASK') {
      if (eventType === 'INSERT') realtimeType = 'TASK_CREATED';
      else if (eventType === 'UPDATE') {
        realtimeType = payload.new?.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED';
      } else if (eventType === 'DELETE') realtimeType = 'TASK_DELETED';
    } else if (domain === 'MEMORY') {
      if (eventType === 'INSERT') realtimeType = 'MEMORY_CREATED';
      else if (eventType === 'UPDATE') realtimeType = 'MEMORY_UPDATED';
      else if (eventType === 'DELETE') realtimeType = 'MEMORY_DELETED';
    } else if (domain === 'COMMAND') {
      realtimeType = 'COMMAND_RECORDED';
    } else if (domain === 'NOTIFICATION') {
      realtimeType = 'NOTIFICATION_CREATED';
    } else if (domain === 'MISSION') {
      if (eventType === 'INSERT') realtimeType = 'MISSION_CREATED';
      else if (eventType === 'UPDATE') {
        realtimeType = payload.new?.status === 'COMPLETED' ? 'MISSION_COMPLETED' : 'MISSION_UPDATED';
      } else if (eventType === 'DELETE') realtimeType = 'MISSION_DELETED';
    } else if (domain === 'OBJECTIVE') {
      if (eventType === 'INSERT') realtimeType = 'OBJECTIVE_CREATED';
      else if (eventType === 'UPDATE') {
        realtimeType = payload.new?.status === 'COMPLETED' ? 'OBJECTIVE_COMPLETED' : 'OBJECTIVE_UPDATED';
      } else if (eventType === 'DELETE') realtimeType = 'OBJECTIVE_DELETED';
    } else if (domain === 'MISSION_ACTIVITY') {
      realtimeType = 'MISSION_ACTIVITY_CREATED';
    }

    const event: RealtimeEvent = {
      id: `pg_${payload.commit_timestamp || Date.now()}_${payload.new?.id || payload.old?.id || Math.random()}`,
      type: realtimeType,
      userId: this.currentUserId || 'unknown',
      payload: payload.new || payload.old,
      timestamp: Date.now(),
    };

    this.handleIncomingEvent(event);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.currentUserId) {
        this.reconnect();
      }
    }, 4000);
  }

  public reconnect() {
    if (!this.currentUserId) return;
    this.setConnectionStatus('RECONNECTING');
    if (isSupabaseConfigured && supabase) {
      this.subscribeSupabase(this.currentUserId);
    } else {
      setTimeout(() => {
        this.setConnectionStatus('CONNECTED');
      }, 300);
    }
  }

  public disconnect() {
    if (this.supabaseChannel && supabase) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }
    this.currentUserId = null;
    this.setConnectionStatus('DISCONNECTED');
  }

  /**
   * Broadcast an event to other tabs and local listeners
   */
  public broadcast<T = any>(type: RealtimeEventType, payload: T): RealtimeEvent<T> {
    const userId = this.currentUserId || 'guest';
    const event: RealtimeEvent<T> = {
      id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type,
      userId,
      payload,
      timestamp: Date.now(),
    };

    // Track as processed so this tab doesn't double-process its own broadcast
    this.markEventProcessed(event.id);

    // 1. Send through BroadcastChannel to other tabs
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(event);
      }
    } catch (err) {
      console.warn('BroadcastChannel postMessage error', err);
    }

    // 2. Storage event fallback for cross-tab sync
    try {
      localStorage.setItem('jarvis_cross_tab_sync', JSON.stringify(event));
    } catch {
      // storage quota or private mode ignore
    }

    // 3. Notify local listeners on this tab
    this.notifyListeners(event);

    return event;
  }

  private broadcastInternal(event: RealtimeEvent) {
    if (this.isEventProcessed(event.id)) return;
    this.markEventProcessed(event.id);
    this.notifyListeners(event);
  }

  /**
   * Central ingress for incoming events from BroadcastChannel, Supabase, or storage
   */
  private handleIncomingEvent(event: RealtimeEvent) {
    if (!event || !event.id) return;
    if (this.isEventProcessed(event.id)) return;

    // Filter by authenticated user scoping (never accept another user's events)
    if (this.currentUserId && event.userId && event.userId !== this.currentUserId) {
      return;
    }

    this.markEventProcessed(event.id);
    this.notifyListeners(event);
  }

  private isEventProcessed(eventId: string): boolean {
    return this.processedEventIds.has(eventId);
  }

  private markEventProcessed(eventId: string) {
    this.processedEventIds.add(eventId);
    if (this.processedEventIds.size > 500) {
      // Evict oldest items to prevent memory unbounded growth
      const it = this.processedEventIds.values();
      for (let i = 0; i < 100; i++) {
        const next = it.next();
        if (next.done) break;
        this.processedEventIds.delete(next.value);
      }
    }
  }

  private notifyListeners(event: RealtimeEvent) {
    // Notify specific event listeners
    const specific = this.listeners.get(event.type);
    if (specific) {
      specific.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error('Realtime listener error', err);
        }
      });
    }

    // Notify wildcard listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error('Realtime wildcard listener error', err);
        }
      });
    }
  }

  public subscribe(eventType: RealtimeEventType | '*', callback: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  public on(eventType: RealtimeEventType | '*', callback: EventListener): () => void {
    return this.subscribe(eventType, callback);
  }

  public onStatusChange(callback: StatusListener): () => void {
    this.statusListeners.add(callback);
    callback(this.connectionStatus);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public onNetworkChange(callback: NetworkListener): () => void {
    this.networkListeners.add(callback);
    callback(this.networkStatus);
    return () => {
      this.networkListeners.delete(callback);
    };
  }

  private setConnectionStatus(status: RealtimeStatus) {
    if (this.connectionStatus === status) return;
    this.connectionStatus = status;
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error(err);
      }
    });
  }

  private notifyNetworkListeners(status: NetworkStatus) {
    this.networkListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error(err);
      }
    });
  }

  public getConnectionStatus(): RealtimeStatus {
    return this.connectionStatus;
  }

  public isConnected(): boolean {
    return this.connectionStatus === 'CONNECTED';
  }

  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }
}

export const realtimeService = new RealtimeService();
