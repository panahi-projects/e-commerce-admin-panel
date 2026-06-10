import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { api, session } from '@/lib/api';
import type { ApiSuccess } from '@/lib/api';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Endpoints that must NEVER trigger a refresh-and-retry (avoids loops). */
const NO_REFRESH = ['/auth/refresh', '/auth/admin/login', '/auth/logout', '/auth/request-otp'];

/** A deactivated account keeps failing refresh — surface it instead of retrying (§5.4). */
const INACTIVE_MESSAGE_KEY = 'auth.account_inactive';

let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  // POST /auth/refresh — cookie sent automatically; returns a rotated cookie + new token.
  const res = await api.post<ApiSuccess<{ accessToken: string }>>('/auth/refresh');
  const token = res.data.data.accessToken;
  session.setAccessToken(token);
  return token;
}

/**
 * Install the 401 → /auth/refresh → retry interceptor. `onAuthFailure` is called
 * when refresh fails (or the account is inactive) so the app can clear state and
 * redirect to login. Returns an eject function.
 */
export function installRefreshInterceptor(onAuthFailure: (reason: 'expired' | 'inactive') => void) {
  return api.interceptors.response.use(
    (r) => r,
    async (error: AxiosError<{ message?: string }>) => {
      const config = error.config as RetriableConfig | undefined;
      const status = error.response?.status;

      if (status !== 401 || !config || config._retry) {
        return Promise.reject(error);
      }
      if (NO_REFRESH.some((p) => (config.url ?? '').includes(p))) {
        return Promise.reject(error);
      }

      // Inactive account — refresh won't help; force logout (§5.4).
      const apiData = error.response?.data;
      if (apiData?.message === INACTIVE_MESSAGE_KEY) {
        onAuthFailure('inactive');
        return Promise.reject(error);
      }

      config._retry = true;
      try {
        refreshPromise ??= doRefresh().finally(() => {
          refreshPromise = null;
        });
        const token = await refreshPromise;
        config.headers.set('Authorization', `Bearer ${token}`);
        return api.request(config);
      } catch (refreshErr) {
        session.clear();
        onAuthFailure('expired');
        return Promise.reject(refreshErr);
      }
    },
  );
}
