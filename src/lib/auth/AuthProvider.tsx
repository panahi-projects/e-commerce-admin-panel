"use client";

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, session, type ApiSuccess } from '@/lib/api';
import { authService } from './service';
import { installRefreshInterceptor } from './refreshInterceptor';
import type { AdminLoginRequest, AuthUser, EffectivePermissions } from './types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  permissions: EffectivePermissions | null;
  login: (body: AdminLoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  /** Last forced-logout reason, for surfacing "your account is inactive" (§5.4). */
  authNotice: 'inactive' | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<EffectivePermissions | null>(null);
  const [authNotice, setAuthNotice] = useState<'inactive' | null>(null);

  const clearSession = useCallback(() => {
    session.clear();
    setUser(null);
    setPermissions(null);
    setStatus('unauthenticated');
  }, []);

  // Install the 401 → refresh → retry interceptor. On auth failure, clear local
  // state and bounce to /login (surfacing the "inactive account" notice, §5.4).
  useEffect(() => {
    const id = installRefreshInterceptor((reason) => {
      clearSession();
      if (reason === 'inactive') setAuthNotice('inactive');
      router.replace('/login');
    });
    return () => api.interceptors.response.eject(id);
  }, [clearSession, router]);

  // Silent bootstrap on load: try the refresh cookie, then hydrate user + permissions.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.post<ApiSuccess<{ accessToken: string }>>('/auth/refresh');
        session.setAccessToken(res.data.data.accessToken);
        const [me, perms] = await Promise.all([authService.me(), authService.permissions()]);
        if (!active) return;
        setUser(me);
        setPermissions(perms);
        setStatus('authenticated');
      } catch {
        if (!active) return;
        clearSession();
      }
    })();
    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(async (body: AdminLoginRequest) => {
    setAuthNotice(null);
    const result = await authService.adminLogin(body);
    session.setAccessToken(result.accessToken);
    setUser(result.user);
    setPermissions(result.permissions);
    setStatus('authenticated');
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore — clear locally regardless.
    }
    clearSession();
    router.replace('/login');
  }, [clearSession, router]);

  const refreshPermissions = useCallback(async () => {
    const perms = await authService.permissions();
    setPermissions(perms);
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, user, permissions, login, logout, refreshPermissions, authNotice }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
