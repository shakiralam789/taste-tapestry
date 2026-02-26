"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/features/auth/api";
import type { AxiosError } from "axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await requestPasswordReset(email);
      toast.success("Check your email", {
        description:
          "If an account exists for that address, we sent a reset link.",
      });
      setSubmitted(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ??
        "Something went wrong. Please try again.";
      toast.error("Could not send reset link", { description: message });
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
        <p className="text-muted-foreground text-sm">Reset your password</p>
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/80 dark:bg-card/90 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-none p-6 md:p-8 space-y-6">
        <h1 className="font-display text-xl font-semibold text-foreground">
          Forgot password?
        </h1>

        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If an account exists for{" "}
              <strong className="text-foreground">{email}</strong>, we&apos;ve
              sent a link to reset your password. Check your inbox and spam
              folder.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-border bg-background/50 focus-visible:ring-2 focus-visible:ring-primary/30"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="gradient"
                disabled={submitting}
                className="w-full h-12 rounded-xl text-base font-medium gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                {submitting ? "Sending..." : "Send reset link"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}

        <Button
          asChild
          variant="outline"
          className="w-full h-11 rounded-xl gap-2"
        >
          <Link href="/login">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    </div>
  );
}
