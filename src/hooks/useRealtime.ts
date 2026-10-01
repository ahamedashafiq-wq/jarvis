import { useState, useEffect, useCallback } from 'react';
import {
  CommandLog,
  Memory,
  Message,
  NetworkStatus,
  NotificationItem,
  RealtimeEvent,
  RealtimeStatus,
  SystemEvent,
  Task,
} from '../types';
import { realtimeService } from '../services/realtime';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for global realtime & network connection status
 */
export function useRealtime() {
  const [connectionStatus, setConnectionStatus] = useState<RealtimeStatus>(
    realtimeService.getConnectionStatus()
  );
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    realtimeService.getNetworkStatus()
  );

  useEffect(() => {
    const unsubStatus = realtimeService.onStatusChange(setConnectionStatus);
    const unsubNetwork = realtimeService.onNetworkChange(setNetworkStatus);
    return () => {
      unsubStatus();
      unsubNetwork();
    };
  }, []);

  const reconnect = useCallback(() => {
    realtimeService.reconnect();
  }, []);

  return {
    connectionStatus,
    networkStatus,
    isConnected: connectionStatus === 'CONNECTED',
    isOnline: networkStatus === 'ONLINE',
    reconnect,
  };
}

/**
 * Hook for synchronized real-time Tasks
 */
export function useRealtimeTasks() {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [tasks, setTasks] = useState<Task[]>(() =>
    getLocalStore<Task[]>(`tasks_${userId}`, [])
  );

  const reloadTasks = useCallback(() => {
    setTasks(getLocalStore<Task[]>(`tasks_${userId}`, []));
  }, [userId]);

  useEffect(() => {
    reloadTasks();

    const unsubCreated = realtimeService.subscribe('TASK_CREATED', (e) => {
      setTasks((prev) => {
        const newTask = e.payload as Task;
        if (prev.some((t) => t.id === newTask.id)) return prev;
        const updated = [newTask, ...prev];
        setLocalStore(`tasks_${userId}`, updated);
        return updated;
      });
    });

    const unsubUpdated = realtimeService.subscribe('TASK_UPDATED', (e) => {
      setTasks((prev) => {
        const updatedTask = e.payload as Task;
        const updated = prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
        setLocalStore(`tasks_${userId}`, updated);
        return updated;
      });
    });

    const unsubCompleted = realtimeService.subscribe('TASK_COMPLETED', (e) => {
      setTasks((prev) => {
        const completedTask = e.payload as Task;
        const updated = prev.map((t) => (t.id === completedTask.id ? completedTask : t));
        setLocalStore(`tasks_${userId}`, updated);
        return updated;
      });
    });

    const unsubDeleted = realtimeService.subscribe('TASK_DELETED', (e) => {
      setTasks((prev) => {
        const deletedId = typeof e.payload === 'string' ? e.payload : e.payload?.id;
        const updated = prev.filter((t) => t.id !== deletedId);
        setLocalStore(`tasks_${userId}`, updated);
        return updated;
      });
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubCompleted();
      unsubDeleted();
    };
  }, [userId, reloadTasks]);

  const addTask = useCallback(
    (newTask: Omit<Task, 'id' | 'user_id' | 'created_at'>) => {
      const task: Task = {
        ...newTask,
        id: 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        created_at: Date.now(),
      };

      setTasks((prev) => {
        const updated = [task, ...prev];
        setLocalStore(`tasks_${userId}`, updated);
        return updated;
      });

      realtimeService.broadcast('TASK_CREATED', task);
      return task;
    },
    [userId]
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        let changedTask: Task | null = null;
        const updated = prev.map((t) => {
          if (t.id === taskId) {
            const nextStatus = t.status === 'COMPLETED' ? 'TODO' : ('COMPLETED' as const);
            changedTask = {
              ...t,
              status: nextStatus,
              completed_at: nextStatus === 'COMPLETED' ? Date.now() : undefined,
            };
            return changedTask;
          }
          return t;
        });

        if (changedTask) {
          setLocalStore(`tasks_${userId}`, updated);
          realtimeService.broadcast(
            (changedTask as Task).status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED',
            changedTask
          );
        }
        return updated;
      });
    },
    [userId]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== taskId);
        setLocalStore(`tasks_${userId}`, updated);
        return updated;
      });
      realtimeService.broadcast('TASK_DELETED', { id: taskId });
    },
    [userId]
  );

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    reloadTasks,
  };
}

