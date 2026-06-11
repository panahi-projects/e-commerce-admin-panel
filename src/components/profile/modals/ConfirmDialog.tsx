"use client";

import { useState } from "react";
import ProfileModal from "../ProfileModal";
import { ApiException } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

/**
 * Generic confirmation dialog for destructive actions (delete, logout, disable).
 * `onConfirm` runs the action; on success the caller closes the dialog.
 */
export default function ConfirmDialog({
  title,
  message,
  warning,
  confirmLabel,
  danger = true,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  warning?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof ApiException ? e.message : t("common.somethingWrong"));
      setSubmitting(false);
    }
  };

  return (
    <ProfileModal
      isOpen
      onClose={onClose}
      title={title}
      submitLabel={confirmLabel}
      submitting={submitting}
      danger={danger}
      error={error}
      onSubmit={run}
    >
      {warning && (
        <div className="rounded-lg border border-warning-300 bg-warning-50 p-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
          {warning}
        </div>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </ProfileModal>
  );
}
