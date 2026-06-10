"use client";

import { apiList } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function AuditLogsPage() {
  return (
    <div>
      <PageHeading title="Audit logs" subtitle="Security event log (auditLogs plugin)." />
      <EndpointPreview
        title="Audit log"
        endpoint="GET /audit-logs"
        queryKey={["audit-logs", "list"]}
        fetcher={() => apiList({ method: "GET", url: "/audit-logs", params: { limit: 20 } })}
      />
    </div>
  );
}
