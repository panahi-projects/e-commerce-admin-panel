"use client";

import { apiData } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function CategoriesPage() {
  return (
    <div>
      <PageHeading title="Categories" subtitle="Category tree for the active tenant." />
      <EndpointPreview
        title="Category tree"
        endpoint="GET /categories/tree"
        queryKey={["categories", "tree"]}
        fetcher={() => apiData({ method: "GET", url: "/categories/tree" })}
      />
    </div>
  );
}
