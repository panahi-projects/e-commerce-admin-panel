"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Card from "./Card";
import AddressFormModal from "./modals/AddressFormModal";
import ConfirmDialog from "./modals/ConfirmDialog";
import { useToast } from "./ToastProvider";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { ApiException } from "@/lib/api";
import { profileService, useRefetchProfile, type Address, type Profile } from "@/lib/profile";
import { useI18n } from "@/lib/i18n";

export default function AddressesTab({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const refetch = useRefetchProfile();
  const addresses = profile.addresses ?? [];

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);

  const setDefault = useMutation({
    mutationFn: (id: string) => profileService.updateAddress(id, { isDefault: true }),
    onSuccess: async () => {
      await refetch();
      toast(t("profile.toast.defaultSet"));
    },
    onError: () => toast(t("common.somethingWrong"), "error"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("profile.addresses.title")}
        </h2>
        <Button size="sm" onClick={() => setAdding(true)}>
          {t("profile.addresses.add")}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              {t("profile.addresses.empty")}
            </p>
            <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
              {t("profile.addresses.emptyHint")}
            </p>
            <Button size="sm" className="mt-2" onClick={() => setAdding(true)}>
              {t("profile.addresses.add")}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`rounded-2xl border p-5 ${
                addr.isDefault
                  ? "border-brand-300 bg-brand-50/40 dark:border-brand-500/40 dark:bg-brand-500/10"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{addr.label}</h3>
                {addr.isDefault && <Badge color="primary" size="sm">{t("profile.address.default")}</Badge>}
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{addr.fullName}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{addr.fullAddress}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {[addr.city, addr.state, addr.postalCode, addr.country?.toUpperCase()]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(addr)}>
                  {t("common.edit")}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleting(addr)}>
                  {t("common.delete")}
                </Button>
                {!addr.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={setDefault.isPending}
                    onClick={() => setDefault.mutate(addr._id)}
                  >
                    {t("profile.address.setDefault")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && <AddressFormModal onClose={() => setAdding(false)} />}
      {editing && <AddressFormModal address={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title={t("profile.address.deleteTitle")}
          // Guard: never delete the default address — require another default first.
          message={deleting.isDefault ? t("profile.address.cannotDeleteDefault") : t("profile.address.deleteConfirm")}
          confirmLabel={t("common.delete")}
          danger
          onConfirm={async () => {
            // Block deleting the default address — caller must set another default first.
            if (deleting.isDefault) {
              throw new ApiException(t("profile.address.cannotDeleteDefault"), 400);
            }
            await profileService.deleteAddress(deleting._id);
            await refetch();
            toast(t("profile.toast.addressDeleted"));
            setDeleting(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
