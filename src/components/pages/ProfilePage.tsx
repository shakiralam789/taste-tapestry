"use client";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuth } from "@/features/auth/AuthContext";
import { updateProfile, uploadAvatar, uploadBanner } from "@/features/profile/api";
import { useProfileInfo } from "@/features/profile/useProfileInfo";
import {
  MapPin,
  Calendar,
  Edit3,
  Sparkles,
  Rocket,
  Users,
  Heart,
  Palette,
  ChevronRight, 
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TabsListLink } from "@/components/ui/tabs";

const PROFILE_TABS = [
  {
    label: "My collection",
    href: "/profile",
  },
  {
    label: "Interests & pursuits",
    href: "/profile/interests",
  },
  {
    label: "Hidden talents",
    href: "/profile/talents",
  },
  {
    label: "Time capsules",
    href: "/profile/capsules",
  },
];

export default function ProfilePage({
  children,
}: {
  children: React.ReactNode;
}) {
  if (typeof window === "undefined") {
    return null;
  }
  return <ProfilePageInner>{children}</ProfilePageInner>;
}

function ProfilePageInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    username: "",
    avatar: "",
    bio: "",
    location: "",
    bannerUrl: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [bannerVersion, setBannerVersion] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const {
    profile,
    loading: profileLoading,
    displayName,
    displayUsername,
    displayAvatar,
    displayBio,
    displayLocation,
    displayBannerUrl,
    displaySinceYear,
  } = useProfileInfo();

  const displayAvatarUrl = displayAvatar
    ? `${displayAvatar}${displayAvatar.includes("?") ? "&" : "?"}v=${avatarVersion}`
    : "";

  const bannerUrlWithVersion = displayBannerUrl
    ? `${displayBannerUrl}${displayBannerUrl.includes("?") ? "&" : "?"}v=${bannerVersion}`
    : "";

  const yearsOnTapestry = Math.max(
    1,
    new Date().getFullYear() - displaySinceYear + 1,
  );

  useEffect(() => {
    if (editOpen && profile) {
      setEditForm({
        displayName: profile.displayName ?? "",
        username: profile.username ?? "",
        avatar: profile.avatar ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
        bannerUrl: profile.bannerUrl ?? "",
      });
    }
  }, [editOpen, profile]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      await updateProfile({
        displayName: editForm.displayName.trim() || undefined,
        username: editForm.username.trim() || undefined,
        avatar: editForm.avatar.trim() || undefined,
        bio: editForm.bio.trim() || undefined,
        location: editForm.location.trim() || undefined,
        bannerUrl: editForm.bannerUrl.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditOpen(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPEG, PNG, GIF, or WebP)");
      return;
    }
    setAvatarUploading(true);
    try {
      const updated = await uploadAvatar(file);
      if (updated) {
        queryClient.setQueryData(["profile"], updated);
        setAvatarVersion((v) => v + 1);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleBannerFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPEG, PNG, GIF, or WebP)");
      return;
    }
    setBannerUploading(true);
    try {
      const updated = await uploadBanner(file);
      if (updated) {
        queryClient.setQueryData(["profile"], updated);
        setBannerVersion((v) => v + 1);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
      toast.success("Banner updated");
    } catch {
      toast.error("Failed to upload banner");
    } finally {
      setBannerUploading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen pb-12">
        {/* Immersive Banner */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{
              backgroundImage:
                !profileLoading && bannerUrlWithVersion
                  ? `url(${bannerUrlWithVersion})`
                  : undefined,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 mix-blend-overlay" />
          {authUser && (
            <div className="absolute top-4 right-4 z-10">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleBannerFileChange}
                aria-label="Upload banner"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full bg-background/70 border-white/30 text-xs hover:bg-background hover:border-primary/60"
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
                aria-label="Change banner"
              >
                {bannerUploading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                )}
                Update banner
              </Button>
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="flex flex-col lg:flex-row md:gap-6 gap-4 items-start">
            {/* Left: Profile Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:sticky top-20 w-full lg:w-1/3 flex flex-col items-center text-center p-4 pt-8 md:p-8 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-xl"
            >
              <div className="w-fit absolute top-4 right-4">
                <Button
                  type="button"
                  className="w-fit rounded-xl"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Button>
              </div>
              <div className="relative md:mb-6 mb-4 group">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                  aria-label="Upload avatar"
                />
                <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-full opacity-75 blur transition duration-500 group-hover:opacity-100" />
                <Avatar className="w-40 h-40 ring-4 ring-background relative">
                  <AvatarImage
                    src={displayAvatarUrl || displayAvatar}
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl bg-background text-foreground">
                    {displayName[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="rounded-full shadow-lg h-10 w-10"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading || !authUser}
                    aria-label="Change avatar"
                    title="Upload new avatar"
                  >
                    {avatarUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Edit3 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <h1 className="font-display md:text-4xl text-2xl font-bold mb-2 flex items-center gap-2">
                {profileLoading ? "…" : displayName}
                <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
              </h1>
              <p className="text-primary font-medium mb-4 md:text-lg text-base">
                {displayUsername}
              </p>

              <p className="text-sm md:text-base text-muted-foreground md:mb-6 mb-4 leading-relaxed max-w-xs">
                {displayBio}
              </p>

              <div className="flex items-center justify-center gap-4 md:text-sm text-xs text-gray-400 md:mb-6 mb-4 w-full flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <MapPin className="w-3.5 h-3.5" />
                  {displayLocation}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <Calendar className="w-3.5 h-3.5" />
                  Since {displaySinceYear}
                </div>
              </div>

              {/* Quick discovery links */}
              <div className="md:mt-6 mt-4 w-full space-y-2">
                <Link href="/matches" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Heart className="w-4 h-4 text-primary" />
                      Taste matches
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/mood" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Palette className="w-4 h-4 text-primary" />
                      Mood recommendations
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/capsules" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Rocket className="w-4 h-4 text-primary" />
                      Time capsules
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Right: Content & Stats */}
            <div className="flex-1 w-full space-y-8 pt-8 lg:pt-0">
              {/* Stats Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                {[
                  {
                    label: "Followers",
                    value: (profile?.followersCount ?? 0).toLocaleString(),
                    icon: Users,
                  },
                  {
                    label: "Following",
                    value: (profile?.followingCount ?? 0).toLocaleString(),
                    icon: Users,
                  },
                  {
                    label: "Member since",
                    value: String(displaySinceYear),
                    icon: Calendar,
                  },
                  {
                    label: "Years here",
                    value: yearsOnTapestry.toString(),
                    icon: Sparkles,
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-card/30 border border-white/5 backdrop-blur-sm hover:bg-white/5 transition-colors group cursor-default"
                  >
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <stat.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {stat.label}
                      </span>
                    </div>
                    <p className="font-display md:text-3xl text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </motion.div>

              <div className="w-full">
                <div className="bg-background/80 backdrop-blur-sm sticky top-16 z-10 w-full flex items-center justify-start flex-wrap border-b border-white/10 p-0 h-auto rounded-none mb-8 gap-4">
                  {PROFILE_TABS.map((tab) => (
                    <TabsListLink
                      key={tab.href}
                      href={tab.href}
                      className={pathname === tab.href ? "active" : ""}
                    >
                      {tab.label}
                    </TabsListLink>
                  ))}
                </div>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-displayName">Name</Label>
              <Input
                id="edit-displayName"
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="Your display name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="A short bio"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="City or region"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
