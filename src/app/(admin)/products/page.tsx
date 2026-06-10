"use client";

import { apiList } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function ProductsPage() {
  return (
    <div>
      <PageHeading title="Products" subtitle="Admin list including drafts and archived." />
      <EndpointPreview
        title="Products (admin)"
        endpoint="GET /products/admin/list"
        queryKey={["products", "admin-list"]}
        fetcher={() => apiList({ method: "GET", url: "/products/admin/list", params: { limit: 20 } })}
      />
    </div>
  );
}
