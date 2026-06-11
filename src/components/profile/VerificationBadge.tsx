import Badge from "@/components/ui/badge/Badge";
import { useI18n } from "@/lib/i18n";

const CheckIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M11.667 3.5 5.25 9.917 2.333 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WarnIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 4.667v2.625M7 9.333h.006M7 1.75 1.167 12.25h11.666L7 1.75Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Verified/unverified chip — never color-only: carries a check or warning icon too. */
export default function VerificationBadge({ verified }: { verified: boolean }) {
  const { t } = useI18n();
  return verified ? (
    <Badge color="success" startIcon={CheckIcon}>
      {t("profile.verified")}
    </Badge>
  ) : (
    <Badge color="warning" startIcon={WarnIcon}>
      {t("profile.unverified")}
    </Badge>
  );
}
