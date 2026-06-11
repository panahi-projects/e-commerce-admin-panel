"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ProfileModal from "../ProfileModal";
import { useToast } from "../ToastProvider";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import { ApiException } from "@/lib/api";
import { profileService, useRefetchProfile, type Address, type AddressInput } from "@/lib/profile";
import { useI18n } from "@/lib/i18n";

const COUNTRY_OPTIONS = [
  { value: "ir", label: "Iran" },
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "ae", label: "United Arab Emirates" },
  { value: "tr", label: "Türkiye" },
  { value: "ca", label: "Canada" },
];

const emptyAddress: AddressInput = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  fullAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "ir",
  isDefault: false,
};

// Fields the user may leave blank. Sending "" trips the backend's min-length rules,
// so they're trimmed and dropped from the payload when empty.
const OPTIONAL_KEYS = ["phone", "line1", "line2"] as const;

function buildPayload(form: AddressInput): AddressInput {
  const out: AddressInput = { ...form };
  (Object.keys(out) as (keyof AddressInput)[]).forEach((k) => {
    const v = out[k];
    if (typeof v === "string") (out as Record<string, unknown>)[k] = v.trim();
  });
  for (const k of OPTIONAL_KEYS) {
    if (!out[k]) delete out[k];
  }
  return out;
}

export default function AddressFormModal({
  address,
  onClose,
}: {
  /** Present → edit mode; absent → add mode. */
  address?: Address;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const refetch = useRefetchProfile();
  const isEdit = Boolean(address);

  const [form, setForm] = useState<AddressInput>(
    address ? { ...emptyAddress, ...address } : emptyAddress,
  );
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof AddressInput>(k: K, v: AddressInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = buildPayload(form);
      return isEdit && address
        ? profileService.updateAddress(address._id, payload)
        : profileService.createAddress(payload);
    },
    onSuccess: async () => {
      await refetch();
      toast(t(isEdit ? "profile.toast.addressUpdated" : "profile.toast.addressAdded"));
      onClose();
    },
    onError: (e) =>
      setError(e instanceof ApiException ? e.message : t("common.somethingWrong")),
  });

  const required = [form.label, form.fullName, form.fullAddress, form.city, form.state, form.postalCode, form.country];
  const valid = required.every((v) => v.trim());

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
      title={t(isEdit ? "profile.address.editTitle" : "profile.address.addTitle")}
      submitLabel={t("common.save")}
      submitting={mutation.isPending}
      submitDisabled={!valid}
      error={error}
      onSubmit={submit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="addr-label">{t("profile.addressField.label")}</Label>
          <Input id="addr-label" defaultValue={form.label} onChange={(e) => set("label", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="addr-fullName">{t("profile.addressField.fullName")}</Label>
          <Input id="addr-fullName" defaultValue={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="addr-phone">
            {t("profile.field.phone")} <span className="text-gray-400">({t("common.optional")})</span>
          </Label>
          <Input id="addr-phone" defaultValue={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="addr-line1">{t("profile.addressField.line1")}</Label>
          <Input id="addr-line1" defaultValue={form.line1} onChange={(e) => set("line1", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="addr-line2">
            {t("profile.addressField.line2")} <span className="text-gray-400">({t("common.optional")})</span>
          </Label>
          <Input id="addr-line2" defaultValue={form.line2} onChange={(e) => set("line2", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="addr-fullAddress">{t("profile.addressField.fullAddress")}</Label>
          <Input id="addr-fullAddress" defaultValue={form.fullAddress} onChange={(e) => set("fullAddress", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="addr-city">{t("profile.addressField.city")}</Label>
          <Input id="addr-city" defaultValue={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="addr-state">{t("profile.addressField.state")}</Label>
          <Input id="addr-state" defaultValue={form.state} onChange={(e) => set("state", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="addr-postal">{t("profile.addressField.postalCode")}</Label>
          <Input id="addr-postal" defaultValue={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="addr-country">{t("profile.addressField.country")}</Label>
          <Select
            options={COUNTRY_OPTIONS}
            defaultValue={form.country}
            onChange={(v) => set("country", v)}
          />
        </div>
      </div>
      <div className="pt-1">
        <Checkbox
          label={t("profile.addressField.isDefault")}
          checked={form.isDefault}
          onChange={(v) => set("isDefault", v)}
        />
      </div>
    </ProfileModal>
  );
}
