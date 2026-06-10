"use client";

import { apiData } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function PermissionsPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeading
        title="Permissions"
        subtitle="Policy override rules. Empty by default — role defaults are computed in code (§10.14)."
      />
      <EndpointPreview
        title="Override rules"
        endpoint="GET /permissions"
        queryKey={["permissions", "rules"]}
        fetcher={() => apiData({ method: "GET", url: "/permissions" })}
      />
      <EndpointPreview
        title="Catalog (form metadata)"
        endpoint="GET /permissions/catalog"
        queryKey={["permissions", "catalog"]}
        fetcher={() => apiData({ method: "GET", url: "/permissions/catalog" })}
      />
    </div>
  );
}
