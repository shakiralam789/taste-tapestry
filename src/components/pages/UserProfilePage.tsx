"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { getFollowStatus, followUser, unfollowUser } from "@/features/users/api";
import { useAuth } from "@/features/auth/AuthContext";
import { toast } from "sonner";
import {
  MapPin,
  Share2,
  ArrowLeft,
  Sparkles,
  Users,
  Rocket,
  Calendar,
} from "lucide-react";
import { TabsListLink } from "@/components/ui/tabs";
import { useParams, usePathname } from "next/navigation";
import { ClientOnly } from "@/components/common/ClientOnly";
import { usePublicProfileInfo } from "@/features/users/usePublicProfileInfo";
import { PROFILE_TABS } from "@/features/albums/constants";
const USER_PROFILE_TABS = PROFILE_TABS;

function UserProfilePageInner({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string | undefined }>();
  const pathname = usePathname();

  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const isOwnProfile = authUser?.id === id;
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    displayName,
    displayUsername,
    displayBio,
    displayLocation,
    displaySinceYear,
  } = usePublicProfileInfo(id);

  const { data: followStatus, isLoading: followStatusLoading } = useQuery({
    queryKey: ["user-follow-status", id],
    queryFn: () => getFollowStatus(id as string),
    enabled: !!id && !!authUser && !isOwnProfile,
  });

  const followMutation = useMutation({
    mutationFn: () => followUser(id as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["user-follow-status", id],
      });
      void queryClient.invalidateQueries({ queryKey: ["user-profile", id] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Following");
    },
    onError: () => toast.error("Could not follow"),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(id as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["user-follow-status", id],
      });
      void queryClient.invalidateQueries({ queryKey: ["user-profile", id] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Unfollowed");
    },
    onError: () => toast.error("Could not unfollow"),
  });

  const isFollowing = followStatus?.isFollowing ?? false;

  if (profileLoading && !profile) {
    return <FullScreenLoader />;
  }

  if (profileError || !profile) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">User not found.</p>
          <Link href="/profile">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to profile
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <div className="min-h-screen pb-12">
        {/* Banner - same as ProfilePage */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2676&auto=format&fit=crop')] bg-cover bg-center opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 mix-blend-overlay" />
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="flex flex-col lg:flex-row md:gap-6 gap-4 items-start">
            {/* Left: Profile card - same structure as ProfilePage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:sticky top-20 w-full lg:w-1/3 flex flex-col items-center text-center p-4 pt-8 md:p-8 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-xl"
            >
              <Avatar className="w-40 h-40 ring-4 ring-background relative mb-4 md:mb-6">
                <AvatarImage
                  src={profile.avatar ?? undefined}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl bg-background text-foreground">
                  {displayName[0] || "?"}
                </AvatarFallback>
              </Avatar>

              <h1 className="font-display md:text-4xl text-2xl font-bold mb-2 flex items-center gap-2">
                {displayName}
                <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              </h1>
              <p className="text-primary font-medium mb-4 md:text-lg text-base">
                {displayUsername}
              </p>

              <p className="text-sm md:text-base text-muted-foreground md:mb-6 mb-4 leading-relaxed max-w-xs">
                {displayBio}
              </p>

              <div className="flex items-center justify-center gap-4 md:text-sm text-xs text-gray-400 md:mb-6 mb-4 w-full flex-wrap">
                {displayLocation && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                    <MapPin className="w-3.5 h-3.5" />
                    {displayLocation}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <Calendar className="w-3.5 h-3.5" />
                  Since {displaySinceYear}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                {!isOwnProfile && authUser && (
                  <Button
                    className="w-full rounded-xl"
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    disabled={
                      followStatusLoading ||
                      followMutation.isPending ||
                      unfollowMutation.isPending
                    }
                    onClick={() =>
                      isFollowing
                        ? unfollowMutation.mutate()
                        : followMutation.mutate()
                    }
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {followMutation.isPending || unfollowMutation.isPending
                      ? "..."
                      : isFollowing
                        ? "Following"
                        : "Follow"}
                  </Button>
                )}
                <Button
                  className="w-full rounded-xl"
                  variant="outline"
                  size="sm"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
              </div>
            </motion.div>

            {/* Right: Stats + Tabs - same as ProfilePage */}
            <div className="flex-1 w-full space-y-8 pt-8 lg:pt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                <div className="p-4 rounded-2xl bg-card/30 border border-white/5 backdrop-blur-sm hover:bg-white/5 transition-colors group cursor-default">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Users className="w-4 h-4 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Followers
                    </span>
                  </div>
                  <p className="font-display md:text-3xl text-2xl font-bold text-foreground">
                    {profile.followersCount ?? 0}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-card/30 border border-white/5 backdrop-blur-sm hover:bg-white/5 transition-colors group cursor-default">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Users className="w-4 h-4 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Following
                    </span>
                  </div>
                  <p className="font-display md:text-3xl text-2xl font-bold text-foreground">
                    {profile.followingCount ?? 0}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-card/30 border border-white/5 backdrop-blur-sm hover:bg-white/5 transition-colors group cursor-default">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Stars
                    </span>
                  </div>
                  <p className="font-display md:text-3xl text-2xl font-bold text-foreground">
                    0
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-card/30 border border-white/5 backdrop-blur-sm hover:bg-white/5 transition-colors group cursor-default">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Rocket className="w-4 h-4 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Capsules
                    </span>
                  </div>
                  <p className="font-display md:text-3xl text-2xl font-bold text-foreground">
                    0
                  </p>
                </div>
              </motion.div>

              <div className="w-full">
                <div className="bg-background/80 backdrop-blur-sm sticky top-16 z-10 w-full flex justify-between sm:justify-start flex-wrap border-b border-white/10 p-0 h-auto rounded-none mb-8 gap-4">
                  {USER_PROFILE_TABS.map((tab) => (
                    <TabsListLink key={tab.value} href={`/users/${id}/${tab.value}`}
                    className={pathname === `/users/${id}${tab?.value ? `/${tab.value}` : ""}` ? "active" : ""}
                    >
                      <span className="block sm:hidden px-6"><tab.icon className="w-5 h-5" /></span>
                      <span className="hidden sm:block">{tab.label}</span>
                    </TabsListLink>
                  ))}
                </div>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function UserProfilePage({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      <UserProfilePageInner>{children}</UserProfilePageInner>
    </ClientOnly>
  );
}
