"use client";

import { apiList } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function InventoryPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeading title="Inventory" subtitle="Stock rows and low-stock alerts." />
      <EndpointPreview
        title="Stock rows"
        endpoint="GET /inventory"
        queryKey={["inventory", "list"]}
        fetcher={() => apiList({ method: "GET", url: "/inventory", params: { limit: 20 } })}
      />
      <EndpointPreview
        title="Low-stock alerts"
        endpoint="GET /inventory/alerts/low-stock"
        queryKey={["inventory", "low-stock"]}
        fetcher={() => apiList({ method: "GET", url: "/inventory/alerts/low-stock" })}
      />
    </div>
  );
}
