"use client";

import { apiList } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function CustomersPage() {
  return (
    <div>
      <PageHeading title="Customers" subtitle="Hierarchy-scoped user list (§8.2)." />
      <EndpointPreview
        title="Users"
        endpoint="GET /users"
        queryKey={["users", "list"]}
        fetcher={() => apiList({ method: "GET", url: "/users", params: { limit: 20 } })}
      />
    </div>
  );
}
