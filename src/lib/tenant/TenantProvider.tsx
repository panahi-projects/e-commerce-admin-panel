"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { session } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const STORAGE_KEY = 'admin.activeTenant';

interface TenantContextValue {
  /** Active tenant slug applied to the `X-Tenant-ID` header. null = unscoped (super_admin, all tenants). */
  activeTenantId: string | null;
  /** Whether the current operator may switch tenants (super_admin only, §6). */
  canSwitch: boolean;
  setActiveTenant: (tenantId: string | null) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  // Tenant operators are pinned to their own tenant; super_admin may pick one
  // (defaulting to the last choice, else unscoped). The JWT already carries the
  // pinned tenant, so the header is belt-and-suspenders for operators (§6).
  // setState here syncs the active tenant from the resolved auth user / storage.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user) {
      session.setTenantId(null);
      return;
    }
    if (isSuperAdmin) {
      const saved =
        typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      setActiveTenantId(saved);
      session.setTenantId(saved);
    } else {
      setActiveTenantId(user.tenantId);
      session.setTenantId(user.tenantId);
    }
  }, [user, isSuperAdmin]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setActiveTenant = useCallback(
    (tenantId: string | null) => {
      if (!isSuperAdmin) return; // operators cannot switch
      setActiveTenantId(tenantId);
      session.setTenantId(tenantId);
      if (typeof window !== 'undefined') {
        if (tenantId) window.localStorage.setItem(STORAGE_KEY, tenantId);
        else window.localStorage.removeItem(STORAGE_KEY);
      }
      // Tenant-scoped data is now stale — drop cached queries so they refetch (§6).
      queryClient.invalidateQueries();
    },
    [isSuperAdmin, queryClient],
  );

  const value = useMemo(
    () => ({ activeTenantId, canSwitch: isSuperAdmin, setActiveTenant }),
    [activeTenantId, isSuperAdmin, setActiveTenant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within <TenantProvider>');
  return ctx;
}
