"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/**
 * Gate for the authenticated (admin) area. Redirects unauthenticated users to
 * /login and shows a lightweight loading state while the session bootstraps.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500 dark:text-gray-400">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
