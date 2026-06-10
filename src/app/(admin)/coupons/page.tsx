"use client";

import { apiList } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function CouponsPage() {
  return (
    <div>
      <PageHeading title="Coupons" subtitle="Discount coupons (coupons plugin)." />
      <EndpointPreview
        title="Coupons list"
        endpoint="GET /coupons"
        queryKey={["coupons", "list"]}
        fetcher={() => apiList({ method: "GET", url: "/coupons", params: { limit: 20 } })}
      />
    </div>
  );
}
