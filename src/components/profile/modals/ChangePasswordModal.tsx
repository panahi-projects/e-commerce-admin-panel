"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ProfileModal from "../ProfileModal";
import { useToast } from "../ToastProvider";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { ApiException } from "@/lib/api";
import { authService } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function ChangePasswordModal({
  onClose,
  onForgot,
}: {
  onClose: () => void;
  onForgot: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    // Only `currentPassword` + `newPassword` are sent — `confirmNewPassword` is client-only.
    mutationFn: () => authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast(t("profile.toast.passwordChanged"));
      onClose();
    },
    onError: (e) =>
      setError(e instanceof ApiException ? e.message : t("common.somethingWrong")),
  });

  const valid = currentPassword && newPassword && confirmNewPassword;

  const submit = () => {
    setError(null);
    if (!valid) {
      setError(t("profile.validation.required"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(t("profile.validation.passwordMismatch"));
      return;
    }
    mutation.mutate();
  };

  return (
    <ProfileModal
      isOpen
      onClose={onClose}
      title={t("profile.changePassword.title")}
      submitLabel={t("common.save")}
      submitting={mutation.isPending}
      error={error}
      onSubmit={submit}
    >
      <div>
        <Label htmlFor="cp-current">{t("profile.password.current")}</Label>
        <Input id="cp-current" type="password" onChange={(e) => setCurrentPassword(e.target.value)} />
        <button
          type="button"
          onClick={onForgot}
          className="mt-1.5 text-sm text-brand-500 hover:text-brand-600"
        >
          {t("profile.security.forgot")}
        </button>
      </div>
      <div>
        <Label htmlFor="cp-new">{t("profile.password.new")}</Label>
        <Input id="cp-new" type="password" onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="cp-confirm">{t("profile.password.confirm")}</Label>
        <Input id="cp-confirm" type="password" onChange={(e) => setConfirmNewPassword(e.target.value)} />
      </div>
    </ProfileModal>
  );
}
