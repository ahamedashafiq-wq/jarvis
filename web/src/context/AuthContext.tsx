import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession, Profile } from '../types';
import { supabase, isSupabaseConfigured, getLocalStore, setLocalStore } from '../services/supabase';

export type AuthState = 'AUTHENTICATING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'ERROR';

interface AuthContextType {
  authState: AuthState;
  currentSession: UserSession | null;
  profile: Profile | null;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  signup: (email: string, pass: string, displayName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<Profile>) => void;
  isSupabase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>('AUTHENTICATING');
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

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
        setAuthState('AUTHENTICATED');
        return;
      }
    }

    // Check local storage session fallback
    const saved = getLocalStore<UserSession | null>('session', null);
    if (saved && saved.userId) {
      setCurrentSession(saved);
      loadProfile(saved.userId, saved.displayName);
      setAuthState('AUTHENTICATED');
    } else {
      setCurrentSession(null);
      setProfile(null);
      setAuthState('UNAUTHENTICATED');
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
        setLocalStore('session', session);
        setAuthState('AUTHENTICATED');
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
    setLocalStore('session', session);
    setAuthState('AUTHENTICATED');
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
        setLocalStore('session', session);
        setAuthState('AUTHENTICATED');
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
    setLocalStore('session', session);
    setAuthState('AUTHENTICATED');
    return {};
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('jarvis_zoro_session');
    setCurrentSession(null);
    setProfile(null);
    setAuthState('UNAUTHENTICATED');
  };

  const updateProfile = (updated: Partial<Profile>) => {
    if (!profile) return;
    const newProf = { ...profile, ...updated };
    setProfile(newProf);
    setLocalStore(`profile_${newProf.user_id}`, newProf);
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        currentSession,
        profile,
        login,
        signup,
        logout,
        updateProfile,
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
