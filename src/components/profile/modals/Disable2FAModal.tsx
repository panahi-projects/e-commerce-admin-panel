"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ProfileModal from "../ProfileModal";
import { useToast } from "../ToastProvider";
import { ApiException } from "@/lib/api";
import { authService } from "@/lib/auth";
import { useRefetchProfile } from "@/lib/profile";
import { useI18n } from "@/lib/i18n";

export default function Disable2FAModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const refetch = useRefetchProfile();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => authService.disable2FA(), // no request body
    onSuccess: async () => {
      await refetch();
      toast(t("profile.toast.twofaDisabled"));
      onClose();
    },
    onError: (e) =>
      setError(e instanceof ApiException ? e.message : t("common.somethingWrong")),
  });

  return (
    <ProfileModal
      isOpen
      onClose={onClose}
      title={t("profile.disable2fa.title")}
      submitLabel={t("profile.security.disable")}
      submitting={mutation.isPending}
      danger
      error={error}
      onSubmit={() => {
        setError(null);
        mutation.mutate();
      }}
    >
      <div className="rounded-lg border border-warning-300 bg-warning-50 p-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
        {t("profile.disable2fa.warning")}
      </div>
    </ProfileModal>
  );
}
