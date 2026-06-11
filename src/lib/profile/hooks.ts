"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { profileService } from './service';

export const PROFILE_QUERY_KEY = ['profile'] as const;

/** Single source of truth for the profile (incl. addresses). Mutations invalidate this. */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => profileService.get(),
    staleTime: 30_000,
  });
}

/** Refetch helper passed to modals so they can refresh profile data after a mutation. */
export function useRefetchProfile() {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY }),
    [queryClient],
  );
}

export { profileService };