/**
 * Hook for synchronized real-time Memories
 */
export function useRealtimeMemories() {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [memories, setMemories] = useState<Memory[]>(() =>
    getLocalStore<Memory[]>(`memories_${userId}`, [])
  );

  const reloadMemories = useCallback(() => {
    setMemories(getLocalStore<Memory[]>(`memories_${userId}`, []));
  }, [userId]);

  useEffect(() => {
    reloadMemories();

    const unsubCreated = realtimeService.subscribe('MEMORY_CREATED', (e) => {
      setMemories((prev) => {
        const newMem = e.payload as Memory;
        if (prev.some((m) => m.id === newMem.id)) return prev;
        const updated = [newMem, ...prev];
        setLocalStore(`memories_${userId}`, updated);
        return updated;
      });
    });

    const unsubUpdated = realtimeService.subscribe('MEMORY_UPDATED', (e) => {
      setMemories((prev) => {
        const updatedMem = e.payload as Memory;
        const updated = prev.map((m) => (m.id === updatedMem.id ? updatedMem : m));
        setLocalStore(`memories_${userId}`, updated);
        return updated;
      });
    });

    const unsubPinned = realtimeService.subscribe('MEMORY_PINNED', (e) => {
      setMemories((prev) => {
        const pinnedMem = e.payload as Memory;
        const updated = prev.map((m) => (m.id === pinnedMem.id ? pinnedMem : m));
        setLocalStore(`memories_${userId}`, updated);
        return updated;
      });
    });

    const unsubUnpinned = realtimeService.subscribe('MEMORY_UNPINNED', (e) => {
      setMemories((prev) => {
        const unpinnedMem = e.payload as Memory;
        const updated = prev.map((m) => (m.id === unpinnedMem.id ? unpinnedMem : m));
        setLocalStore(`memories_${userId}`, updated);
        return updated;
      });
    });

    const unsubDeleted = realtimeService.subscribe('MEMORY_DELETED', (e) => {
      setMemories((prev) => {
        const deletedId = typeof e.payload === 'string' ? e.payload : e.payload?.id;
        const updated = prev.filter((m) => m.id !== deletedId);
        setLocalStore(`memories_${userId}`, updated);
        return updated;
      });
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubPinned();
      unsubUnpinned();
      unsubDeleted();
    };
  }, [userId, reloadMemories]);

  return {
    memories,
    reloadMemories,
  };
}

/**
 * Hook for synchronized real-time Commands
 */
export function useRealtimeCommands() {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [commands, setCommands] = useState<CommandLog[]>(() =>
    getLocalStore<CommandLog[]>(`cmds_${userId}`, [])
  );

  const reloadCommands = useCallback(() => {
    setCommands(getLocalStore<CommandLog[]>(`cmds_${userId}`, []));
  }, [userId]);

  useEffect(() => {
    reloadCommands();

    const unsubRecorded = realtimeService.subscribe('COMMAND_RECORDED', (e) => {
      setCommands((prev) => {
        const newCmd = e.payload as CommandLog;
        if (prev.some((c) => c.id === newCmd.id)) return prev;
        const updated = [newCmd, ...prev];
        setLocalStore(`cmds_${userId}`, updated);
        return updated;
      });
    });

    const unsubUpdated = realtimeService.subscribe('COMMAND_UPDATED', (e) => {
      setCommands((prev) => {
        const updatedCmd = e.payload as CommandLog;
        const updated = prev.map((c) => (c.id === updatedCmd.id ? updatedCmd : c));
        setLocalStore(`cmds_${userId}`, updated);
        return updated;
      });
    });

    return () => {
      unsubRecorded();
      unsubUpdated();
    };
  }, [userId, reloadCommands]);

  const recordCommand = useCallback(
    (log: CommandLog) => {
      setCommands((prev) => {
        const updated = [log, ...prev.filter((c) => c.id !== log.id)].slice(0, 100);
        setLocalStore(`cmds_${userId}`, updated);
        return updated;
      });
      realtimeService.broadcast('COMMAND_RECORDED', log);
    },
    [userId]
  );

  return {
    commands,
    recordCommand,
    reloadCommands,
  };
}

/**
 * Hook for synchronized real-time Notifications
 */
export function useRealtimeNotifications() {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    getLocalStore<NotificationItem[]>(`notifications_${userId}`, [])
  );

  const reloadNotifications = useCallback(() => {
    setNotifications(getLocalStore<NotificationItem[]>(`notifications_${userId}`, []));
  }, [userId]);

  useEffect(() => {
    reloadNotifications();

    const unsubCreated = realtimeService.subscribe('NOTIFICATION_CREATED', (e) => {
      setNotifications((prev) => {
        const newNotif = e.payload as NotificationItem;
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        const updated = [newNotif, ...prev];
        setLocalStore(`notifications_${userId}`, updated);
        return updated;
      });
    });

    const unsubRead = realtimeService.subscribe('NOTIFICATION_READ', (e) => {
      setNotifications((prev) => {
        const targetId = e.payload?.id;
        const updated = prev.map((n) => (n.id === targetId ? { ...n, read: true } : n));
        setLocalStore(`notifications_${userId}`, updated);
        return updated;
      });
    });

    const unsubReadAll = realtimeService.subscribe('NOTIFICATIONS_READ_ALL', () => {
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, read: true }));
        setLocalStore(`notifications_${userId}`, updated);
        return updated;
      });
    });

    const unsubDismissed = realtimeService.subscribe('NOTIFICATION_DISMISSED', (e) => {
      setNotifications((prev) => {
        const targetId = e.payload?.id;
        const updated = prev.filter((n) => n.id !== targetId);
        setLocalStore(`notifications_${userId}`, updated);
        return updated;
      });
    });

    return () => {
      unsubCreated();
      unsubRead();
      unsubReadAll();
      unsubDismissed();
    };
  }, [userId, reloadNotifications]);

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        setLocalStore(`notifications_${userId}`, updated);
        return updated;
      });
      realtimeService.broadcast('NOTIFICATION_READ', { id });
    },
    [userId]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      setLocalStore(`notifications_${userId}`, updated);
      return updated;
    });
    realtimeService.broadcast('NOTIFICATIONS_READ_ALL', {});
  }, [userId]);

  const dismiss = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        setLocalStore(`notifications_${userId}`, updated);
        return updated;
      });
      realtimeService.broadcast('NOTIFICATION_DISMISSED', { id });
    },
    [userId]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    reloadNotifications,
  };
}

