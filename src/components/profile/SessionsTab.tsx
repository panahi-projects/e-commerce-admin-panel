"use client";

import { useState } from "react";
import Card from "./Card";
import ConfirmDialog from "./modals/ConfirmDialog";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { DeviceSession } from "@/lib/profile";

// Mock data — replace with a real GET /sessions feed when the endpoint exists.
const MOCK_SESSIONS: DeviceSession[] = [
  {
    id: "current",
    device: "desktop",
    browser: "Chrome 124",
    os: "Windows 11",
    location: "Tehran, IR",
    ip: "151.240.10.4",
    lastActiveAt: "2026-06-11T09:12:00.000Z",
    isCurrent: true,
  },
  {
    id: "s2",
    device: "mobile",
    browser: "Safari",
    os: "iOS 18",
    location: "Tehran, IR",
    ip: "188.229.42.18",
    lastActiveAt: "2026-06-10T20:40:00.000Z",
    isCurrent: false,
  },
];

const DeviceIcon = ({ device }: { device: DeviceSession["device"] }) => (
  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-300">
    {device === "mobile" ? (
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

export default function SessionsTab() {
  const { t, locale } = useI18n();
  const { logoutAll } = useAuth();
  const [sessions, setSessions] = useState<DeviceSession[]>(MOCK_SESSIONS);
  const [confirmAll, setConfirmAll] = useState(false);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "fa" ? "fa-IR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const revoke = (id: string) => setSessions((prev) => prev.filter((s) => s.id !== id));
  const others = sessions.filter((s) => !s.isCurrent);

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("profile.sessions.title")}
        </h2>
        {others.length > 0 && (
          <Button size="sm" variant="danger" onClick={() => setConfirmAll(true)}>
            {t("profile.sessions.logoutOthers")}
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">{t("profile.sessions.mockNote")}</p>

      <Card className="!p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-4 p-4">
              <DeviceIcon device={s.device} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {s.browser} · {s.os}
                  </p>
                  {s.isCurrent && (
                    <Badge color="success" size="sm">{t("profile.sessions.current")}</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                  {s.location} · {s.ip}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t("profile.sessions.lastActive")}: {fmt(s.lastActiveAt)}
                </p>
              </div>
              {!s.isCurrent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => revoke(s.id)}
                >
                  {t("profile.sessions.revoke")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {confirmAll && (
        <ConfirmDialog
          title={t("profile.logoutAll.title")}
          message={t("profile.logoutAll.confirm")}
          confirmLabel={t("profile.sessions.logoutOthers")}
          onConfirm={() => logoutAll()}
          onClose={() => setConfirmAll(false)}
        />
      )}
    </div>
  );
}
