"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { authService } from "@/lib/auth";
import { ApiException } from "@/lib/api";

/** Password policy mirrors the server (§5.5): ≥8 chars, ≥1 uppercase, ≥1 digit, ≥1 special. */
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must include an uppercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must include a digit.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Password must include a special character.";
  return null;
}

export default function AcceptInviteForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwError = validatePassword(newPassword);
    if (pwError) return setError(pwError);
    if (newPassword !== confirm) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      await authService.resetPassword({
        identifier: identifier.trim(),
        code: code.trim(),
        newPassword,
      });
      router.replace("/login?invited=1");
    } catch (err) {
      setError(err instanceof ApiException ? err.message : "Could not set your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Set your password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the one-time code from your invite and choose a password.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>
              Email or mobile <span className="text-error-500">*</span>
            </Label>
            <Input
              placeholder="you@example.com or 0912…"
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div>
            <Label>
              Invite code <span className="text-error-500">*</span>
            </Label>
            <Input placeholder="One-time code" onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <Label>
              New password <span className="text-error-500">*</span>
            </Label>
            <Input
              type="password"
              placeholder="At least 8 chars, 1 uppercase, 1 digit, 1 special"
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>
              Confirm password <span className="text-error-500">*</span>
            </Label>
            <Input
              type="password"
              placeholder="Re-enter your password"
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Set password & continue"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-center text-gray-600 dark:text-gray-400">
          Already have access?{" "}
          <Link href="/login" className="text-brand-500 hover:text-brand-600">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
