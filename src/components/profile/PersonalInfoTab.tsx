"use client";

import { useState } from "react";
import Card from "./Card";
import VerificationBadge from "./VerificationBadge";
import EditInfoModal from "./modals/EditInfoModal";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import { useI18n } from "@/lib/i18n";
import type { Profile } from "@/lib/profile";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{value || "—"}</span>
    </div>
  );
}

export default function PersonalInfoTab({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <AvatarText name={fullName} className="h-14 w-14" />
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{fullName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{profile.role}</p>
        </div>
      </div>

      <Card
        title={t("profile.personal.basicInfo")}
        action={
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            {t("common.edit")}
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <Row label={t("profile.field.firstName")} value={profile.firstName} />
          <Row label={t("profile.field.lastName")} value={profile.lastName} />
          <Row label={t("profile.field.phone")} value={profile.phone} />
          <Row label={t("profile.field.role")} value={profile.role} />
        </div>
      </Card>

      <Card title={t("profile.personal.contact")}>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <div className="flex items-center justify-between py-3">
            <Row label={t("profile.field.email")} value={profile.email} />
            <VerificationBadge verified={profile.isEmailVerified} />
          </div>
          <div className="flex items-center justify-between py-3">
            <Row label={t("profile.field.phone")} value={profile.phone} />
            <VerificationBadge verified={profile.isPhoneVerified} />
          </div>
        </div>
      </Card>

      {editing && <EditInfoModal profile={profile} onClose={() => setEditing(false)} />}
    </div>
  );
}
