import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserSession, Profile, NotificationItem, SystemEvent } from '../types';
import { supabase, isSupabaseConfigured, getLocalStore, setLocalStore } from '../services/supabase';
import { realtimeService } from '../services/realtime';

export type AuthState = 'AUTHENTICATING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'ERROR';

interface AuthContextType {
  authState: AuthState;
  currentSession: UserSession | null;
  profile: Profile | null;
  isBootComplete: boolean;
  completeBoot: () => void;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  signup: (email: string, pass: string, displayName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<Profile>) => void;
  notifications: NotificationItem[];
  createNotification: (title: string, message: string, type?: NotificationItem['type']) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  systemEvents: SystemEvent[];
  trackEvent: (eventType: string, payload?: string) => void;
  isSupabase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>('AUTHENTICATING');
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isBootComplete, setIsBootComplete] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    setAuthState('AUTHENTICATING');
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const user = data.session.user;
        const session: UserSession = {
          userId: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.display_name || 'COMMANDER',
          isSupabase: true,
        };
        setCurrentSession(session);
        loadProfile(user.id, session.displayName);
        loadUserData(user.id);
        realtimeService.init(user.id);
        setAuthState('AUTHENTICATED');
        return;
      }
    }

    // Check local storage session fallback
    const saved = getLocalStore<UserSession | null>('session', null);
    if (saved && saved.userId) {
      setCurrentSession(saved);
      loadProfile(saved.userId, saved.displayName);
      loadUserData(saved.userId);
      realtimeService.init(saved.userId);
      setAuthState('AUTHENTICATED');
    } else {
      setCurrentSession(null);
      setProfile(null);
      setAuthState('UNAUTHENTICATED');
    }
  };

  const loadUserData = (userId: string) => {
    const notifs = getLocalStore<NotificationItem[]>(`notifications_${userId}`, [
      {
        id: 'notif_welcome',
        user_id: userId,
        title: 'TACTICAL LINK ESTABLISHED',
        message: 'Three Blades synchronized. Ready for deployment.',
        type: 'SUCCESS',
        read: false,
        created_at: Date.now(),
      },
    ]);
    setNotifications(notifs);

    const events = getLocalStore<SystemEvent[]>(`events_${userId}`, [
      {
        id: 'ev_init',
        user_id: userId,
        event_type: 'SYSTEM_STARTUP',
        payload: '{"status":"OPTIMAL"}',
        created_at: Date.now(),
      },
    ]);
    setSystemEvents(events);

    const bootDone = getLocalStore<boolean>(`boot_done_${userId}`, false);
    setIsBootComplete(bootDone);
  };

  // Cross-tab real-time listener for notifications and system events
  useEffect(() => {
    if (!currentSession) return;
    const userId = currentSession.userId;

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

    const unsubSysEvent = realtimeService.subscribe('SYSTEM_EVENT_CREATED', (e) => {
      setSystemEvents((prev) => {
        const ev = e.payload as SystemEvent;
        if (prev.some((item) => item.id === ev.id)) return prev;
        const updated = [ev, ...prev].slice(0, 100);
        setLocalStore(`events_${userId}`, updated);
        return updated;
      });
    });

    return () => {
      unsubCreated();
      unsubRead();
      unsubReadAll();
      unsubDismissed();
      unsubSysEvent();
    };
  }, [currentSession]);

  const completeBoot = () => {
    setIsBootComplete(true);
    if (currentSession) {
      setLocalStore(`boot_done_${currentSession.userId}`, true);
      trackEvent('BOOT_COMPLETED', '{"status":"ALL_BLADES_ONLINE"}');
    }
  };

  const loadProfile = (userId: string, defaultName: string) => {
    const prof = getLocalStore<Profile>(`profile_${userId}`, {
      id: userId,
      user_id: userId,
      display_name: defaultName,
      sword_style: 'SANTORYU (THREE BLADES)',
      created_at: Date.now(),
    });
    setProfile(prof);
  };

  const login = async (email: string, pass: string) => {
    setAuthState('AUTHENTICATING');
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        setAuthState('ERROR');
        return { error: error.message };
      }
      if (data.user) {
        const session: UserSession = {
          userId: data.user.id,
          email: data.user.email || email,
          displayName: data.user.user_metadata?.display_name || email.split('@')[0].toUpperCase(),
          isSupabase: true,
        };
        setCurrentSession(session);
        loadProfile(data.user.id, session.displayName);
        loadUserData(data.user.id);
        setLocalStore('session', session);
        realtimeService.init(data.user.id);
        setAuthState('AUTHENTICATED');
        trackEvent('USER_LOGIN', JSON.stringify({ email, method: 'supabase' }));
        return {};
      }
    }

    // Local authentication fallback for instant sandbox access
    const users = getLocalStore<Record<string, any>>('users', {});
    const cleanEmail = email.toLowerCase().trim() || 'commander@jarvis.ai';
    const existing = users[cleanEmail];
    const userId = existing?.id || 'op_' + Math.random().toString(36).substring(2, 9);
    const displayName = existing?.displayName || cleanEmail.split('@')[0].toUpperCase();

    const session: UserSession = {
      userId,
      email: cleanEmail,
      displayName,
      isSupabase: false,
    };
    users[cleanEmail] = { id: userId, email: cleanEmail, password: pass, displayName };
    setLocalStore('users', users);
    setCurrentSession(session);
    loadProfile(userId, displayName);
    loadUserData(userId);
    setLocalStore('session', session);
    realtimeService.init(userId);
    setAuthState('AUTHENTICATED');
    trackEvent('USER_LOGIN', JSON.stringify({ email: cleanEmail, method: 'local' }));
    return {};
  };

  const signup = async (email: string, pass: string, displayName: string) => {
    setAuthState('AUTHENTICATING');
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { display_name: displayName } },
      });
      if (error) {
        setAuthState('ERROR');
        return { error: error.message };
      }
      if (data.user) {
        const session: UserSession = {
          userId: data.user.id,
          email: data.user.email || email,
          displayName: displayName || 'COMMANDER',
          isSupabase: true,
        };
        setCurrentSession(session);
        loadProfile(data.user.id, displayName);
        loadUserData(data.user.id);
        setLocalStore('session', session);
        realtimeService.init(data.user.id);
        setAuthState('AUTHENTICATED');
        trackEvent('USER_LOGIN', JSON.stringify({ email, method: 'supabase_signup' }));
        return {};
      }
    }

    // Local signup fallback
    const users = getLocalStore<Record<string, any>>('users', {});
    const newId = 'op_' + Math.random().toString(36).substring(2, 9);
    users[email.toLowerCase()] = { id: newId, email: email.toLowerCase(), password: pass, displayName };
    setLocalStore('users', users);

    const session: UserSession = {
      userId: newId,
      email: email.toLowerCase(),
      displayName: displayName || 'COMMANDER',
      isSupabase: false,
    };
    setCurrentSession(session);
    loadProfile(newId, displayName);
    loadUserData(newId);
    setLocalStore('session', session);
    realtimeService.init(newId);
    setAuthState('AUTHENTICATED');
    trackEvent('USER_LOGIN', JSON.stringify({ email: session.email, method: 'local_signup' }));
    return {};
  };

  const logout = async () => {
    if (currentSession) {
      trackEvent('USER_LOGOUT', JSON.stringify({ userId: currentSession.userId }));
    }
    realtimeService.disconnect();
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('jarvis_zoro_session');
    setCurrentSession(null);
    setProfile(null);
    setIsBootComplete(false);
    setAuthState('UNAUTHENTICATED');
  };

  const updateProfile = (updated: Partial<Profile>) => {
    if (!profile) return;
    const newProf = { ...profile, ...updated };
    setProfile(newProf);
    setLocalStore(`profile_${newProf.user_id}`, newProf);
    trackEvent('PROFILE_UPDATED', JSON.stringify({ display_name: newProf.display_name }));
  };

  const createNotification = (
    title: string,
    message: string,
    type: NotificationItem['type'] = 'INFO'
  ) => {
    if (!currentSession) return;
    const newNotif: NotificationItem = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      user_id: currentSession.userId,
      title,
      message,
      type,
      read: false,
      created_at: Date.now(),
    };

    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      setLocalStore(`notifications_${currentSession.userId}`, updated);
      return updated;
    });

    realtimeService.broadcast('NOTIFICATION_CREATED', newNotif);
  };

  const markNotificationRead = (id: string) => {
    if (!currentSession) return;
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      setLocalStore(`notifications_${currentSession.userId}`, updated);
      return updated;
    });
    realtimeService.broadcast('NOTIFICATION_READ', { id });
  };

  const markAllNotificationsRead = () => {
    if (!currentSession) return;
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      setLocalStore(`notifications_${currentSession.userId}`, updated);
      return updated;
    });
    realtimeService.broadcast('NOTIFICATIONS_READ_ALL', {});
  };

  const dismissNotification = (id: string) => {
    if (!currentSession) return;
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      setLocalStore(`notifications_${currentSession.userId}`, updated);
      return updated;
    });
    realtimeService.broadcast('NOTIFICATION_DISMISSED', { id });
  };

  const clearNotifications = () => {
    if (!currentSession) return;
    setNotifications([]);
    setLocalStore(`notifications_${currentSession.userId}`, []);
    realtimeService.broadcast('NOTIFICATIONS_READ_ALL', {});
  };

  const trackEvent = (eventType: string, payload = '{}') => {
    if (!currentSession) return;
    const ev: SystemEvent = {
      id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      user_id: currentSession.userId,
      event_type: eventType,
      payload,
      created_at: Date.now(),
    };
    setSystemEvents((prev) => {
      const updated = [ev, ...prev].slice(0, 100);
      setLocalStore(`events_${currentSession.userId}`, updated);
      return updated;
    });
    realtimeService.broadcast('SYSTEM_EVENT_CREATED', ev);
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        currentSession,
        profile,
        isBootComplete,
        completeBoot,
        login,
        signup,
        logout,
        updateProfile,
        notifications,
        createNotification,
        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,
        clearNotifications,
        systemEvents,
        trackEvent,
        isSupabase: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
