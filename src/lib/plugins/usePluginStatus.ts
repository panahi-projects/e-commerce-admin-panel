"use client";

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useTenant } from '@/lib/tenant';
import { pluginService, parseEnabledPlugins } from './service';
import type { PluginKey } from './types';

/**
 * Resolves which plugins are enabled for the active tenant (§9), for nav gating.
 *
 * - super_admin with a selected tenant → reflects that tenant's enabled plugins.
 * - super_admin with no tenant selected → god mode: gate is "unknown", show all.
 * - tenant operators → the plugin-status endpoint is super-only, so the gate is
 *   "unknown"; we don't hide on a plugin basis and rely on the permission map +
 *   graceful 403 handling on the page instead.
 *
 * `isEnabled(key)` returns true whenever the gate is unknown — i.e. it only ever
 * hides a plugin item when we positively know it is disabled.
 */
export function usePluginStatus() {
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const isSuperAdmin = user?.role === 'super_admin';
  const canQuery = isSuperAdmin && !!activeTenantId;

  const { data } = useQuery({
    queryKey: ['admin', 'plugin-status', activeTenantId],
    queryFn: () => pluginService.statusFor(activeTenantId as string),
    enabled: canQuery,
    staleTime: 5 * 60_000,
  });

  const enabled = canQuery && data ? parseEnabledPlugins(data) : null; // null = unknown

  return {
    /** null when the gate is unknown (don't hide). */
    enabledPlugins: enabled,
    isEnabled: (key: PluginKey) => (enabled ? enabled.has(key) : true),
  };
}
