"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ProfileModal from "../ProfileModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { ApiException } from "@/lib/api";
import { authService } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordModal({
  defaultIdentifier = "",
  onClose,
}: {
  defaultIdentifier?: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    // No Authorization header required; field is `identifier`, not `email`.
    mutationFn: () => authService.forgotPassword(identifier.trim()),
    onSuccess: () => setSent(true),
    onError: (e) =>
      setError(e instanceof ApiException ? e.message : t("common.somethingWrong")),
  });

  const submit = () => {
    setError(null);
    if (!identifier.trim()) {
      setError(t("profile.validation.required"));
      return;
    }
    mutation.mutate();
  };

  return (
    <ProfileModal
      isOpen
      onClose={onClose}
      title={t("profile.forgot.title")}
      submitLabel={t("profile.enable2fa.send")}
      submitting={mutation.isPending}
      submitDisabled={sent}
      error={error}
      onSubmit={submit}
    >
      {sent ? (
        <div className="rounded-lg border border-success-300 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
          {t("profile.forgot.sent")}
        </div>
      ) : (
        <div>
          <Label htmlFor="fp-identifier">{t("profile.forgot.identifier")}</Label>
          <Input
            id="fp-identifier"
            defaultValue={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>
      )}
    </ProfileModal>
  );
}
