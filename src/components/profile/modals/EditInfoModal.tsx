"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ProfileModal from "../ProfileModal";
import { useToast } from "../ToastProvider";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { ApiException } from "@/lib/api";
import { profileService, useRefetchProfile, type Profile } from "@/lib/profile";
import { useI18n } from "@/lib/i18n";

export default function EditInfoModal({
  profile,
  onClose,
}: {
  profile: Profile;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const refetch = useRefetchProfile();

  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => profileService.update({ firstName, lastName, phone }),
    onSuccess: async () => {
      await refetch();
      toast(t("profile.toast.profileUpdated"));
      onClose();
    },
    onError: (e) =>
      setError(e instanceof ApiException ? e.message : t("common.somethingWrong")),
  });

  const valid = firstName.trim() && lastName.trim() && phone.trim();

  const submit = () => {
    setError(null);
    if (!valid) {
      setError(t("profile.validation.required"));
      return;
    }
    mutation.mutate();
  };

  return (
    <ProfileModal
      isOpen
      onClose={onClose}
      title={t("profile.editInfo.title")}
      submitLabel={t("common.save")}
      submitting={mutation.isPending}
      submitDisabled={!valid}
      error={error}
      onSubmit={submit}
    >
      <div>
        <Label htmlFor="edit-firstName">{t("profile.field.firstName")}</Label>
        <Input id="edit-firstName" defaultValue={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="edit-lastName">{t("profile.field.lastName")}</Label>
        <Input id="edit-lastName" defaultValue={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="edit-phone">{t("profile.field.phone")}</Label>
        <Input id="edit-phone" defaultValue={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
    </ProfileModal>
  );
}
