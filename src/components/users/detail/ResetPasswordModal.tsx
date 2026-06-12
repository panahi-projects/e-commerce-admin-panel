"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ProfileModal from "@/components/profile/ProfileModal";
import { useToast } from "@/components/profile/ToastProvider";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import { ApiException } from "@/lib/api";
import { usersService } from "@/lib/users";
import { useI18n } from "@/lib/i18n";

export default function ResetPasswordModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();

  const [generate, setGenerate] = useState(false);
  const [notify, setNotify] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      usersService.resetPassword(userId, {
        // Only send a manual password when not auto-generating.
        newPassword: generate ? undefined : newPassword,
        generate,
        notify,
      }),
    onSuccess: (data) => {
      toast(t("users.toast.passwordReset"));
      if (generate && data?.password) setGenerated(data.password);
      else onClose();
    },
    onError: (e) => setError(e instanceof ApiException ? e.message : t("common.somethingWrong")),
  });

  if (generated) {
    return (
      <ProfileModal
        isOpen
        onClose={onClose}
        title={t("users.reset.title")}
        submitLabel={t("common.close")}
        onSubmit={onClose}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("users.reset.generatedNote")}</p>
        <code className="block select-all rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800 dark:bg-white/[0.06] dark:text-white/90" dir="ltr">
          {generated}
        </code>
      </ProfileModal>
    );
  }

  return (
    <ProfileModal
      isOpen
      onClose={onClose}
      title={t("users.reset.title")}
      submitLabel={t("users.action.resetPassword")}
      submitting={mutation.isPending}
      error={error}
      onSubmit={() => {
        setError(null);
        if (!generate && !newPassword) {
          setError(t("profile.validation.required"));
          return;
        }
        mutation.mutate();
      }}
    >
      <Checkbox label={t("users.reset.generate")} checked={generate} onChange={setGenerate} />
      {!generate && (
        <div>
          <Label htmlFor="reset-pw">{t("users.reset.newPassword")}</Label>
          <Input id="reset-pw" type="password" onChange={(e) => setNewPassword(e.target.value)} />
        </div>
      )}
      <Checkbox label={t("users.reset.notify")} checked={notify} onChange={setNotify} />
    </ProfileModal>
  );
}
