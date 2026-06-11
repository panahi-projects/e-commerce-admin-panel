"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ProfileModal from "../ProfileModal";
import { useToast } from "../ToastProvider";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { ApiException } from "@/lib/api";
import { authService } from "@/lib/auth";
import { useRefetchProfile } from "@/lib/profile";
import { useI18n } from "@/lib/i18n";

/** Email-OTP 2FA enablement (no TOTP/QR): step 1 sends a code, step 2 confirms it. */
export default function Enable2FAModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const refetch = useRefetchProfile();

  const [step, setStep] = useState<"intro" | "code">("intro");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const enable = useMutation({
    mutationFn: () => authService.enable2FA("email"),
    onSuccess: () => setStep("code"),
    onError: (e) =>
      setError(e instanceof ApiException ? e.message : t("common.somethingWrong")),
  });

  const confirm = useMutation({
    mutationFn: () => authService.confirm2FA(code.trim()),
    onSuccess: async () => {
      await refetch();
      toast(t("profile.toast.twofaEnabled"));
      onClose();
    },
    onError: (e) =>
      setError(e instanceof ApiException ? e.message : t("common.somethingWrong")),
  });

  const submit = () => {
    setError(null);
    if (step === "intro") {
      enable.mutate();
      return;
    }
    if (!code.trim()) {
      setError(t("profile.validation.required"));
      return;
    }
    confirm.mutate();
  };

  return (
    <ProfileModal
      isOpen
      onClose={onClose}
      title={t("profile.enable2fa.title")}
      submitLabel={step === "intro" ? t("profile.enable2fa.send") : t("profile.enable2fa.confirm")}
      submitting={enable.isPending || confirm.isPending}
      submitDisabled={step === "code" && !code.trim()}
      error={error}
      onSubmit={submit}
    >
      {step === "intro" ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("profile.enable2fa.intro")}</p>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-success-300 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
            {t("profile.enable2fa.sent")}
          </div>
          <div>
            <Label htmlFor="tfa-code">{t("profile.enable2fa.code")}</Label>
            <Input
              id="tfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>
      )}
    </ProfileModal>
  );
}
