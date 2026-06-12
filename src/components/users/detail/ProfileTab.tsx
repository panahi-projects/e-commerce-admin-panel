"use client";

import { useState } from "react";
import Card from "@/components/profile/Card";
import ConfirmDialog from "@/components/profile/modals/ConfirmDialog";
import { useToast } from "@/components/profile/ToastProvider";
import ResetPasswordModal from "./ResetPasswordModal";
import Button from "@/components/ui/button/Button";
import { DateText, RoleText, StatusBadge, VerificationCell } from "@/components/users/cells";
import { usersService, useRefetchUser, type UserDetail } from "@/lib/users";
import { useI18n } from "@/lib/i18n";

type Modal = "forceLogout" | "status" | "reset" | null;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{value ?? "—"}</span>
    </div>
  );
}

export default function ProfileTab({ userId, user }: { userId: string; user: UserDetail }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const refetch = useRefetchUser(userId);
  const [modal, setModal] = useState<Modal>(null);
  const close = () => setModal(null);

  return (
    <div className="space-y-5">
      <Card
        title={t("users.profile.overview")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setModal("reset")}>
              {t("users.action.resetPassword")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setModal("forceLogout")}>
              {t("users.action.forceLogout")}
            </Button>
            <Button
              size="sm"
              variant={user.isActive ? "danger" : "primary"}
              onClick={() => setModal("status")}
            >
              {t(user.isActive ? "users.action.deactivate" : "users.action.activate")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <Row label={t("profile.field.firstName")} value={user.firstName} />
          <Row label={t("profile.field.lastName")} value={user.lastName} />
          <Row label={t("profile.field.email")} value={<span dir="ltr">{user.email ?? "—"}</span>} />
          <Row label={t("profile.field.phone")} value={<span dir="ltr">{user.phone ?? "—"}</span>} />
          <Row label={t("users.col.role")} value={<RoleText role={user.role} />} />
          <Row label={t("users.col.status")} value={<StatusBadge user={user} />} />
          <Row label={t("users.col.verification")} value={<VerificationCell user={user} />} />
          <Row label={t("users.col.registered")} value={<DateText value={user.createdAt} />} />
        </div>
      </Card>

      {modal === "reset" && <ResetPasswordModal userId={userId} onClose={close} />}

      {modal === "forceLogout" && (
        <ConfirmDialog
          title={t("users.forceLogout.title")}
          message={t("users.forceLogout.confirm")}
          confirmLabel={t("users.action.forceLogout")}
          onConfirm={async () => {
            await usersService.forceLogout(userId);
            toast(t("users.toast.forcedLogout"));
            close();
          }}
          onClose={close}
        />
      )}

      {modal === "status" && (
        <ConfirmDialog
          title={t(user.isActive ? "users.deactivate.title" : "users.activate.title")}
          message={t(user.isActive ? "users.deactivate.confirm" : "users.activate.confirm")}
          confirmLabel={t(user.isActive ? "users.action.deactivate" : "users.action.activate")}
          danger={user.isActive}
          onConfirm={async () => {
            await usersService.setStatus(userId, !user.isActive);
            await refetch();
            toast(t("users.toast.statusUpdated"));
            close();
          }}
          onClose={close}
        />
      )}
    </div>
  );
}
