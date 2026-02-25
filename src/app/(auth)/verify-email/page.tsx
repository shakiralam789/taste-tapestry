"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResending(true);
    // Placeholder: call your auth API to resend verification email
    await new Promise((r) => setTimeout(r, 800));
    setResending(false);
    setResent(true);
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
          Verify your email
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/80 dark:bg-card/90 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-none p-6 md:p-8 space-y-6">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>
        </div>
        <h1 className="font-display text-xl font-semibold text-foreground text-center">
          Check your inbox
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          We&apos;ve sent a verification link to{" "}
          {email ? <strong className="text-foreground">{email}</strong> : "your email"}. Click the link to verify your account.
        </p>
        <div className="space-y-3">
          <Button asChild variant="gradient" className="w-full h-12 rounded-xl text-base font-medium gap-2">
            <Link href="/login">
              Go to sign in
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <form onSubmit={handleResend}>
            <Button
              type="submit"
              variant="outline"
              disabled={resending}
              className="w-full h-11 rounded-xl gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
              {resent ? "Link sent again" : resending ? "Sending…" : "Resend verification email"}
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Didn&apos;t get the email? Check spam or{" "}
          <button
            type="button"
            onClick={() => document.querySelector<HTMLFormElement>("form")?.requestSubmit()}
            className="font-medium text-primary hover:underline"
          >
            resend
          </button>
          .
        </p>
      </div>
    </div>
  );
}
