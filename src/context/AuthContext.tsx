import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/index.ts';
import { api, getStoredToken, setStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (payload: { name: string; email: string; phone?: string; password: string }) => Promise<User>;
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string; bio?: string }) => Promise<User>;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup' | 'forgot';
  openAuthModal: (tab?: 'login' | 'signup' | 'forgot', callback?: () => void) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authSuccessCallback, setAuthSuccessCallback] = useState<(() => void) | null>(null);

  // Restore session on mount
  useEffect(() => {
    async function initSession() {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch (e) {
        console.warn('Session expired or invalid, clearing token', e);
        setStoredToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setStoredToken(res.token);
    setUser(res.user);
    if (authSuccessCallback) {
      authSuccessCallback();
      setAuthSuccessCallback(null);
    }
    setIsAuthModalOpen(false);
    return res.user;
  }, [authSuccessCallback]);

  const signup = useCallback(async (payload: { name: string; email: string; phone?: string; password: string }) => {
    const res = await api.signup(payload);
    setStoredToken(res.token);
    setUser(res.user);
    if (authSuccessCallback) {
      authSuccessCallback();
      setAuthSuccessCallback(null);
    }
    setIsAuthModalOpen(false);
    return res.user;
  }, [authSuccessCallback]);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; phone?: string; bio?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    return res.user;
  }, []);

  const openAuthModal = useCallback((tab: 'login' | 'signup' | 'forgot' = 'login', callback?: () => void) => {
    setAuthModalTab(tab);
    if (callback) {
      setAuthSuccessCallback(() => callback);
    } else {
      setAuthSuccessCallback(null);
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthSuccessCallback(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
