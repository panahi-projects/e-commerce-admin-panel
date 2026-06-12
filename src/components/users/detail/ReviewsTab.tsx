"use client";

import { useMemo } from "react";
import { AdvancedDataTable, type ColumnDef } from "@/components/common/data-table";
import LockedNotice from "./LockedNotice";
import { ApiException } from "@/lib/api";
import { usersService, userIdOf, type UserReview } from "@/lib/users";
import { useI18n } from "@/lib/i18n";

function productName(r: UserReview): string {
  if (r.productName) return r.productName;
  const p = r.product;
  if (!p) return "—";
  if (typeof p === "string") return p;
  const n = p.name;
  if (!n) return "—";
  return typeof n === "string" ? n : n.en ?? n.fa ?? "—";
}

function Stars({ rating = 0 }: { rating?: number }) {
  return (
    <span className="text-warning-500" dir="ltr" aria-label={`${rating}/5`}>
      {"★".repeat(Math.max(0, Math.min(5, Math.round(rating))))}
      <span className="text-gray-300 dark:text-gray-600">{"★".repeat(Math.max(0, 5 - Math.round(rating)))}</span>
    </span>
  );
}

export default function ReviewsTab({ userId }: { userId: string }) {
  const { t, locale } = useI18n();

  const columns: ColumnDef<UserReview>[] = useMemo(
    () => [
      { key: "product", header: t("users.reviews.product"), cell: (r) => productName(r) },
      { key: "rating", header: t("users.reviews.rating"), cell: (r) => <Stars rating={r.rating} /> },
      {
        key: "comment",
        header: t("users.reviews.comment"),
        cell: (r) => <span className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{r.comment ?? "—"}</span>,
      },
      {
        key: "createdAt",
        header: t("users.reviews.date"),
        sortable: true,
        cell: (r) =>
          r.createdAt ? (
            <span dir="ltr">{new Date(r.createdAt).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium" })}</span>
          ) : (
            "—"
          ),
      },
    ],
    [t, locale],
  );

  return (
    <AdvancedDataTable<UserReview>
      storageKey="user-reviews"
      paramPrefix="rev"
      queryKey={["user-reviews", userId]}
      columns={columns}
      searchable={false}
      fetcher={(params) => usersService.reviews(userId, params)}
      rowId={(r) => userIdOf(r)}
      defaultSort={{ sortBy: "createdAt", sortOrder: "desc" }}
      emptyTitle={t("users.reviews.empty")}
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
