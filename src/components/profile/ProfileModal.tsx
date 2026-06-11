"use client";

import { useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useI18n } from "@/lib/i18n";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Submit handler; return value ignored. Prevent-default is done for you. */
  onSubmit: () => void;
  submitLabel: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  /** Server/inline error shown near the submit button. */
  error?: string | null;
  /** Renders the confirm/submit button in the danger variant. */
  danger?: boolean;
  children: React.ReactNode;
}

/**
 * Shared shell for every profile modal: a <form> body, an inline error message
 * by the submit button, a loading-aware submit, and focus trap + restore.
 */
export default function ProfileModal({
  isOpen,
  onClose,
  title,
  onSubmit,
  submitLabel,
  submitting = false,
  submitDisabled = false,
  error,
  danger = false,
  children,
}: ProfileModalProps) {
  const { t } = useI18n();
  const contentRef = useRef<HTMLFormElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Focus trap + restore: remember the trigger, focus the first field on open,
  // keep Tab within the dialog, and restore focus to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;
    restoreRef.current = (document.activeElement as HTMLElement) ?? null;
    const node = contentRef.current;
    const focusables = node?.querySelectorAll<HTMLElement>(
      'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !focusables || focusables.length === 0) return;
      const list = Array.from(focusables).filter((el) => !el.hasAttribute("disabled"));
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreRef.current?.focus?.();
    };
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="m-4 max-w-[520px] p-6 sm:p-7"
    >
      <form
        ref={contentRef}
        onSubmit={(e) => {
          e.preventDefault();
          if (!submitting && !submitDisabled) onSubmit();
        }}
      >
        <h2 className="mb-5 pe-8 text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h2>

        <div className="space-y-4">{children}</div>

        {error && (
          <div className="mt-4 rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            variant={danger ? "danger" : "primary"}
            disabled={submitting || submitDisabled}
          >
            {submitting ? t("common.saving") : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
