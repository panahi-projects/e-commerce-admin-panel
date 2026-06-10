"use client";

import { apiList } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function TenantsPage() {
  return (
    <div>
      <PageHeading title="Tenants" subtitle="Platform tenants (super_admin only)." />
      <EndpointPreview
        title="Tenants list"
        endpoint="GET /admin/tenants"
        queryKey={["admin", "tenants", "list"]}
        fetcher={() => apiList({ method: "GET", url: "/admin/tenants", params: { limit: 50 } })}
      />
    </div>
  );
}
