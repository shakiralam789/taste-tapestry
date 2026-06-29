"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  Settings,
  Monitor,
  Sun,
  Moon,
  LogOut,
  UserX,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { deactivateAccount, deleteAccount } from "@/features/auth/api";

type ThemeValue = "light" | "dark" | "system";

const options: { value: ThemeValue; label: string; description: string; icon: typeof Sun }[] = [
  { value: "light", label: "Off", description: "Always use light mode", icon: Sun },
  { value: "dark", label: "On", description: "Always use dark mode", icon: Moon },
  { value: "system", label: "Auto", description: "Match your device’s system setting", icon: Monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout, endSession } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivateAccount();
      endSession();
      toast.success("Account deactivated", {
        description: "Log back in any time to reactivate it.",
      });
      router.replace("/login");
    } catch {
      toast.error("Could not deactivate account", {
        description: "Please try again.",
      });
      setDeactivating(false);
      setDeactivateOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePassword) {
      setDeleteError("Password is required");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword);
      endSession();
      toast.success("Account scheduled for deletion", {
        description:
          "You have 30 days to change your mind — just log back in to cancel.",
      });
      router.replace("/login");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not delete account. Please try again.";
      setDeleteError(message);
      setDeleting(false);
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

        {/* Danger zone */}
        <section className="rounded-2xl border border-destructive/30 bg-destructive/[0.03] p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold mb-1 text-destructive">
            Danger zone
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Deactivating hides your profile and can be undone by logging back
            in. Deleting is permanent after a 30-day grace period.
          </p>

          <div className="divide-y divide-border">
            <div className="flex justify-between items-center gap-4 py-4 first:pt-0">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Deactivate account
                </p>
                <p>Temporarily hide your profile and content.</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => setDeactivateOpen(true)}
              >
                <UserX className="h-4 w-4" />
                <span>Deactivate</span>
              </button>
            </div>

            <div className="flex justify-between items-center gap-4 py-4 last:pb-0">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Delete account</p>
                <p>Permanently delete your account and all your data.</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs md:text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => {
                  setDeletePassword("");
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate your account?"
        description="Your profile and content will be hidden from everyone. You can reactivate at any time by logging back in."
        confirmText="Deactivate"
        variant="destructive"
        isLoading={deactivating}
        onConfirm={handleDeactivate}
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteOpen(open);
        }}
      >
        <AlertDialogContent className="max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This schedules your account for permanent deletion in 30 days.
              You can cancel any time before then by logging back in. Enter your
              password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-password">Password</Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                if (deleteError) setDeleteError(null);
              }}
              placeholder="••••••••"
              disabled={deleting}
            />
            {deleteError && (
              <p className="text-xs text-red-500">{deleteError}</p>
            )}
          </div>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
            >
              {deleting ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
