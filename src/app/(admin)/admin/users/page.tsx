"use client";

import { Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageHeading from "@/components/common/PageHeading";
import UserAvatar from "@/components/ui/avatar/UserAvatar";
import { AdvancedDataTable, type ColumnDef, type FilterDef, type RowAction } from "@/components/common/data-table";
import { CopyId, DateText, RoleText, StatusBadge, VerificationCell, fullName } from "@/components/users/cells";
import UserCard from "@/components/users/UserCard";
import { usersService, userIdOf, type UserListItem } from "@/lib/users";
import { useI18n } from "@/lib/i18n";

function UsersTable() {
  const { t } = useI18n();
  const router = useRouter();

  const columns: ColumnDef<UserListItem>[] = useMemo(
    () => [
      {
        key: "user",
        header: t("users.col.user"),
        cell: (u) => (
          <div className="flex items-center gap-3">
            <UserAvatar src={u.avatar} firstName={u.firstName} lastName={u.lastName} name={fullName(u)} size="md" />
            <span className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{fullName(u)}</span>
          </div>
        ),
        hideable: false,
      },
      {
        key: "identifier",
        header: t("users.col.identifier"),
        cell: (u) => (
          <span className="text-sm text-gray-600 dark:text-gray-400" dir="ltr">
            {u.email ?? u.phone ?? "—"}
          </span>
        ),
      },
      { key: "role", header: t("users.col.role"), cell: (u) => <RoleText role={u.role} /> },
      { key: "status", header: t("users.col.status"), cell: (u) => <StatusBadge user={u} /> },
      { key: "verification", header: t("users.col.verification"), cell: (u) => <VerificationCell user={u} /> },
      { key: "id", header: t("users.col.id"), cell: (u) => <CopyId user={u} /> },
      {
        key: "createdAt",
        header: t("users.col.registered"),
        sortable: true,
        cell: (u) => <DateText value={u.createdAt} />,
      },
    ],
    [t],
  );

  // NOTE: only q/role/isActive are confirmed by §10.2. The rest (isDeleted,
  // verification flags, registration range) are best-effort and depend on backend
  // support — flagged as open questions; unsupported params are ignored server-side.
  const filters: FilterDef[] = useMemo(
    () => [
      {
        key: "role",
        label: t("users.filter.role"),
        type: "select",
        options: [
          { value: "super_admin", label: t("users.role.super_admin") },
          { value: "tenant_admin", label: t("users.role.tenant_admin") },
          { value: "tenant_staff", label: t("users.role.tenant_staff") },
          { value: "end_user", label: t("users.role.end_user") },
        ],
      },
      { key: "isActive", label: t("users.filter.isActive"), type: "boolean" },
      { key: "isDeleted", label: t("users.filter.isDeleted"), type: "boolean" },
      { key: "isEmailVerified", label: t("users.filter.emailVerified"), type: "boolean" },
      { key: "isPhoneVerified", label: t("users.filter.phoneVerified"), type: "boolean" },
      { key: "createdAt", label: t("users.filter.registered"), type: "daterange" },
    ],
    [t],
  );

  const rowActions: RowAction<UserListItem>[] = useMemo(
    () => [{ key: "view", label: t("users.action.view"), href: (u) => `/admin/users/${userIdOf(u)}` }],
    [t],
  );

  return (
    <AdvancedDataTable<UserListItem>
      storageKey="users"
      queryKey={["users", "list"]}
      columns={columns}
      filters={filters}
      rowActions={rowActions}
      fetcher={(params) => usersService.list(params)}
      cardRenderer={(u, ctx) => <UserCard user={u} actions={ctx.actions} />}
      rowId={(u) => userIdOf(u)}
      onRowClick={(u) => router.push(`/admin/users/${userIdOf(u)}`)}
      searchPlaceholder={t("users.searchPlaceholder")}
      emptyTitle={t("users.empty")}
      emptyHint={t("users.emptyHint")}
      defaultSort={{ sortBy: "createdAt", sortOrder: "desc" }}
    />
  );
}

export default function UsersPage() {
  const { t } = useI18n();
  return (
    <div>
      <PageHeading title={t("users.title")} subtitle={t("users.subtitle")} />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.03]" />}>
        <UsersTable />
      </Suspense>
    </div>
  );
}
