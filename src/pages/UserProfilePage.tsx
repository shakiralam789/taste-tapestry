"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ProfilePostCard } from "@/components/profile/ProfilePostCard";
import { ProfilePostCardSkeleton } from "@/components/profile/ProfilePostCardSkeleton";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import {
  getPublicProfile,
  getPublicFavorites,
  getFollowStatus,
  followUser,
  unfollowUser,
} from "@/features/users/api";
import { useAuth } from "@/features/auth/AuthContext";
import { CATEGORY_TABS } from "@/features/albums/constants";
import { toast } from "sonner";
import {
  MapPin,
  Share2,
  ArrowLeft,
  Sparkles,
  Users,
  Rocket,
  Calendar,
  LayoutGrid,
  List,
  Images,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientOnly } from "@/components/common/ClientOnly";

type UserProfilePageProps = { id: string };

const staggerDelay = 0.08;

function UserProfilePageInner({ id }: UserProfilePageProps) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const isOwnProfile = authUser?.id === id;

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: () => getPublicProfile(id),
    enabled: !!id,
  });

  const { data: followStatus, isLoading: followStatusLoading } = useQuery({
    queryKey: ["user-follow-status", id],
    queryFn: () => getFollowStatus(id),
    enabled: !!id && !!authUser && !isOwnProfile,
  });

  const followMutation = useMutation({
    mutationFn: () => followUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-follow-status", id] });
      void queryClient.invalidateQueries({ queryKey: ["user-profile", id] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Following");
    },
    onError: () => toast.error("Could not follow"),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-follow-status", id] });
      void queryClient.invalidateQueries({ queryKey: ["user-profile", id] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Unfollowed");
    },
    onError: () => toast.error("Could not unfollow"),
  });

  const isFollowing = followStatus?.isFollowing ?? false;

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["user-favorites", id],
    queryFn: () => getPublicFavorites(id),
    enabled: !!id && !!profile,
  });

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    (typeof CATEGORY_TABS)[number]["value"]
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredFavorites = useMemo(() => {
    if (selectedCategoryFilter === "all") return favorites;
    return favorites.filter((f) => f.categoryId === selectedCategoryFilter);
  }, [favorites, selectedCategoryFilter]);

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

  const displayName =
    profile.displayName?.trim() || profile.username?.trim() || "User";
  const displayUsername = profile.username?.trim()
    ? `@${profile.username}`
    : "";
  const displayBio =
    profile.bio?.trim() ||
    "This user hasn't added a bio yet.";
  const displayLocation = profile.location?.trim() || "";
  const displaySinceYear = profile.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : new Date().getFullYear();

  return (
    <Layout className="md:px-0 px-0 pt-0 md:pt-0">
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
              className="lg:sticky top-4 w-full lg:w-1/3 flex flex-col items-center text-center p-4 pt-8 md:p-8 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-xl"
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
                <Button className="w-full rounded-xl" variant="outline" size="sm">
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
                    {favorites.length}
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

              <Tabs defaultValue="favorites" className="w-full">
                <TabsList className="w-full justify-start flex-wrap bg-transparent border-b border-white/10 p-0 h-auto rounded-none mb-8 gap-4">
                  <TabsTrigger
                    value="favorites"
                    className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-base"
                  >
                    Collection
                  </TabsTrigger>
                  <TabsTrigger
                    value="interests"
                    className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-base"
                  >
                    Interests & pursuits
                  </TabsTrigger>
                  <TabsTrigger
                    value="talents"
                    className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-base"
                  >
                    Hidden talents
                  </TabsTrigger>
                  <TabsTrigger
                    value="capsules"
                    className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-base"
                  >
                    Time capsules
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="favorites" className="mt-0">
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="text-2xl font-display font-bold">
                          {displayName}&apos;s collection
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Movies, songs, books, places — their taste in one place.
                        </p>
                      </div>
                      <Link href={`/users/${id}/albums`}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="border rounded-full gap-1 text-xs text-muted-foreground hover:text-primary"
                        >
                          <Images className="w-3.5 h-3.5" />
                          Albums
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_TABS.map((cat) => {
                          const Icon = "icon" in cat ? cat.icon : undefined;
                          return (
                            <Button
                              key={cat.value}
                              type="button"
                              size="sm"
                              variant={
                                selectedCategoryFilter === cat.value
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                setSelectedCategoryFilter(cat.value)
                              }
                              className={`rounded-full ${cat.value === "all" ? "gap-0" : "gap-2"}`}
                            >
                              <span aria-hidden>
                                {Icon ? (
                                  <Icon className="w-3.5 h-3.5" />
                                ) : null}
                              </span>
                              {cat.label}
                            </Button>
                          );
                        })}
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/60 px-0.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => setViewMode("grid")}
                          className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs ${
                            viewMode === "grid"
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-white/5"
                          }`}
                          aria-label="Grid view"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode("list")}
                          className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs ${
                            viewMode === "list"
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-white/5"
                          }`}
                          aria-label="List view"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {favoritesLoading ? (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4"
                          : "flex flex-col gap-3"
                      }
                    >
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <ProfilePostCardSkeleton
                          key={idx}
                          variant={viewMode}
                        />
                      ))}
                    </div>
                  ) : filteredFavorites.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center">
                      <p className="text-muted-foreground text-sm mb-2">
                        {selectedCategoryFilter === "all"
                          ? "No items in their collection yet."
                          : `No ${CATEGORY_TABS.find((c) => c.value === selectedCategoryFilter)?.label ?? selectedCategoryFilter} in their collection.`}
                      </p>
                    </div>
                  ) : (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4"
                          : "flex flex-col gap-3"
                      }
                    >
                      {filteredFavorites.map((favorite, index) => (
                        <motion.div
                          key={favorite.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: index * staggerDelay,
                            duration: 0.25,
                          }}
                          className={viewMode === "list" ? "w-full" : ""}
                        >
                          <Link href={`/favorites/${favorite.id}`}>
                            <ProfilePostCard
                              favorite={favorite}
                              variant={viewMode}
                            />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="interests" className="mt-0">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold">
                      Interests & creative pursuits
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Creative, performance, skill-based, and more — what drives them.
                    </p>
                  </div>
                  <div className="py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center text-muted-foreground text-sm">
                    No interests added yet.
                  </div>
                </TabsContent>

                <TabsContent value="talents" className="mt-0">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold">
                      Hidden talents
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Reveal your secret skills — singing, dancing, writing, art, acting, stunts.
                    </p>
                  </div>
                  <div className="py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center text-muted-foreground text-sm">
                    No talents revealed yet.
                  </div>
                </TabsContent>

                <TabsContent value="capsules" className="mt-0">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold">
                      Time capsules
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Collections tied to a period — school days, breakup era, summer 2024.
                    </p>
                  </div>
                  <div className="p-12 rounded-3xl bg-card/20 border-2 border-dashed border-white/10 text-center text-muted-foreground">
                    <Rocket className="w-14 h-14 mx-auto mb-4 opacity-50" />
                    <h4 className="text-lg font-semibold mb-2 text-foreground">
                      No capsules yet
                    </h4>
                    <p className="text-sm">
                      {displayName} hasn&apos;t created any time capsules yet.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function UserProfilePage(props: UserProfilePageProps) {
  return (
    <ClientOnly>
      <UserProfilePageInner {...props} />
    </ClientOnly>
  );
}
