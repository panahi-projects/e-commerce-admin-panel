"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import UserAvatar from "@/components/ui/avatar/UserAvatar";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { userIdOf, type UserListItem } from "@/lib/users";

const KNOWN_ROLES = ["super_admin", "tenant_admin", "tenant_staff", "end_user"];

export function RoleText({ role }: { role: string }) {
  const { t } = useI18n();
  const label = KNOWN_ROLES.includes(role) ? t(`users.role.${role}` as TranslationKey) : role;
  return <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>;
}

export function fullName(u: UserListItem) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.phone || "—";
}

export function UserIdentity({ user }: { user: UserListItem }) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar src={user.avatar} firstName={user.firstName} lastName={user.lastName} name={fullName(user)} size="md" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{fullName(user)}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400" dir="ltr">
          {user.email ?? user.phone ?? ""}
        </p>
      </div>
    </div>
  );
}

export function StatusBadge({ user }: { user: Pick<UserListItem, "isActive" | "isDeleted"> }) {
  const { t } = useI18n();
  if (user.isDeleted) return <Badge color="error" size="sm">{t("users.status.deleted")}</Badge>;
  return user.isActive ? (
    <Badge color="success" size="sm">{t("users.status.active")}</Badge>
  ) : (
    <Badge color="light" size="sm">{t("users.status.inactive")}</Badge>
  );
}

const Check = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M13 4.5 6.5 11 3 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Cross = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M11.5 4.5l-7 7M4.5 4.5l7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export function VerificationCell({ user }: { user: UserListItem }) {
  const { t } = useI18n();
  const item = (ok: boolean, on: string, off: string, glyph: string) => (
    <span
      title={ok ? on : off}
      aria-label={ok ? on : off}
      className={`inline-flex items-center gap-1 text-xs ${ok ? "text-success-600 dark:text-success-500" : "text-gray-400 dark:text-gray-500"}`}
    >
      {ok ? Check : Cross}
      <span className="font-medium">{glyph}</span>
    </span>
  );
  return (
    <div className="flex items-center gap-3">
      {item(Boolean(user.isEmailVerified), t("users.verify.emailOn"), t("users.verify.emailOff"), "@")}
      {item(Boolean(user.isPhoneVerified), t("users.verify.phoneOn"), t("users.verify.phoneOff"), "☎")}
    </div>
  );
}

export function CopyId({ user }: { user: UserListItem }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const id = userIdOf(user);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      title={copied ? t("users.idCopied") : t("common.copy")}
      className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]"
      dir="ltr"
    >
      <span className="max-w-24 truncate">{id.slice(0, 8)}…</span>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M3.5 10.5h-.5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </button>
  );
}

export function DateText({ value }: { value?: string }) {
  const { locale } = useI18n();
  if (!value) return <span className="text-gray-400">—</span>;
  return (
    <span className="text-sm text-gray-600 dark:text-gray-400" dir="ltr">
      {new Date(value).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium" })}
    </span>
  );
}
