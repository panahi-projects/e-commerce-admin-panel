"use client";

import { useMemo } from "react";
import { AdvancedDataTable, type ColumnDef } from "@/components/common/data-table";
import Badge from "@/components/ui/badge/Badge";
import LockedNotice from "./LockedNotice";
import { ApiException } from "@/lib/api";
import { usersService, userIdOf, type UserOrder } from "@/lib/users";
import { useI18n } from "@/lib/i18n";

export default function OrdersTab({ userId }: { userId: string }) {
  const { t, locale } = useI18n();

  const columns: ColumnDef<UserOrder>[] = useMemo(
    () => [
      {
        key: "order",
        header: t("users.orders.id"),
        cell: (o) => <span className="font-mono text-sm" dir="ltr">{o.orderNumber ?? userIdOf(o).slice(0, 8)}</span>,
      },
      {
        key: "createdAt",
        header: t("users.orders.date"),
        sortable: true,
        cell: (o) =>
          o.createdAt ? (
            <span dir="ltr">{new Date(o.createdAt).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium" })}</span>
          ) : (
            "—"
          ),
      },
      {
        key: "status",
        header: t("users.orders.status"),
        cell: (o) => (o.status ? <Badge size="sm" color="light">{o.status}</Badge> : "—"),
      },
      {
        key: "total",
        header: t("users.orders.total"),
        align: "end",
        cell: (o) => <span dir="ltr">{o.total != null ? o.total.toLocaleString(locale === "fa" ? "fa-IR" : "en-US") : "—"}</span>,
      },
    ],
    [t, locale],
  );

  return (
    <AdvancedDataTable<UserOrder>
      storageKey="user-orders"
      paramPrefix="ord"
      queryKey={["user-orders", userId]}
      columns={columns}
      searchable={false}
      fetcher={(params) => usersService.orders(userId, params)}
      rowId={(o) => userIdOf(o)}
      defaultSort={{ sortBy: "createdAt", sortOrder: "desc" }}
      emptyTitle={t("users.orders.empty")}
      renderError={(error) => (
        <LockedNotice
          title={
            error instanceof ApiException && (error.statusCode === 403 || error.statusCode === 404)
              ? t("users.locked.title")
              : t("table.error")
          }
          hint={error instanceof ApiException && error.statusCode === 403 ? t("users.locked.hint") : undefined}
        />
      )}
    />
  );
}
