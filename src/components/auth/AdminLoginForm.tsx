"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { useAuth, authService, type AdminLoginOptions } from "@/lib/auth";
import { ApiException } from "@/lib/api";

type Step = "identifier" | "credentials";

export default function AdminLoginForm() {
  const router = useRouter();
  const { login, status, authNotice } = useAuth();

  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [options, setOptions] = useState<AdminLoginOptions | null>(null);

  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; code?: string }>({});

  // Already authenticated → leave the login screen.
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  const otpTarget = (o: AdminLoginOptions): string | null => {
    if (o.otpSent.mobile || o.channel === "phone") return "your mobile";
    if (o.otpSent.email || o.channel === "email") return "your email";
    return null;
  };

  // Step 1 — probe how this account signs in (this also auto-sends the OTP).
  const checkOptions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!identifier.trim()) {
      setError("Enter your email or mobile number.");
      return;
    }
    setBusy(true);
    try {
      const opts = await authService.loginOptions(identifier.trim());
      setOptions(opts);
      setPassword("");
      setCode("");
      setFieldErrors({});
      setStep("credentials");
      if (opts.otpRequired) {
        const target = otpTarget(opts);
        setInfo(target ? `We sent a one-time code to ${target}.` : "A one-time code has been sent.");
      }
    } catch (err) {
      setError(err instanceof ApiException ? err.message : "Could not check this account.");
    } finally {
      setBusy(false);
    }
  };

  // Step 2 — submit the required factors.
  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!options) return;
    setError(null);

    // Required-factor validation — the backend dictates which fields are mandatory.
    const errors: { password?: string; code?: string } = {};
    if (options.passwordRequired && !password) errors.password = "Password is required.";
    if (options.otpRequired && !code.trim()) errors.code = "The one-time code is required.";
    setFieldErrors(errors);
    if (errors.password || errors.code) return;

    setBusy(true);
    try {
      await login({
        identifier: identifier.trim(),
        password: options.passwordRequired ? password : undefined,
        code: options.otpRequired ? code.trim() : undefined,
      });
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiException ? err.message : "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await authService.requestOtp(identifier.trim());
      setInfo("A new code has been sent.");
    } catch (err) {
      setError(err instanceof ApiException ? err.message : "Could not resend the code.");
    } finally {
      setResending(false);
    }
  };

  const backToIdentifier = () => {
    setStep("identifier");
    setOptions(null);
    setError(null);
    setInfo(null);
    setFieldErrors({});
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Admin sign in
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {step === "identifier"
              ? "Enter your email or mobile number to continue."
              : "Confirm your identity to finish signing in."}
          </p>
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

        {step === "identifier" && (
          <form onSubmit={checkOptions} className="space-y-5">
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
            <Button className="w-full" disabled={busy}>
              {busy ? "Checking…" : "Continue"}
            </Button>
          </form>
        )}

        {step === "credentials" && options && (
          <form onSubmit={submitLogin} className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5 dark:border-gray-800">
              <span className="text-sm text-gray-700 dark:text-gray-300">{identifier}</span>
              <button
                type="button"
                onClick={backToIdentifier}
                className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600"
              >
                <ChevronLeftIcon /> Change
              </button>
            </div>

            {options.passwordRequired && (
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    error={!!fieldErrors.password}
                    hint={fieldErrors.password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
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
            )}

            {options.otpRequired && (
              <div>
                <Label>
                  One-time code <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="6-digit code"
                  error={!!fieldErrors.code}
                  hint={fieldErrors.code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (fieldErrors.code) setFieldErrors((p) => ({ ...p, code: undefined }));
                  }}
                />
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resending}
                  className="mt-2 text-sm text-brand-500 hover:text-brand-600 disabled:opacity-50"
                >
                  {resending ? "Sending…" : "Resend code"}
                </button>
              </div>
            )}

            <Button className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        )}

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
