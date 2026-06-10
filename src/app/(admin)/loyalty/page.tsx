"use client";

import { apiList } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function LoyaltyPage() {
  return (
    <div>
      <PageHeading title="Loyalty" subtitle="Loyalty point accounts (loyaltyPoints plugin)." />
      <EndpointPreview
        title="Loyalty accounts"
        endpoint="GET /loyalty/admin/accounts"
        queryKey={["loyalty", "accounts"]}
        fetcher={() => apiList({ method: "GET", url: "/loyalty/admin/accounts", params: { limit: 20 } })}
      />
    </div>
  );
}
