"use client";

import { useState } from "react";
import PageHeading from "@/components/common/PageHeading";
import Card from "@/components/profile/Card";
import { ToastProvider } from "@/components/profile/ToastProvider";
import PersonalInfoTab from "@/components/profile/PersonalInfoTab";
import AddressesTab from "@/components/profile/AddressesTab";
import SecurityTab from "@/components/profile/SecurityTab";
import SessionsTab from "@/components/profile/SessionsTab";
import Button from "@/components/ui/button/Button";
import { useProfile } from "@/lib/profile";
import { useI18n, type TranslationKey } from "@/lib/i18n";

type TabId = "personal" | "addresses" | "security" | "sessions";

const TABS: { id: TabId; labelKey: TranslationKey }[] = [
  { id: "personal", labelKey: "profile.tab.personal" },
  { id: "addresses", labelKey: "profile.tab.addresses" },
  { id: "security", labelKey: "profile.tab.security" },
  { id: "sessions", labelKey: "profile.tab.sessions" },
];

function ProfileSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 animate-pulse rounded-full bg-gray-100 dark:bg-white/[0.06]" />
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
        </div>
      </div>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>("personal");
  const { data: profile, isLoading, isError, refetch, isFetching } = useProfile();

  return (
    <ToastProvider>
      <PageHeading title={t("profile.title")} subtitle={t("profile.subtitle")} />

      {/* Tab bar */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex gap-6 overflow-x-auto" role="tablist">
          {TABS.map((tabItem) => {
            const active = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(tabItem.id)}
                className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
                  active
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {t(tabItem.labelKey)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab panel */}
      {isLoading ? (
        <ProfileSkeleton />
      ) : isError || !profile ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("profile.error.load")}</p>
            <Button size="sm" variant="outline" disabled={isFetching} onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        </Card>
      ) : (
        <div role="tabpanel">
          {tab === "personal" && <PersonalInfoTab profile={profile} />}
          {tab === "addresses" && <AddressesTab profile={profile} />}
          {tab === "security" && <SecurityTab profile={profile} />}
          {tab === "sessions" && <SessionsTab />}
        </div>
      )}
    </ToastProvider>
  );
}
