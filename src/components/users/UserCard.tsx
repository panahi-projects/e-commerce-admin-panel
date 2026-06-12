"use client";

import RowActionsMenu from "@/components/common/data-table/RowActionsMenu";
import type { RowAction } from "@/components/common/data-table";
import { CopyId, RoleText, StatusBadge, UserIdentity, VerificationCell } from "./cells";
import { useI18n } from "@/lib/i18n";
import type { UserListItem } from "@/lib/users";

export default function UserCard({
  user,
  actions = [],
}: {
  user: UserListItem;
  actions?: RowAction<UserListItem>[];
}) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/40">
      <div className="flex items-start justify-between gap-2">
        <UserIdentity user={user} />
        {actions.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <RowActionsMenu row={user} actions={actions} ariaLabel={t("table.actions")} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <RoleText role={user.role} />
        <StatusBadge user={user} />
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
        <VerificationCell user={user} />
        <CopyId user={user} />
      </div>
    </div>
  );
}