/**
 * Hook for synchronized real-time System Events
 */
export function useRealtimeSystemEvents() {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>(() =>
    getLocalStore<SystemEvent[]>(`events_${userId}`, [])
  );

  const reloadEvents = useCallback(() => {
    setSystemEvents(getLocalStore<SystemEvent[]>(`events_${userId}`, []));
  }, [userId]);

  useEffect(() => {
    reloadEvents();

    const unsubEvent = realtimeService.subscribe('SYSTEM_EVENT_CREATED', (e) => {
      setSystemEvents((prev) => {
        const newEvent = e.payload as SystemEvent;
        if (prev.some((ev) => ev.id === newEvent.id)) return prev;
        const updated = [newEvent, ...prev].slice(0, 100);
        setLocalStore(`events_${userId}`, updated);
        return updated;
      });
    });

    return () => {
      unsubEvent();
    };
  }, [userId, reloadEvents]);

  const trackEvent = useCallback(
    (eventType: string, payload = '{}') => {
      const ev: SystemEvent = {
        id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        event_type: eventType,
        payload,
        created_at: Date.now(),
      };

      setSystemEvents((prev) => {
        const updated = [ev, ...prev].slice(0, 100);
        setLocalStore(`events_${userId}`, updated);
        return updated;
      });

      realtimeService.broadcast('SYSTEM_EVENT_CREATED', ev);
      return ev;
    },
    [userId]
  );

  return {
    systemEvents,
    trackEvent,
    reloadEvents,
  };
}
