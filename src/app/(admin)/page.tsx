"use client";

import { apiData } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function DashboardPage() {
  return (
    <div>
      <PageHeading title="Dashboard" subtitle="KPI overview from the analytics plugin." />
      <EndpointPreview
        title="KPI counters"
        endpoint="GET /analytics/dashboard"
        queryKey={["analytics", "dashboard"]}
        fetcher={() => apiData({ method: "GET", url: "/analytics/dashboard" })}
      />
    </div>
  );
}
