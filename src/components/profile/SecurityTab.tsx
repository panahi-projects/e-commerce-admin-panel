"use client";

import { useState } from "react";
import Card from "./Card";
import ChangePasswordModal from "./modals/ChangePasswordModal";
import SetPasswordModal from "./modals/SetPasswordModal";
import ForgotPasswordModal from "./modals/ForgotPasswordModal";
import Enable2FAModal from "./modals/Enable2FAModal";
import Disable2FAModal from "./modals/Disable2FAModal";
import ConfirmDialog from "./modals/ConfirmDialog";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Profile } from "@/lib/profile";

type SecurityModal =
  | "change"
  | "set"
  | "forgot"
  | "enable2fa"
  | "disable2fa"
  | "logout"
  | "logoutAll"
  | null;

function ActionRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-white/90">{title}</p>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export default function SecurityTab({ profile }: { profile: Profile }) {
  const { t, locale } = useI18n();
  const { logout, logoutAll } = useAuth();
  const [modal, setModal] = useState<SecurityModal>(null);
  const close = () => setModal(null);

  const lastChanged = profile.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US")
    : "—";

  return (
    <div className="space-y-5">
      <Card title={t("profile.security.title")}>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <ActionRow
            title={t("profile.security.password")}
            description={t("profile.security.passwordDesc").replace("{date}", lastChanged)}
          >
            <Button size="sm" variant="outline" onClick={() => setModal("change")}>
              {t("profile.security.change")}
            </Button>
          </ActionRow>

          <ActionRow
            title={t("profile.security.setPassword")}
            description={t("profile.security.setPasswordDesc")}
          >
            <Button size="sm" variant="outline" onClick={() => setModal("set")}>
              {t("profile.security.setPassword")}
            </Button>
          </ActionRow>

          <ActionRow
            title={t("profile.security.twofa")}
            description={t("profile.security.twofaDesc")}
          >
            <Badge color={profile.isTwoFactorEnabled ? "success" : "light"} size="sm">
              {t(profile.isTwoFactorEnabled ? "profile.security.enabled" : "profile.security.disabled")}
            </Badge>
            {profile.isTwoFactorEnabled ? (
              <Button size="sm" variant="danger" onClick={() => setModal("disable2fa")}>
                {t("profile.security.disable")}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setModal("enable2fa")}>
                {t("profile.security.enable")}
              </Button>
            )}
          </ActionRow>
        </div>
      </Card>

      <Card title={t("profile.danger.title")}>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <ActionRow
            title={t("profile.danger.logoutDevice")}
            description={t("profile.danger.logoutDeviceDesc")}
          >
            <Button size="sm" variant="outline" onClick={() => setModal("logout")}>
              {t("profile.danger.logoutDevice")}
            </Button>
          </ActionRow>
          <ActionRow
            title={t("profile.danger.logoutAll")}
            description={t("profile.danger.logoutAllDesc")}
          >
            <Button size="sm" variant="danger" onClick={() => setModal("logoutAll")}>
              {t("profile.danger.logoutAll")}
            </Button>
          </ActionRow>
        </div>
      </Card>

      {modal === "change" && (
        <ChangePasswordModal onClose={close} onForgot={() => setModal("forgot")} />
      )}
      {modal === "set" && <SetPasswordModal onClose={close} />}
      {modal === "forgot" && (
        <ForgotPasswordModal defaultIdentifier={profile.email} onClose={close} />
      )}
      {modal === "enable2fa" && <Enable2FAModal onClose={close} />}
      {modal === "disable2fa" && <Disable2FAModal onClose={close} />}
      {modal === "logout" && (
        <ConfirmDialog
          title={t("profile.logout.title")}
          message={t("profile.logout.confirm")}
          confirmLabel={t("common.logout")}
          onConfirm={() => logout()}
          onClose={close}
        />
      )}
      {modal === "logoutAll" && (
        <ConfirmDialog
          title={t("profile.logoutAll.title")}
          message={t("profile.logoutAll.confirm")}
          confirmLabel={t("profile.danger.logoutAll")}
          onConfirm={() => logoutAll()}
          onClose={close}
        />
      )}
    </div>
  );
}
