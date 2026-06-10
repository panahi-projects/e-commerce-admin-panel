"use client";

import { useI18n, LOCALES } from '@/lib/i18n';

/** Switches UI locale + text direction and the `x-lang` request header (§7). */
export default function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const next = locale === 'en' ? 'fa' : 'en';
  const nextLabel = LOCALES.find((l) => l.code === next)?.label ?? next;

  return (
    <button
      onClick={() => setLocale(next)}
      aria-label={t('common.language')}
      title={t('common.language')}
      className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
    >
      {nextLabel}
    </button>
  );
}
