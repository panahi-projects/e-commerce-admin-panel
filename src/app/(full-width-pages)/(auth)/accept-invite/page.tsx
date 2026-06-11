import AcceptInviteForm from "@/components/auth/AcceptInviteForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set your password | Admin Panel",
  description: "Accept your admin invite and set a password",
};

export default function AcceptInvitePage() {
  return <AcceptInviteForm />;
}
