"use client";

import { useQuery } from "@tanstack/react-query";
import Card from "@/components/profile/Card";
import Badge from "@/components/ui/badge/Badge";
import LockedNotice from "./LockedNotice";
import { ApiException } from "@/lib/api";
import { usersService, isCouponUsed, type UserCoupon } from "@/lib/users";
import { useI18n } from "@/lib/i18n";

function CouponGroup({
  title,
  list,
  color,
}: {
  title: string;
  list: UserCoupon[];
  color: "success" | "light";
}) {
  const { t } = useI18n();
  return (
    <Card title={title} action={<Badge size="sm" color={color}>{list.length}</Badge>}>
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">{t("users.coupons.empty")}</p>
      ) : (
        <div className="space-y-2">
          {list.map((c, i) => (
            <CouponRow key={c._id ?? c.id ?? c.code ?? i} coupon={c} />
          ))}
        </div>
      )}
    </Card>
  );
}

function CouponRow({ coupon }: { coupon: UserCoupon }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800">
      <code className="font-mono text-sm text-gray-800 dark:text-white/90" dir="ltr">
        {coupon.code ?? "—"}
      </code>
      {coupon.discount != null && (
        <span className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">
          {coupon.discount}
          {coupon.type === "percentage" ? "%" : ""}
        </span>
      )}
    </div>
  );
}

export default function CouponsTab({ userId }: { userId: string }) {
  const { t } = useI18n();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-coupons", userId],
    queryFn: () => usersService.coupons(userId),
    staleTime: 15_000,
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.03]" />;
  if (isError) {
    const is403 = error instanceof ApiException && (error.statusCode === 403 || error.statusCode === 404);
    return <LockedNotice title={is403 ? t("users.locked.title") : t("table.error")} hint={is403 ? t("users.locked.hint") : undefined} />;
  }

  const coupons = data ?? [];
  const used = coupons.filter(isCouponUsed);
  const unused = coupons.filter((c) => !isCouponUsed(c));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <CouponGroup title={t("users.coupons.unused")} list={unused} color="success" />
      <CouponGroup title={t("users.coupons.used")} list={used} color="light" />
    </div>
  );
}
