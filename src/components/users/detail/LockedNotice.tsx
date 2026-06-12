import Card from "@/components/profile/Card";

/** Friendly empty/locked state for 403 "plugin not enabled" and similar. */
export default function LockedNotice({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/[0.06]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </span>
        <p className="text-base font-medium text-gray-700 dark:text-gray-300">{title}</p>
        {hint && <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    </Card>
  );
}
