"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useAuth, authService } from "@/lib/auth";
import { ApiException } from "@/lib/api";

type Mode = "password" | "otp";

export default function AdminLoginForm() {
  const router = useRouter();
  const { login, status, authNotice } = useAuth();

  const [mode, setMode] = useState<Mode>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Already authenticated → leave the login screen.
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  const requestCode = async () => {
    setError(null);
    setInfo(null);
    if (!identifier.trim()) {
      setError("Enter your email or mobile number first.");
      return;
    }
    setSendingOtp(true);
    try {
      await authService.requestOtp(identifier.trim());
      setOtpSent(true);
      setInfo("A one-time code has been sent.");
    } catch (err) {
      setError(err instanceof ApiException ? err.message : "Could not send the code.");
    } finally {
      setSendingOtp(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({
        identifier: identifier.trim(),
        password: mode === "password" ? password : undefined,
        // Code is allowed in password mode too, for 2FA accounts (§5.3).
        code: code.trim() || undefined,
      });
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiException ? err.message : "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Admin sign in
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in with your email or mobile number.
          </p>
        </div>

        {/* Mode switch */}
        <div className="mb-5 inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-800">
          {(["password", "otp"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                mode === m
                  ? "bg-brand-500 text-white"
                  : "text-gray-600 hover:text-gray-800 dark:text-gray-400"
              }`}
            >
              {m === "password" ? "Password" : "One-time code"}
            </button>
          ))}
        </div>

        {authNotice === "inactive" && (
          <div className="mb-4 rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            Your account is inactive. Contact an administrator.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg border border-success-300 bg-success-50 p-3 text-sm text-success-600 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
            {info}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>
              Email or mobile <span className="text-error-500">*</span>
            </Label>
            <Input
              placeholder="you@example.com or 0912…"
              defaultValue={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          {mode === "password" && (
            <>
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <Label>Authentication code</Label>
                <Input
                  placeholder="2FA code (only if enabled)"
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </>
          )}

          {mode === "otp" && (
            <div>
              <Label>
                One-time code <span className="text-error-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input placeholder="6-digit code" onChange={(e) => setCode(e.target.value)} />
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={sendingOtp}
                  className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700"
                >
                  {sendingOtp ? "Sending…" : otpSent ? "Resend" : "Send code"}
                </button>
              </div>
            </div>
          )}

          <Button className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-center text-gray-600 dark:text-gray-400">
          Have an invite code?{" "}
          <Link href="/accept-invite" className="text-brand-500 hover:text-brand-600">
            Set your password
          </Link>
        </p>
      </div>
    </div>
  );
}
