"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "@/components/profile/Card";
import ConfirmDialog from "@/components/profile/modals/ConfirmDialog";
import { useToast } from "@/components/profile/ToastProvider";
import Button from "@/components/ui/button/Button";
import LockedNotice from "./LockedNotice";
import { ApiException } from "@/lib/api";
import { usersService, type CartItem } from "@/lib/users";
import { useI18n } from "@/lib/i18n";

const itemName = (it: CartItem) => it.name ?? it.title ?? "—";
const money = (n: number | undefined, locale: string) =>
  n == null ? "—" : n.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");

export default function CartTab({ userId }: { userId: string }) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const queryKey = ["user-cart", userId];
  const [confirm, setConfirm] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => usersService.cart(userId),
    staleTime: 15_000,
  });

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.03]" />;
  }
  if (isError) {
    const is403 = error instanceof ApiException && (error.statusCode === 403 || error.statusCode === 404);
    return <LockedNotice title={is403 ? t("users.locked.title") : t("table.error")} hint={is403 ? t("users.locked.hint") : undefined} />;
  }

  const items = data?.items ?? [];
  const grandTotal = data?.total ?? items.reduce((sum, it) => sum + (it.total ?? (it.price ?? 0) * (it.quantity ?? 0)), 0);

  if (items.length === 0) {
    return (
      <Card>
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{t("users.cart.empty")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="danger" onClick={() => setConfirm(true)}>
          {t("users.cart.emptyAction")}
        </Button>
      </div>

      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-gray-200 dark:border-gray-800">
              <tr className="text-start text-xs font-medium text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 text-start">{t("users.cart.product")}</th>
                <th className="px-4 py-3 text-end">{t("users.cart.qty")}</th>
                <th className="px-4 py-3 text-end">{t("users.cart.price")}</th>
                <th className="px-4 py-3 text-end">{t("users.cart.total")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.productId ?? i} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{itemName(it)}</td>
                  <td className="px-4 py-3 text-end text-sm" dir="ltr">{it.quantity ?? "—"}</td>
                  <td className="px-4 py-3 text-end text-sm" dir="ltr">{money(it.price, locale)}</td>
                  <td className="px-4 py-3 text-end text-sm font-medium" dir="ltr">
                    {money(it.total ?? (it.price ?? 0) * (it.quantity ?? 0), locale)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 dark:border-gray-800">
                <td colSpan={3} className="px-4 py-3 text-end text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("users.cart.grandTotal")}
                </td>
                <td className="px-4 py-3 text-end text-sm font-semibold text-gray-900 dark:text-white" dir="ltr">
                  {money(grandTotal, locale)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {confirm && (
        <ConfirmDialog
          title={t("users.cart.emptyTitle")}
          message={t("users.cart.emptyConfirm")}
          confirmLabel={t("users.cart.emptyAction")}
          onConfirm={async () => {
            await usersService.emptyCart(userId);
            await qc.invalidateQueries({ queryKey });
            toast(t("users.toast.cartEmptied"));
            setConfirm(false);
          }}
          onClose={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
