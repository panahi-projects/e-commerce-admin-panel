"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Card from "./Card";
import ConfirmDialog from "./modals/ConfirmDialog";
import { useToast } from "./ToastProvider";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { sessionsService, useSessions, type DeviceSession } from "@/lib/profile";
import { useI18n } from "@/lib/i18n";

const isMobileUA = (ua: string) => /mobile|android|iphone|ipad|ipod/i.test(ua);

const DeviceIcon = ({ mobile }: { mobile: boolean }) => (
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-300">
    {mobile ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 18h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )}
  </span>
);

function SessionsSkeleton() {
  return (
    <Card className="!p-0">
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-white/[0.06]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-48 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function SessionsTab() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const { data: sessions, isLoading, isError, refetch, isFetching } = useSessions();
  const [confirmOthers, setConfirmOthers] = useState(false);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "fa" ? "fa-IR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const revoke = useMutation({
    mutationFn: (id: string) => sessionsService.revoke(id),
    onSuccess: async () => {
      await refetch();
      toast(t("profile.sessions.revoked"));
    },
    onError: () => toast(t("common.somethingWrong"), "error"),
  });

  if (isLoading) return <SessionsSkeleton />;

  if (isError || !sessions) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("profile.error.load")}</p>
          <Button size="sm" variant="outline" disabled={isFetching} onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
            {t("profile.sessions.empty")}
          </p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {t("profile.sessions.emptyHint")}
          </p>
        </div>
      </Card>
    );
  }

  const others = sessions.filter((s) => !s.current);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("profile.sessions.title")}
        </h2>
        {others.length > 0 && (
          <Button size="sm" variant="danger" onClick={() => setConfirmOthers(true)}>
            {t("profile.sessions.logoutOthers")}
          </Button>
        )}
      </div>

      <Card className="!p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {sessions.map((s: DeviceSession) => (
            <li key={s.id} className="flex items-center gap-4 p-4">
              <DeviceIcon mobile={isMobileUA(s.userAgent)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {s.device}
                  </p>
                  {s.current && (
                    <Badge color="success" size="sm">{t("profile.sessions.current")}</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                  {[s.location, s.ip].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t("profile.sessions.lastActive")}: {fmt(s.lastActiveAt)}
                </p>
              </div>
              {!s.current && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(s.id)}
                >
                  {t("profile.sessions.revoke")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {confirmOthers && (
        <ConfirmDialog
          title={t("profile.sessions.logoutOthersTitle")}
          message={t("profile.sessions.logoutOthersConfirm")}
          confirmLabel={t("profile.sessions.logoutOthers")}
          // Revokes other sessions but keeps the current one — so refetch, don't redirect.
          onConfirm={async () => {
            await sessionsService.logoutOthers();
            await refetch();
            toast(t("profile.sessions.othersRevoked"));
            setConfirmOthers(false);
          }}
          onClose={() => setConfirmOthers(false)}
        />
      )}
    </div>
  );
}
