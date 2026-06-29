"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "@/components/ui/country-select";
import {
  Mail,
  Lock,
  User,
  AtSign,
  ArrowRight,
  ArrowLeft,
  Cake,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import type { AxiosError } from "axios";
import { detectCountryCode } from "@/lib/countries";
import {
  MIN_SIGNUP_AGE,
  ageFromDateOfBirth,
  maxDateOfBirthForMinAge,
} from "@/lib/age";

type FormState = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  country: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const STEPS = ["Account", "About you"] as const;

const inputCls =
  "pl-10 h-11 rounded-xl border-border bg-background/50 focus-visible:ring-2 focus-visible:ring-primary/30";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { registerWithEmail } = useAuth();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    country: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const maxDob = useMemo(() => maxDateOfBirthForMinAge(MIN_SIGNUP_AGE), []);

  // Prefill the country picker from the user's detected location after mount.
  // Only fills if the user hasn't already picked one.
  useEffect(() => {
    let cancelled = false;
    detectCountryCode().then((code) => {
      if (cancelled || !code) return;
      setForm((prev) => (prev.country ? prev : { ...prev, country: code }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validateAccount = (): boolean => {
    const next: Errors = {};
    if (!form.email.trim()) next.email = "Email is required";
    else if (!EMAIL_RE.test(form.email.trim()))
      next.email = "Enter a valid email address";

    if (!form.username.trim()) next.username = "Username is required";
    else if (form.username.trim().length < 3)
      next.username = "At least 3 characters";
    else if (form.username.trim().length > 32)
      next.username = "At most 32 characters";
    else if (!USERNAME_RE.test(form.username.trim()))
      next.username = "Only letters, numbers, and underscores";

    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 8)
      next.password = "At least 8 characters";

    if (form.confirmPassword !== form.password)
      next.confirmPassword = "Passwords do not match";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateProfile = (): boolean => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "Display name is required";

    if (!form.dateOfBirth) next.dateOfBirth = "Date of birth is required";
    else {
      const age = ageFromDateOfBirth(form.dateOfBirth);
      if (age === null) next.dateOfBirth = "Enter a valid date";
      else if (age < MIN_SIGNUP_AGE)
        next.dateOfBirth = `You must be at least ${MIN_SIGNUP_AGE} years old`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (validateAccount()) setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSubmitting(true);
    try {
      await registerWithEmail(
        form.email.trim(),
        form.password,
        form.name.trim(),
        form.username.trim(),
        {
          dateOfBirth: form.dateOfBirth,
          country: form.country || undefined,
        },
      );
      toast.success("Account created!", { description: "You're signed in." });
      router.push("/");
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ?? "Could not create account.";
      toast.error("Registration failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
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
          Create your account and start exploring.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/80 dark:bg-card/90 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-none p-6 md:p-8 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {STEPS.map((label, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <div key={label} className="flex flex-1 items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : active
                          ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={`hidden text-xs font-medium sm:block ${
                      active || done
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-px flex-1 bg-border">
                    <div
                      className="h-px bg-primary transition-all duration-300"
                      style={{ width: done ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 ? (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={inputCls}
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="username"
                      type="text"
                      autoComplete="username"
                      placeholder="alex_rivers"
                      className={inputCls}
                      value={form.username}
                      onChange={(e) => set("username", e.target.value)}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-red-500">{errors.username}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className={`${inputCls} pr-10`}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={inputCls}
                      value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="gradient"
                  onClick={goNext}
                  className="w-full h-12 rounded-xl text-base font-medium gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Display name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Alex"
                      className={inputCls}
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Date of birth */}
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth">Date of birth</Label>
                  <div className="relative">
                    <Cake className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      max={maxDob}
                      className={inputCls}
                      value={form.dateOfBirth}
                      onChange={(e) => set("dateOfBirth", e.target.value)}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="text-xs text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <Label htmlFor="country">
                    Country{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <CountrySelect
                    id="country"
                    value={form.country}
                    onChange={(v) => set("country", v)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Helps us connect you with people across cultures.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="h-12 rounded-xl gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={submitting}
                    className="flex-1 h-12 rounded-xl text-base font-medium gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                  >
                    {submitting ? "Creating account..." : "Create account"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
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
