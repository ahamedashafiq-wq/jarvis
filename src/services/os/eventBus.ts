import { OSEventType, RealtimeEventType } from '../../types';
import { realtimeService } from '../realtime';

export type OSEventListener = (payload: any) => void;

class OSEventBus {
  private listeners: Map<string, Set<OSEventListener>> = new Map();

  /**
   * Subscribe to an OS or system event
   */
  public subscribe(event: OSEventType | RealtimeEventType | '*', callback: OSEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Emit an event locally and forward to realtimeService
   */
  public emit(event: OSEventType, payload: any = {}, broadcastToRealtime = true) {
    // Notify specific listeners
    const specific = this.listeners.get(event);
    if (specific) {
      specific.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }

    // Notify wildcard listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach((cb) => {
        try {
          cb({ type: event, payload });
        } catch (e) {
          console.error(`Error in wildcard listener for ${event}:`, e);
        }
      });
    }

    // Optionally bridge to realtimeService so other tabs / HUDs receive it
    if (broadcastToRealtime) {
      try {
        realtimeService.broadcast('SYSTEM_EVENT_CREATED', {
          osEvent: event,
          payload,
          timestamp: Date.now(),
        });
      } catch {
        // ignore in offline/storage limits
      }
    }
  }
}

export const osEventBus = new OSEventBus();
