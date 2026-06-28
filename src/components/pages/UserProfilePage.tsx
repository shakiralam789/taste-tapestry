"use client";

import React from "react";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getOptimizedUrl } from "@/lib/utils";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { getFollowStatus, followUser, unfollowUser, getSimilarity } from "@/features/users/api";
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
  MessageCircle,
  Heart,
} from "lucide-react";
import { TabsListLink } from "@/components/ui/tabs";
import { useParams, usePathname } from "next/navigation";
import { ClientOnly } from "@/components/common/ClientOnly";
import { usePublicProfileInfo } from "@/features/users/usePublicProfileInfo";
import { FollowDialog } from "@/components/users/FollowDialog";
import { PROFILE_TABS } from "@/features/albums/constants";
const USER_PROFILE_TABS = PROFILE_TABS;

function UserProfilePageInner({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string | undefined }>();
  const pathname = usePathname();

  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const isOwnProfile = authUser?.id === id;

  const [followDialog, setFollowDialog] = React.useState<{
    isOpen: boolean;
    activeTab: "followers" | "following";
  }>({
    isOpen: false,
    activeTab: "followers",
  });
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

  const { data: similarityData, isLoading: similarityLoading } = useQuery({
    queryKey: ["user-similarity", id],
    queryFn: () => getSimilarity(id as string),
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

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Check out ${displayName}'s profile on Taste Tapestry`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error("Could not share profile");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied to clipboard!");
      } catch {
        toast.error("Could not copy link");
      }
    }
  };

  const isFollowing = followStatus?.isFollowing ?? false;

  if (profileLoading && !profile) {
    return <FullScreenLoader />;
  }

  if (profileError || !profile) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">User not found.</p>
          <Link href="/profile">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to profile
            </Button>
          </Link>
        </div>
      </>
    );
  }
  console.log(profile);


  return (
    <>
      <div className="min-h-screen pb-12">
        {/* Banner - same as ProfilePage */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2676&auto=format&fit=crop')] bg-cover bg-center opacity-60"
            style={{
              backgroundImage:
                !profileLoading && profile.bannerUrl
                  ? `url(${getOptimizedUrl(profile.bannerUrl, 2048)})`
                  : 'https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2676&auto=format&fit=crop',
            }}
          />
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
              <Dialog>
                <DialogTrigger asChild>
                  <button className="relative group cursor-pointer mb-4 md:mb-6 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary ring-offset-background ring-offset-2">
                    <Avatar className="sm:w-40 sm:h-40 w-32 h-32 ring-4 ring-background relative">
                      <AvatarImage
                        src={getOptimizedUrl(profile.avatar, 2048)}
                        alt={displayName}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-4xl bg-background text-foreground">
                        {displayName[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0 overflow-hidden flex justify-center items-center">
                  <DialogTitle className="sr-only">Profile Image Preview</DialogTitle>
                  {profile.avatar && (
                    <img
                      src={profile.avatar}
                      alt={displayName}
                      className="w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    />
                  )}
                </DialogContent>
              </Dialog>

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

              <div className="flex flex-col gap-3 w-full">
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
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </Button>
                </div>

                {!isOwnProfile && authUser && (
                  <Link href={`/messages?userId=${id}`} className="w-full">
                    <Button
                      className="w-full"
                    >
                      <MessageCircle className="w-5 h-5" /> Message
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>

            {/* Right: Stats + Tabs - same as ProfilePage */}
            <div className="flex-1 w-full space-y-4 sm:space-y-6 pt-8 lg:pt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                <div
                  className="p-4 rounded-2xl bg-card/30 border border-white/5 backdrop-blur-sm hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => setFollowDialog({ isOpen: true, activeTab: "followers" })}
                >
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
                <div
                  className="p-4 rounded-2xl bg-card/30 border border-white/5 backdrop-blur-sm hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => setFollowDialog({ isOpen: true, activeTab: "following" })}
                >
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

              {/* Huge Taste Match Section */}
              {!isOwnProfile && authUser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full relative rounded-3xl overflow-hidden p-[1px] mt-4 mb-8"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-50 blur-md"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-70"></div>
                  <div className="relative bg-background/90 backdrop-blur-2xl rounded-[23px] p-4 sm:p-6 flex flex-col md:flex-row items-center gap-8">
                    {similarityLoading ? (
                      <div className="w-full animate-pulse flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 rounded-full bg-primary/20 shrink-0"></div>
                        <div className="flex-1 space-y-4 w-full">
                          <div className="h-8 bg-primary/20 rounded w-1/3"></div>
                          <div className="h-4 bg-primary/20 rounded w-full"></div>
                          <div className="h-4 bg-primary/20 rounded w-5/6"></div>
                        </div>
                      </div>
                    ) : similarityData?.score !== null && similarityData?.score !== undefined ? (
                      <>
                        <div className="shrink-0 relative flex items-center justify-center w-32 h-32">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                            <circle cx="64" cy="64" r="56" className="stroke-white/10" strokeWidth="12" fill="none" />
                            <circle cx="64" cy="64" r="56" className="stroke-primary transition-all duration-1000 ease-out" strokeWidth="12" fill="none" strokeDasharray="351.86" strokeDashoffset={351.86 - (351.86 * similarityData.score) / 100} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-pink-400">
                              {similarityData.score}%
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 w-full">
                          <h3 className="text-2xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-primary fill-primary/20" /> Taste Match
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                            {similarityData.explanations.map((exp, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="mt-0.5 rounded-full p-1 bg-primary/20 text-primary shrink-0">
                                  <Heart className="w-3 h-3 fill-primary/50" />
                                </div>
                                <span className="text-sm font-medium text-foreground/90">{exp.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full text-center py-8">
                        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <h3 className="text-xl font-display font-bold text-foreground mb-2">Taste Match</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">{similarityData?.message || "Not enough data to calculate similarity yet."}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

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
      <FollowDialog
        userId={id as string}
        isOpen={followDialog.isOpen}
        initialTab={followDialog.activeTab}
        onClose={() => setFollowDialog((prev) => ({ ...prev, isOpen: false }))}
      />
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
