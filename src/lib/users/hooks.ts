"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usePermissions } from '@/lib/permissions';
import { usePluginStatus } from '@/lib/plugins';
import { usersService } from './service';

export const userDetailKey = (id: string) => ['user-manager', 'user', id] as const;

/** Full user profile (user-manager). */
export function useUserDetail(id: string) {
  return useQuery({
    queryKey: userDetailKey(id),
    queryFn: () => usersService.get(id),
    staleTime: 15_000,
    enabled: Boolean(id),
  });
}

export function useRefetchUser(id: string) {
  const qc = useQueryClient();
  return useCallback(() => qc.invalidateQueries({ queryKey: userDetailKey(id) }), [qc, id]);
}

/**
 * Whether user-manager features should be offered. super_admin always; for tenant
 * operators it's permissive when the plugin gate is "unknown" (the actual 403 is
 * handled inline per-request, per the prompt).
 */
export function useUserManagerAccess() {
  const { isSuperAdmin } = usePermissions();
  const { isEnabled } = usePluginStatus();
  return { allowed: isSuperAdmin || isEnabled('userManager') };
}

export { usersService };
