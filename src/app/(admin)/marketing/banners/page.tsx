"use client";

import { apiList } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function BannersPage() {
  return (
    <div>
      <PageHeading title="Banners" subtitle="Storefront banners (marketing plugin)." />
      <EndpointPreview
        title="Banners list"
        endpoint="GET /banners"
        queryKey={["banners", "list"]}
        fetcher={() => apiList({ method: "GET", url: "/banners" })}
      />
    </div>
  );
}
