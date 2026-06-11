import AdminLoginForm from "@/components/auth/AdminLoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Admin Panel",
  description: "Admin panel sign in",
};

export default function LoginPage() {
  return <AdminLoginForm />;
}
