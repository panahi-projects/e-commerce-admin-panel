"use client";

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete';

/**
 * Resolves UI gating from the §5.7 permission map. super_admin
 * (`isSuperAdmin`) passes every check unconditionally. For non-super roles a
 * missing section / `false` action means "hide or disable" (§8).
 *
 * Drive the menu off `canAccess(key)` and buttons off `can(key, action)`; use
 * `hasApiKey` for finer per-endpoint gating. NOTE: this is UX only — the server
 * re-checks every request, so never treat it as security.
 */
export function usePermissions() {
  const { permissions } = useAuth();

  return useMemo(() => {
    const isSuperAdmin = permissions?.isSuperAdmin ?? false;
    const sections = permissions?.sections ?? {};

    const canAccess = (sectionKey: string): boolean =>
      isSuperAdmin || (sections[sectionKey]?.canAccess ?? false);

    const can = (sectionKey: string, action: PermissionAction): boolean =>
      isSuperAdmin || (sections[sectionKey]?.actions[action] ?? false);

    const hasApiKey = (sectionKey: string, apiKey: string): boolean =>
      isSuperAdmin || (sections[sectionKey]?.allowedApiKeys.includes(apiKey) ?? false);

    return { isSuperAdmin, sections, canAccess, can, hasApiKey, role: permissions?.role };
  }, [permissions]);
}
