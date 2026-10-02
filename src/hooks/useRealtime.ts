import { useState, useEffect, useCallback } from 'react';
import {
  CommandLog,
  Memory,
  Message,
  Mission,
  MissionActivity,
  MissionObjective,
  NetworkStatus,
  NotificationItem,
  RealtimeEvent,
  RealtimeStatus,
  SystemEvent,
  Task,
} from '../types';
import { realtimeService } from '../services/realtime';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { MissionService } from '../services/mission';
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

          // If linked to mission, sync mission progress immediately
          if ((changedTask as Task).mission_id) {
            MissionService.recalculateMissionProgress(userId, (changedTask as Task).mission_id!);
          }
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

  const clearCommands = useCallback(() => {
    setCommands([]);
    setLocalStore(`cmds_${userId}`, []);
  }, [userId]);

  return {
    commands,
    recordCommand,
    clearCommands,
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

  const clearAll = useCallback(() => {
    setNotifications([]);
    setLocalStore(`notifications_${userId}`, []);
    realtimeService.broadcast('NOTIFICATIONS_READ_ALL', {});
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
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

/**
 * Hook for synchronized real-time Missions
 */
export function useRealtimeMissions() {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [missions, setMissions] = useState<Mission[]>(() =>
    MissionService.getMissions(userId)
  );

  const reloadMissions = useCallback(() => {
    setMissions(MissionService.getMissions(userId));
  }, [userId]);

  useEffect(() => {
    reloadMissions();

    const unsubCreated = realtimeService.subscribe('MISSION_CREATED', (e) => {
      setMissions((prev) => {
        const newMsn = e.payload as Mission;
        if (prev.some((m) => m.id === newMsn.id)) return prev;
        return [newMsn, ...prev];
      });
    });

    const unsubUpdated = realtimeService.subscribe('MISSION_UPDATED', (e) => {
      setMissions((prev) => {
        const updatedMsn = e.payload as Mission;
        return prev.map((m) => (m.id === updatedMsn.id ? updatedMsn : m));
      });
    });

    const unsubCompleted = realtimeService.subscribe('MISSION_COMPLETED', (e) => {
      setMissions((prev) => {
        const completedMsn = e.payload as Mission;
        return prev.map((m) => (m.id === completedMsn.id ? completedMsn : m));
      });
    });

    const unsubDeleted = realtimeService.subscribe('MISSION_DELETED', (e) => {
      setMissions((prev) => {
        const deletedId = typeof e.payload === 'string' ? e.payload : e.payload?.id;
        return prev.filter((m) => m.id !== deletedId);
      });
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubCompleted();
      unsubDeleted();
    };
  }, [userId, reloadMissions]);

  const addMission = useCallback(
    (data: Partial<Mission>) => {
      const created = MissionService.createMission(userId, data);
      reloadMissions();
      return created;
    },
    [userId, reloadMissions]
  );

  const updateMission = useCallback(
    (id: string, updates: Partial<Mission>) => {
      const updated = MissionService.updateMission(userId, id, updates);
      reloadMissions();
      return updated;
    },
    [userId, reloadMissions]
  );

  const deleteMission = useCallback(
    (id: string) => {
      const ok = MissionService.deleteMission(userId, id);
      reloadMissions();
      return ok;
    },
    [userId, reloadMissions]
  );

  const togglePauseMission = useCallback(
    (id: string) => {
      const target = MissionService.getMissionById(userId, id);
      if (!target) return null;
      const nextStatus = target.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
      const updated = MissionService.updateMission(userId, id, { status: nextStatus });
      reloadMissions();
      return updated;
    },
    [userId, reloadMissions]
  );

  const completeMission = useCallback(
    (id: string) => {
      const updated = MissionService.updateMission(userId, id, {
        status: 'COMPLETED',
        progress: 100,
        completed_at: Date.now(),
      });
      reloadMissions();
      return updated;
    },
    [userId, reloadMissions]
  );

  return {
    missions,
    addMission,
    updateMission,
    deleteMission,
    togglePauseMission,
    completeMission,
    reloadMissions,
  };
}

/**
 * Hook for synchronized real-time Objectives
 */
export function useRealtimeObjectives(missionId?: string) {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [objectives, setObjectives] = useState<MissionObjective[]>(() =>
    MissionService.getObjectives(userId, missionId)
  );

  const reloadObjectives = useCallback(() => {
    setObjectives(MissionService.getObjectives(userId, missionId));
  }, [userId, missionId]);

  useEffect(() => {
    reloadObjectives();

    const unsubCreated = realtimeService.subscribe('OBJECTIVE_CREATED', (e) => {
      const newObj = e.payload as MissionObjective;
      if (!missionId || newObj.mission_id === missionId) {
        setObjectives((prev) => {
          if (prev.some((o) => o.id === newObj.id)) return prev;
          return [...prev, newObj].sort((a, b) => a.position - b.position);
        });
      }
    });

    const unsubUpdated = realtimeService.subscribe('OBJECTIVE_UPDATED', (e) => {
      if (e.payload?.reordered) {
        reloadObjectives();
      } else {
        const updatedObj = e.payload as MissionObjective;
        if (!missionId || updatedObj.mission_id === missionId) {
          setObjectives((prev) =>
            prev.map((o) => (o.id === updatedObj.id ? updatedObj : o)).sort((a, b) => a.position - b.position)
          );
        }
      }
    });

    const unsubCompleted = realtimeService.subscribe('OBJECTIVE_COMPLETED', (e) => {
      const completedObj = e.payload as MissionObjective;
      if (!missionId || completedObj.mission_id === missionId) {
        setObjectives((prev) =>
          prev.map((o) => (o.id === completedObj.id ? completedObj : o)).sort((a, b) => a.position - b.position)
        );
      }
    });

    const unsubDeleted = realtimeService.subscribe('OBJECTIVE_DELETED', (e) => {
      const deletedId = typeof e.payload === 'string' ? e.payload : e.payload?.id;
      setObjectives((prev) => prev.filter((o) => o.id !== deletedId));
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubCompleted();
      unsubDeleted();
    };
  }, [userId, missionId, reloadObjectives]);

  const addObjective = useCallback(
    (data: Partial<MissionObjective>) => {
      if (!missionId) return null;
      const created = MissionService.createObjective(userId, missionId, data);
      reloadObjectives();
      return created;
    },
    [userId, missionId, reloadObjectives]
  );

  const updateObjective = useCallback(
    (id: string, updates: Partial<MissionObjective>) => {
      const updated = MissionService.updateObjective(userId, id, updates);
      reloadObjectives();
      return updated;
    },
    [userId, reloadObjectives]
  );

  const deleteObjective = useCallback(
    (id: string) => {
      const ok = MissionService.deleteObjective(userId, id);
      reloadObjectives();
      return ok;
    },
    [userId, reloadObjectives]
  );

  const toggleObjectiveStatus = useCallback(
    (id: string) => {
      const target = MissionService.getObjectiveById(userId, id);
      if (!target) return null;
      const nextStatus = target.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      const updated = MissionService.updateObjective(userId, id, { status: nextStatus });
      reloadObjectives();
      return updated;
    },
    [userId, reloadObjectives]
  );

  const reorder = useCallback(
    (orderedIds: string[]) => {
      if (!missionId) return;
      const reordered = MissionService.reorderObjectives(userId, missionId, orderedIds);
      setObjectives(reordered);
    },
    [userId, missionId]
  );

  return {
    objectives,
    addObjective,
    updateObjective,
    deleteObjective,
    toggleObjectiveStatus,
    reorder,
    reloadObjectives,
  };
}

/**
 * Hook for synchronized real-time Mission Activity
 */
export function useRealtimeMissionActivity(missionId?: string) {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [activities, setActivities] = useState<MissionActivity[]>(() =>
    MissionService.getMissionActivities(userId, missionId)
  );

  const reloadActivities = useCallback(() => {
    setActivities(MissionService.getMissionActivities(userId, missionId));
  }, [userId, missionId]);

  useEffect(() => {
    reloadActivities();

    const unsub = realtimeService.subscribe('MISSION_ACTIVITY_CREATED', (e) => {
      const newAct = e.payload as MissionActivity;
      if (!missionId || newAct.mission_id === missionId) {
        setActivities((prev) => {
          if (prev.some((a) => a.id === newAct.id)) return prev;
          return [newAct, ...prev].slice(0, 100);
        });
      }
    });

    return () => {
      unsub();
    };
  }, [userId, missionId, reloadActivities]);

  return {
    activities,
    reloadActivities,
  };
}
