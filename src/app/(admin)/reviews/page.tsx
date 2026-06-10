"use client";

import PageHeading from "@/components/common/PageHeading";

export default function ReviewsPage() {
  return (
    <div>
      <PageHeading title="Reviews" subtitle="Moderation queue (reviews plugin)." />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
        <p>
          Moderation acts on individual reviews via{" "}
          <code className="rounded bg-gray-100 px-1 dark:bg-white/[0.06]">PATCH /reviews/:id</code>{" "}
          (approve / reject) and{" "}
          <code className="rounded bg-gray-100 px-1 dark:bg-white/[0.06]">DELETE /reviews/:id</code>.
        </p>
        <p className="mt-2">
          There is no dedicated admin list endpoint; the pending-reviews queue is built later from the
          per-product listing (<code className="rounded bg-gray-100 px-1 dark:bg-white/[0.06]">GET /products/:productId/reviews</code>).
        </p>
      </div>
    </div>
  );
}
