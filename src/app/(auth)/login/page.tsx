"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import type { AxiosError } from "axios";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [remember, setRemember] = useState(false);
  const router = useRouter();
  const { loginWithEmail } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginWithEmail(values.email, values.password);
      if (typeof window !== "undefined" && remember) {
        window.localStorage.setItem("rememberEmail", values.email);
      }
      toast.success("Welcome back!", { description: "You're signed in." });
      router.push("/");
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ?? "Invalid email or password.";
      toast.error("Sign in failed", { description: message });
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Branding */}
      <div className="text-center space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent"
        >
          <span className="text-3xl">🌌</span>
          Nebula
        </Link>
        <p className="text-muted-foreground text-sm">
          Welcome back. Sign in to continue.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/80 dark:bg-card/90 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-none p-6 md:p-8 space-y-6">
        <h1 className="font-display text-xl font-semibold text-foreground">
          Sign in
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email or username
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="text"
                placeholder="you@example.com or username"
                autoComplete="username"
                className="pl-10 h-11 rounded-xl border-border bg-background/50 focus-visible:ring-2 focus-visible:ring-primary/30"
                {...register("email", { required: "Email or username is required" })}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-11 rounded-xl border-border bg-background/50 focus-visible:ring-2 focus-visible:ring-primary/30"
                {...register("password", { required: "Password is required" })}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal text-muted-foreground cursor-pointer"
            >
              Remember me
            </Label>
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full h-12 rounded-xl text-base font-medium gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        By signing in, you agree to our{" "}
        <Link href="#" className="underline hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
