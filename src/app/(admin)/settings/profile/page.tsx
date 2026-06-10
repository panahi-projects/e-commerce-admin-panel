"use client";

import { apiData } from "@/lib/api";
import EndpointPreview from "@/components/common/EndpointPreview";
import PageHeading from "@/components/common/PageHeading";

export default function ProfilePage() {
  return (
    <div>
      <PageHeading title="Profile" subtitle="Your account. Password & 2FA management comes later." />
      <EndpointPreview
        title="Current user"
        endpoint="GET /auth/me"
        queryKey={["auth", "me"]}
        fetcher={() => apiData({ method: "GET", url: "/auth/me" })}
      />
    </div>
  );
}
