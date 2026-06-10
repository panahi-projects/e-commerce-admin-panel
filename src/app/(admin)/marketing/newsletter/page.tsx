"use client";

import { apiList } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function NewsletterPage() {
  return (
    <div>
      <PageHeading title="Newsletter" subtitle="Subscribers + SMS broadcast (marketing plugin)." />
      <EndpointPreview
        title="Subscribers"
        endpoint="GET /newsletter/subscribers"
        queryKey={["newsletter", "subscribers"]}
        fetcher={() => apiList({ method: "GET", url: "/newsletter/subscribers", params: { limit: 20 } })}
      />
    </div>
  );
}
