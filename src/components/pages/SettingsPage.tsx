"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Layout } from "@/components/layout/Layout";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Monitor, Sun, Moon, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";

type ThemeValue = "light" | "dark" | "system";

const options: { value: ThemeValue; label: string; description: string; icon: typeof Sun }[] = [
  { value: "light", label: "Off", description: "Always use light mode", icon: Sun },
  { value: "dark", label: "On", description: "Always use dark mode", icon: Moon },
  { value: "system", label: "Auto", description: "Match your device’s system setting", icon: Monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const currentTheme = (theme ?? "system") as ThemeValue;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Settings className="w-7 h-7 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your preferences and appearance.
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold mb-1">Appearance</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Choose how Nebula looks. Auto follows your device’s light/dark setting.
          </p>
          <div className="space-y-4">
            <Label className="text-base">Dark mode</Label>
            <RadioGroup
              value={currentTheme}
              onValueChange={(value) => setTheme(value as ThemeValue)}
              className="grid gap-3"
            >
              {options.map((opt) => {
                const Icon = opt.icon;
                const isSelected = currentTheme === opt.value;
                return (
                  <label
                    key={opt.value}
                    htmlFor={`theme-${opt.value}`}
                    className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} id={`theme-${opt.value}`} />
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold mb-1">Account</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your session. You can sign out from this device at any time.
          </p>
          <div className="flex justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Log out</p>
              <p>Sign out of Nebula on this device.</p>
            </div>
            <button
              type="button"
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs md:text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>{loggingOut ? "Signing out…" : "Log out"}</span>
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
