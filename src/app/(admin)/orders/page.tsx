"use client";

import { apiList } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function OrdersPage() {
  return (
    <div>
      <PageHeading title="Orders" subtitle="All orders for the active tenant." />
      <EndpointPreview
        title="Orders list"
        endpoint="GET /orders"
        queryKey={["orders", "list"]}
        fetcher={() => apiList({ method: "GET", url: "/orders", params: { limit: 20 } })}
      />
    </div>
  );
}
