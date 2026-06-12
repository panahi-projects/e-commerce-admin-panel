"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import UserAvatar from "@/components/ui/avatar/UserAvatar";
import { ToastProvider } from "@/components/profile/ToastProvider";
import { RoleText, StatusBadge, fullName } from "@/components/users/cells";
import ProfileTab from "@/components/users/detail/ProfileTab";
import ActivityTab from "@/components/users/detail/ActivityTab";
import CartTab from "@/components/users/detail/CartTab";
import OrdersTab from "@/components/users/detail/OrdersTab";
import ReviewsTab from "@/components/users/detail/ReviewsTab";
import CouponsTab from "@/components/users/detail/CouponsTab";
import LockedNotice from "@/components/users/detail/LockedNotice";
import { useUserDetail } from "@/lib/users";
import { ApiException } from "@/lib/api";
import { useI18n, type TranslationKey } from "@/lib/i18n";

type TabId = "profile" | "activity" | "cart" | "orders" | "reviews" | "coupons";
const TABS: { id: TabId; labelKey: TranslationKey }[] = [
  { id: "profile", labelKey: "users.tab.profile" },
  { id: "activity", labelKey: "users.tab.activity" },
  { id: "cart", labelKey: "users.tab.cart" },
  { id: "orders", labelKey: "users.tab.orders" },
  { id: "reviews", labelKey: "users.tab.reviews" },
  { id: "coupons", labelKey: "users.tab.coupons" },
];

function BackLink() {
  const { t } = useI18n();
  return (
    <Link
      href="/admin/users"
      className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <span className="rtl:-scale-x-100">←</span>
      {t("common.back")}
    </Link>
  );
}

function UserDetailInner({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>("profile");
  const { data: user, isLoading, isError, error } = useUserDetail(userId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.03]" />;
  }
  if (isError || !user) {
    const is403 = error instanceof ApiException && (error.statusCode === 403 || error.statusCode === 404);
    return (
      <LockedNotice
        title={is403 ? t("users.locked.title") : t("users.detail.error")}
        hint={is403 ? t("users.locked.hint") : undefined}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <UserAvatar src={user.avatar} firstName={user.firstName} lastName={user.lastName} name={fullName(user)} size="xl" />
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{fullName(user)}</h1>
          <div className="mt-1 flex items-center gap-2">
            <RoleText role={user.role} />
            <StatusBadge user={user} />
          </div>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex gap-6 overflow-x-auto" role="tablist">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
                  active
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>
      </div>

      <div role="tabpanel">
        {tab === "profile" && <ProfileTab userId={userId} user={user} />}
        {tab === "activity" && <ActivityTab userId={userId} />}
        {tab === "cart" && <CartTab userId={userId} />}
        {tab === "orders" && <OrdersTab userId={userId} />}
        {tab === "reviews" && <ReviewsTab userId={userId} />}
        {tab === "coupons" && <CouponsTab userId={userId} />}
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = String(params.userId);
  return (
    <ToastProvider>
      <BackLink />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.03]" />}>
        <UserDetailInner userId={userId} />
      </Suspense>
    </ToastProvider>
  );
}
