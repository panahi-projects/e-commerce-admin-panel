"use client";

import PageHeading from "@/components/common/PageHeading";

export default function NotificationsPage() {
  return (
    <div>
      <PageHeading title="Notifications" subtitle="Send email / SMS / push (notifications plugin)." />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
        <p>This section is send-only — there is no list endpoint. Composer forms are built later for:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><code className="rounded bg-gray-100 px-1 dark:bg-white/[0.06]">POST /notifications/email</code></li>
          <li><code className="rounded bg-gray-100 px-1 dark:bg-white/[0.06]">POST /notifications/sms</code></li>
          <li><code className="rounded bg-gray-100 px-1 dark:bg-white/[0.06]">POST /notifications/push</code></li>
          <li><code className="rounded bg-gray-100 px-1 dark:bg-white/[0.06]">POST /notifications/sms/bulk</code> (≤1000 recipients)</li>
        </ul>
      </div>
    </div>
  );
}
