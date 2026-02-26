"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { resetPassword as resetPasswordRequest } from "@/features/auth/api";
import type { AxiosError } from "axios";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mismatch = useMemo(
    () => confirmPassword.length > 0 && password !== confirmPassword,
    [password, confirmPassword],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch || !token) return;

    try {
      setSubmitting(true);
      await resetPasswordRequest({ token, password });
      toast.success("Password updated", {
        description: "You can now sign in with your new password.",
      });
      setSubmitted(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ??
        "Reset link is invalid or has expired.";
      toast.error("Could not reset password", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent"
        >
          <span className="text-3xl">🌌</span>
          Nebula
        </Link>
        <p className="text-muted-foreground text-sm">
          Set a new password
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/80 dark:bg-card/90 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-none p-6 md:p-8 space-y-6">
        <h1 className="font-display text-xl font-semibold text-foreground">
          Reset password
        </h1>

        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Button asChild variant="gradient" className="w-full h-12 rounded-xl text-base font-medium gap-2">
              <Link href="/login">
                Sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                New password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-border bg-background/50 focus-visible:ring-2 focus-visible:ring-primary/30"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirm new password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 h-11 rounded-xl border-border bg-background/50 focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    mismatch ? "border-destructive focus-visible:ring-destructive/30" : ""
                  }`}
                  required
                  minLength={8}
                />
              </div>
              {mismatch && (
                <p className="text-xs text-destructive">Passwords don&apos;t match</p>
              )}
            </div>
            <Button
              type="submit"
              variant="gradient"
              disabled={
                submitting ||
                !token ||
                mismatch ||
                password.length < 8 ||
                confirmPassword.length < 8
              }
              className="w-full h-12 rounded-xl text-base font-medium gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              {submitting ? "Updating..." : "Reset password"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
