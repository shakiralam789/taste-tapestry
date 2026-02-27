"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfilePostCard } from "@/components/profile/ProfilePostCard";
import { ProfilePostCardSkeleton } from "@/components/profile/ProfilePostCardSkeleton";
import { useAuth } from "@/features/auth/AuthContext";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
} from "@/features/profile/api";
import { useWishbook } from "@/contexts/WishbookContext";
import { interestCategories } from "@/data/mockData";
import type { InterestCategory, Favorite } from "@/types/wishbook";
import { AddToAlbumDropdown } from "@/components/albums/AddToAlbumDropdown";
import { getFavorites } from "@/features/favorites/api";
import { getAlbums, updateAlbum } from "@/features/albums/api";
import { getCookie, setCookie } from "@/lib/cookies";
import {
  MapPin,
  Calendar,
  Edit3,
  Share2,
  Sparkles,
  Plus,
  Rocket,
  Users,
  Heart,
  Palette,
  Mic2,
  Lock,
  ChevronRight,
  Loader2,
  LayoutGrid,
  List,
  Images,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { toast } from "sonner";

const categoryLabels: Record<InterestCategory, string> = {
  creative: "Creative pursuits",
  performance: "Performance-based",
  skill: "Skill-based",
  intellectual: "Intellectual / technical",
  unique: "Unique / unconventional",
  collaborative: "Collaborative",
};

const talentOptions = [
  "Singing",
  "Dancing",
  "Writing",
  "Art",
  "Acting",
  "Stunts",
];

export default function ProfilePage() {
  // During Next.js static export/prerender this legacy page can be rendered
  // outside of the React Query provider. Avoid running React Query hooks on the server.
  if (typeof window === "undefined") {
    return null;
  }
  return <ProfilePageInner />;
}

function ProfilePageInner() {
  const { user: authUser } = useAuth();
  const { user: wishbookUser, timeCapsules, categories } = useWishbook();
  const queryClient = useQueryClient();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | "all"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const stored = getCookie("profileCollectionView");
    return stored === "list" || stored === "grid" ? stored : "grid";
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    username: "",
    avatar: "",
    bio: "",
    location: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [albumPickerOpen, setAlbumPickerOpen] = useState(false);
  const [albumPickerFavorite, setAlbumPickerFavorite] =
    useState<Favorite | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!authUser,
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["favorites", selectedCategoryFilter],
    queryFn: async (): Promise<Favorite[]> => {
      const categoryId =
        selectedCategoryFilter === "all" ? undefined : selectedCategoryFilter;
      return getFavorites(categoryId);
    },
  });

  const {
    data: albums = [],
    isLoading: albumsLoading,
  } = useQuery({
    queryKey: ["albums"],
    queryFn: getAlbums,
  });

  const displayName =
    profile?.displayName?.trim() || authUser?.displayName?.trim() || "";
  const displayUsername = profile?.username?.trim()
    ? `@${profile.username}`
    : "";
  const displayAvatar = profile?.avatar?.trim() || "";
  const displayAvatarUrl = displayAvatar
    ? `${displayAvatar}${displayAvatar.includes("?") ? "&" : "?"}v=${avatarVersion}`
    : "";
  const displayBio =
    profile?.bio?.trim() ||
    "" ||
    "Digital explorer navigating the neon tides. Curator of moments and memories.";
  const displayLocation =
    profile?.location?.trim() || "" || "Neo Tokyo";
  const displaySinceYear = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : new Date().getFullYear();

  const addToAlbumMutation = useMutation({
    mutationFn: async (args: { albumId: string; favoriteId: string }) => {
      const currentAlbum = albums.find((a) => a.id === args.albumId);
      if (!currentAlbum) throw new Error("Album not found");
      const currentIds = currentAlbum.favoriteIds ?? [];
      if (currentIds.includes(args.favoriteId)) return currentAlbum;
      const nextIds = [...currentIds, args.favoriteId];
      return updateAlbum(args.albumId, { favoriteIds: nextIds });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Added to album");
    },
    onError: () => {
      toast.error("Could not add to album");
    },
  });

  useEffect(() => {
    setCookie("profileCollectionView", viewMode, {
      maxAgeSeconds: 60 * 60 * 24 * 365,
      path: "/",
    });
  }, [viewMode]);

  useEffect(() => {
    if (editOpen && profile) {
      setEditForm({
        displayName: profile.displayName ?? "",
        username: profile.username ?? "",
        avatar: profile.avatar ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
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

  const interestsByCategory = useMemo(() => {
    const map: Partial<
      Record<InterestCategory, typeof wishbookUser.interests>
    > = {};
    wishbookUser.interests.forEach((i) => {
      if (!map[i.category]) map[i.category] = [];
      map[i.category]!.push(i);
    });
    return map;
  }, [wishbookUser]);

  const revealedTalents = useMemo(
    () => wishbookUser.talents.filter((t) => t.isPublic),
    [wishbookUser.talents],
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Layout className="md:px-0 px-0 pt-0 md:pt-0">
      <div className="min-h-screen pb-12">
        {/* Immersive Cyber Banner */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2676&auto=format&fit=crop')] bg-cover bg-center opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 mix-blend-overlay" />
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="flex flex-col lg:flex-row md:gap-6 gap-4 items-start">
            {/* Left: Profile Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:sticky top-4 w-full lg:w-1/3 flex flex-col items-center text-center p-4 pt-8 md:p-8 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-xl"
            >
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

              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  type="button"
                  className="w-full rounded-xl"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit profile
                </Button>
                <Button
                  className="w-full rounded-xl"
                  variant="outline"
                  size="sm"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
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
                    value: wishbookUser.followers.toLocaleString(),
                    icon: Users,
                  },
                  {
                    label: "Following",
                    value: wishbookUser.following.toLocaleString(),
                    icon: Users,
                  },
                  {
                    label: "Stars",
                    value: favorites.length,
                    icon: Sparkles,
                  },
                  {
                    label: "Capsules",
                    value: timeCapsules.length,
                    icon: Rocket,
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

              <Tabs defaultValue="favorites" className="w-full">
                <TabsList className="w-full justify-start flex-wrap bg-transparent border-b border-white/10 p-0 h-auto rounded-none mb-8 gap-4">
                  <TabsTrigger
                    value="favorites"
                    className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-base"
                  >
                    My collection
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
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-display font-bold">
                          My collection
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Curated favorites — movies, songs, books, places. Your
                          taste, your story.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/60 px-1.5 py-0.5">
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
                        <Link href="/albums">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-full gap-1 text-xs text-muted-foreground hover:text-primary"
                          >
                            <Images className="w-3.5 h-3.5" />
                            Albums
                          </Button>
                        </Link>
                        <Link href="/add-favorite">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-dashed group hover:border-primary hover:text-primary"
                          >
                            <Plus className="w-4 h-4 mr-1 group-hover:rotate-90 transition-transform" />{" "}
                            Add new
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          selectedCategoryFilter === "all"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setSelectedCategoryFilter("all")}
                        className="rounded-full"
                      >
                        All
                      </Button>
                      {categories.map((cat) => (
                        <Button
                          key={cat.id}
                          type="button"
                          size="sm"
                          variant={
                            selectedCategoryFilter === cat.id
                              ? "default"
                              : "outline"
                          }
                          onClick={() => setSelectedCategoryFilter(cat.id)}
                          className="rounded-full gap-1"
                        >
                          <span aria-hidden>{cat.icon}</span>
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        : "flex flex-col gap-3"
                    }
                  >
                    {favoritesLoading && favorites.length === 0
                      ? Array.from({ length: 3 }).map((_, idx) => (
                          <ProfilePostCardSkeleton
                            key={idx}
                            variant={viewMode}
                          />
                        ))
                      : favorites.map((favorite) => (
                          <div
                            key={favorite.id}
                            className={`relative ${
                              viewMode === "list" ? "w-full" : ""
                            }`}
                          >
                            <Link href={`/favorites/${favorite.id}`}>
                              <ProfilePostCard
                                favorite={favorite}
                                variant={viewMode}
                              />
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAlbumPickerFavorite(favorite);
                                setAlbumPickerOpen(true);
                              }}
                              className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-background/80 border border-white/10 px-2 py-1 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/60 backdrop-blur-sm"
                            >
                              <Images className="w-3 h-3 mr-1" />
                              Add to album
                            </button>
                          </div>
                        ))}
                  </motion.div>
                </TabsContent>

                <TabsContent value="interests" className="mt-0">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold">
                      Interests & creative pursuits
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Creative, performance, skill-based, and more — what drives
                      you.
                    </p>
                  </div>
                  {wishbookUser.interests.length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(interestsByCategory).map(
                        ([cat, interests]) =>
                          interests &&
                          interests.length > 0 && (
                            <div
                              key={cat}
                              className="p-6 rounded-2xl bg-card/20 border border-white/5 hover:border-primary/20 transition-all"
                            >
                              <h4 className="text-lg font-semibold mb-3 text-primary capitalize">
                                {categoryLabels[cat as InterestCategory] || cat}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {interests.map((i) => (
                                  <Badge
                                    key={i.id}
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20"
                                  >
                                    {i.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ),
                      )}
                    </div>
                  ) : null}
                  <div className="mt-6 p-6 rounded-2xl bg-card/20 border border-dashed border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-muted-foreground">
                      Explore more interests
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add from creative, performance, skill-based, intellectual,
                      unique, and collaborative pursuits.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(interestCategories).map(
                        ([category, interests]) => (
                          <div key={category} className="space-y-2">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {categoryLabels[category as InterestCategory] ||
                                category}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {interests.slice(0, 6).map((i) => (
                                <Badge
                                  key={i.id}
                                  variant="outline"
                                  className="bg-background/50 cursor-pointer hover:border-primary/50"
                                >
                                  {i.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="talents" className="mt-0">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold">
                      Hidden talents
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Reveal your secret skills — singing, dancing, writing,
                      art, acting, stunts.
                    </p>
                  </div>
                  {revealedTalents.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      {revealedTalents.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-secondary/10 border border-secondary/20"
                        >
                          <Mic2 className="w-5 h-5 text-secondary" />
                          <span className="font-medium">{t.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            Revealed
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-8 rounded-3xl bg-secondary/5 border border-secondary/20 border-dashed">
                    <Sparkles className="w-12 h-12 text-secondary mx-auto mb-4" />
                    <h4 className="text-xl font-bold mb-2 text-center">
                      Unveil a talent
                    </h4>
                    <p className="text-muted-foreground text-center mb-6 text-sm">
                      Share a hidden skill with your taste twin community.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {talentOptions.map((name) => (
                        <Button
                          key={name}
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          {name}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" /> Private until you reveal
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="capsules" className="mt-0">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-display font-bold">
                        Time capsules
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Collections tied to a period — school days, breakup era,
                        summer 2024.
                      </p>
                    </div>
                    <Link href="/create-capsule">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-dashed group hover:border-primary hover:text-primary"
                      >
                        <Plus className="w-4 h-4 mr-1 group-hover:rotate-90 transition-transform" />{" "}
                        Create capsule
                      </Button>
                    </Link>
                  </div>
                  {timeCapsules.length === 0 ? (
                    <Link href="/create-capsule">
                      <div className="p-12 rounded-3xl bg-card/20 border-2 border-dashed border-white/10 text-center text-muted-foreground hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
                        <Rocket className="w-14 h-14 mx-auto mb-4 opacity-50 group-hover:opacity-80" />
                        <h4 className="text-lg font-semibold mb-2 text-foreground">
                          No capsules yet
                        </h4>
                        <p className="text-sm mb-4">
                          Capture a chapter of your life with favorites,
                          emotions, and stories.
                        </p>
                        <Button variant="secondary" size="sm">
                          Create your first capsule
                        </Button>
                      </div>
                    </Link>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {timeCapsules.map((capsule) => (
                        <motion.div key={capsule.id} variants={itemVariants}>
                          <Link href={`/capsules#${capsule.id}`}>
                            <div className="group rounded-2xl overflow-hidden border border-white/10 bg-card/30 hover:border-primary/20 transition-all">
                              <div className="aspect-video relative overflow-hidden">
                                {capsule.image ? (
                                  <img
                                    src={capsule.image}
                                    alt={capsule.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                    <Rocket className="w-12 h-12 text-primary/50" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                  <h4 className="font-display font-semibold text-lg">
                                    {capsule.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {capsule.period}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {capsule.emotions.slice(0, 3).map((e) => (
                                      <span
                                        key={e}
                                        className="text-xs px-2 py-0.5 rounded-full bg-white/10"
                                      >
                                        {e}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="p-4">
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {capsule.description}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                      <Link href="/create-capsule">
                        <motion.div
                          variants={itemVariants}
                          className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                        >
                          <Plus className="w-10 h-10" />
                          <span className="font-medium text-sm">
                            New capsule
                          </span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
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

      <Dialog
        open={albumPickerOpen}
        onOpenChange={(open) => {
          setAlbumPickerOpen(open);
          if (!open) setAlbumPickerFavorite(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add to album</DialogTitle>
          </DialogHeader>
          {albumsLoading ? (
            <p className="text-sm text-muted-foreground">Loading albums...</p>
          ) : albums.length === 0 ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>You don&apos;t have any albums yet.</p>
              <Link href="/create-album">
                <Button size="sm" className="rounded-full">
                  <Plus className="w-4 h-4 mr-1" />
                  Create album
                </Button>
              </Link>
            </div>
          ) : !albumPickerFavorite ? (
            <p className="text-sm text-muted-foreground">
              Select a favorite to add to an album.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Choose an album for{" "}
                <span className="font-medium">
                  {albumPickerFavorite.title}
                </span>
              </p>
              <AddToAlbumDropdown
                albums={albums}
                favoriteId={albumPickerFavorite.id}
                onSelect={async (albumId) => {
                  await addToAlbumMutation.mutateAsync({
                    albumId,
                    favoriteId: albumPickerFavorite.id,
                  });
                  setAlbumPickerOpen(false);
                  setAlbumPickerFavorite(null);
                }}
                disabled={addToAlbumMutation.isPending}
                loading={albumsLoading}
                placeholder="Search albums..."
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
