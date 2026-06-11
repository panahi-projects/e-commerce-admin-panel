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

export default function SetPasswordModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    // Only `newPassword` is sent — `confirmPassword` is client-only validation.
    mutationFn: () => authService.setPassword(newPassword),
    onSuccess: () => {
      toast(t("profile.toast.passwordSet"));
      onClose();
    },
    onError: (e) =>
      setError(e instanceof ApiException ? e.message : t("common.somethingWrong")),
  });

  const submit = () => {
    setError(null);
    if (!newPassword || !confirmPassword) {
      setError(t("profile.validation.required"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("profile.validation.passwordMismatch"));
      return;
    }
    mutation.mutate();
  };

  return (
    <ProfileModal
      isOpen
      onClose={onClose}
      title={t("profile.setPassword.title")}
      submitLabel={t("common.save")}
      submitting={mutation.isPending}
      error={error}
      onSubmit={submit}
    >
      <div>
        <Label htmlFor="sp-new">{t("profile.password.new")}</Label>
        <Input id="sp-new" type="password" onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="sp-confirm">{t("profile.password.confirm")}</Label>
        <Input id="sp-confirm" type="password" onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>
    </ProfileModal>
  );
}
