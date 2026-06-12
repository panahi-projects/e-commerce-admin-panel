"use client";

import { useMemo } from "react";
import { AdvancedDataTable, type ColumnDef, type FilterDef } from "@/components/common/data-table";
import Badge from "@/components/ui/badge/Badge";
import LockedNotice from "./LockedNotice";
import { ApiException } from "@/lib/api";
import { usersService, type AuditLog } from "@/lib/users";
import { useI18n, type TranslationKey } from "@/lib/i18n";

const ACTIONS = [
  "LOGIN",
  "LOGIN_FAILED",
  "LOGOUT",
  "LOGOUT_ALL",
  "PASSWORD_SET",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "ROLE_CHANGED",
  "SUSPICIOUS",
  "ADMIN_FORCE_LOGOUT",
];

const DANGER_ACTIONS = new Set(["LOGIN_FAILED", "SUSPICIOUS", "ADMIN_FORCE_LOGOUT"]);

/** Minimal UA → "Browser · OS" parse for readability. */
function parseUA(ua?: string): string {
  if (!ua) return "—";
  const browser = /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "—";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";
  return [browser, os].filter((x) => x && x !== "—").join(" · ") || "—";
}

export default function ActivityTab({ userId }: { userId: string }) {
  const { t, locale } = useI18n();

  const columns: ColumnDef<AuditLog>[] = useMemo(
    () => [
      {
        key: "action",
        header: t("users.activity.action"),
        cell: (r) => (
          <Badge size="sm" color={DANGER_ACTIONS.has(r.action) ? "error" : "light"}>
            {t(`users.audit.${r.action}` as TranslationKey, r.action)}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: t("users.activity.time"),
        sortable: true,
        cell: (r) => (
          <span className="text-sm text-gray-600 dark:text-gray-400" dir="ltr">
            {new Date(r.createdAt).toLocaleString(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        ),
      },
      { key: "ip", header: t("users.activity.ip"), cell: (r) => <span dir="ltr">{r.ip ?? "—"}</span> },
      { key: "userAgent", header: t("users.activity.device"), cell: (r) => parseUA(r.userAgent) },
    ],
    [t, locale],
  );

  // `action` multi-value encoding (comma-joined) and `from`/`to` per §10.12 —
  // confirm the multi-select encoding with the backend.
  const filters: FilterDef[] = useMemo(
    () => [
      {
        key: "action",
        label: t("users.activity.filterAction"),
        type: "multiselect",
        options: ACTIONS.map((a) => ({ value: a, label: t(`users.audit.${a}` as TranslationKey, a) })),
      },
      { key: "createdAt", label: t("users.activity.dateRange"), type: "daterange", fromKey: "from", toKey: "to" },
    ],
    [t],
  );

  return (
    <AdvancedDataTable<AuditLog>
      storageKey="user-activity"
      paramPrefix="act"
      queryKey={["audit-logs", userId]}
      columns={columns}
      filters={filters}
      searchable={false}
      fetcher={(params) => usersService.activity({ ...params, userId })}
      rowId={(r) => r._id ?? r.id ?? `${r.action}-${r.createdAt}`}
      defaultSort={{ sortBy: "createdAt", sortOrder: "desc" }}
      emptyTitle={t("table.empty")}
      renderError={(error) =>
        error instanceof ApiException && (error.statusCode === 403 || error.statusCode === 404) ? (
          <LockedNotice title={t("users.activity.disabled")} />
        ) : (
          <LockedNotice title={t("table.error")} />
        )
      }
    />
  );
}
