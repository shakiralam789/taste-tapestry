"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  getAlbum,
  getAlbumItemCounts,
  getAlbumItems,
  updateAlbum,
} from "@/features/albums/api";
import { ArrowLeft, Edit3, Film, Music, BookOpen, Tv, Trash2 } from "lucide-react";
import { ProfilePostCard } from "@/components/profile/ProfilePostCard";
import { useAuth } from "@/features/auth/AuthContext";
import { toast } from "sonner";
import type { Favorite } from "@/types/wishbook";

const DEFAULT_ALBUM_IMAGE = "/images/default-cover-image.jpg";
const DEFAULT_ALBUM_IMAGE_DARK = "/images/default-cover-image-dark.jpg";

const CATEGORY_TABS = [
  { value: "all", label: "All" },
  { value: "movies", label: "Movie", icon: Film },
  { value: "series", label: "Series", icon: Tv },
  { value: "songs", label: "Song", icon: Music },
  { value: "books", label: "Book", icon: BookOpen },
] as const;

export default function AlbumShowPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof CATEGORY_TABS)[number]["value"]>("all");
  const [favoriteToRemove, setFavoriteToRemove] = useState<Favorite | null>(null);

  const {
    data: album,
    isLoading: albumLoading,
    isError: albumError,
  } = useQuery({
    queryKey: ["album", id],
    queryFn: () => getAlbum(typeof id === "string" ? id : ""),
    enabled: typeof id === "string",
  });

  const {
    data: counts,
  } = useQuery({
    queryKey: ["album-item-counts", id],
    queryFn: () => getAlbumItemCounts(typeof id === "string" ? id : ""),
    enabled: typeof id === "string",
  });

  const {
    data: albumItems = [],
  } = useQuery({
    queryKey: ["album-items", id, activeTab],
    queryFn: () =>
      getAlbumItems(
        typeof id === "string" ? id : "",
        activeTab === "all" ? undefined : activeTab,
      ),
    enabled: typeof id === "string",
  });

  const visibleTabs = CATEGORY_TABS.filter((tab) => {
    if (!counts) return tab.value === "all";
    if (tab.value === "all") return (counts.all ?? 0) > 0;
    const key = tab.value as keyof typeof counts;
    return (counts[key] ?? 0) > 0;
  });

  useEffect(() => {
    if (!visibleTabs.length) return;
    if (!visibleTabs.some((tab) => tab.value === activeTab)) {
      setActiveTab(visibleTabs[0].value);
    }
  }, [visibleTabs, activeTab]);

  const removeFromAlbumMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      if (!album) throw new Error("Album not loaded");
      const nextIds = (album.favoriteIds ?? []).filter((id) => id !== favoriteId);
      return updateAlbum(album.id, { favoriteIds: nextIds });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["album", id] });
      void queryClient.invalidateQueries({ queryKey: ["album-item-counts", id] });
      void queryClient.invalidateQueries({ queryKey: ["album-items", id, activeTab] });
      toast.success("Removed from album");
    },
    onError: () => {
      toast.error("Could not remove from album");
    },
  });

  useEffect(() => {
    if (!visibleTabs.length) return;
    if (!visibleTabs.some((tab) => tab.value === activeTab)) {
      setActiveTab(visibleTabs[0].value);
    }
  }, [visibleTabs, activeTab]);

  if (albumLoading || !album || !counts) {
    return <FullScreenLoader />;
  }

  if (albumError) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this album.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="px-0 md:px-0 pt-0 md:pt-0">
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Link href={`/albums/${album.id}/edit`}>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                aria-label="Edit album"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 pb-16">
          {/* Album header */}
          <section className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="w-full md:w-64 aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-white/5">
              <img
                src={album.coverImage || DEFAULT_ALBUM_IMAGE}
                alt={album.name}
                className="dark:hidden w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_ALBUM_IMAGE;
                }}
              />
              <img
                src={album.coverImage || DEFAULT_ALBUM_IMAGE_DARK}
                alt={album.name}
                className="hidden dark:block w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_ALBUM_IMAGE_DARK;
                }}
              />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2">
                {album.name}
              </h1>
              {album.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {album.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {counts.all} {counts.all === 1 ? "item" : "items"} in this album
              </p>
            </div>
          </section>

          {/* Items list with category tabs */}
          <section>
            {counts.all === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-card/30 p-6 text-sm text-muted-foreground">
                This album doesn&apos;t have any items yet. Add favorites from
                your profile collection.
              </div>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={(val) =>
                  setActiveTab(val as (typeof CATEGORY_TABS)[number]["value"])
                }
                className="w-full"
              >
                <TabsList className="w-full justify-start flex-wrap bg-transparent border-b border-white/10 p-0 h-auto rounded-none gap-0">
                  {visibleTabs.map((tab) => {
                    const Icon = "icon" in tab ? tab.icon : undefined;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="rounded-none border-b-2 border-transparent px-0 py-4 mr-6 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-sm gap-1.5"
                      >
                        {Icon ? <Icon className="w-4 h-4" /> : null}
                        {tab.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {visibleTabs.map((tab) => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="mt-6"
                  >
                    {albumItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-card/20 p-6 text-sm text-muted-foreground text-center">
                        No {tab.label.toLowerCase()} in this album.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {albumItems.map((favorite) => (
                          <div key={favorite.id} className="relative group">
                            <Link
                              href={`/favorites/${favorite.id}`}
                              className="block"
                            >
                              <ProfilePostCard
                                favorite={favorite}
                                variant="grid"
                              />
                            </Link>
                            {authUser && authUser.id === album.userId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (removeFromAlbumMutation.isPending) return;
                                  setFavoriteToRemove(favorite);
                                }}
                                className=" absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-background/90 border border-white/20 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-destructive hover:border-destructive/60 backdrop-blur-sm shadow-sm"
                                aria-label="Remove from album"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </section>
        </main>
      </div>

      <AlertDialog
        open={!!favoriteToRemove}
        onOpenChange={(open) => {
          if (!open) setFavoriteToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from album?</AlertDialogTitle>
            <AlertDialogDescription>
              This won&apos;t delete the favorite itself — it will only remove it
              from <span className="font-medium">{album.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {favoriteToRemove && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/40 p-3 mt-2">
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {favoriteToRemove.image ? (
                  <img
                    src={favoriteToRemove.image}
                    alt={favoriteToRemove.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground px-1 text-center">
                    {favoriteToRemove.title}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {favoriteToRemove.title}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {favoriteToRemove.categoryId}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              onClick={() => setFavoriteToRemove(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                removeFromAlbumMutation.isPending || !favoriteToRemove
              }
              onClick={async () => {
                if (!favoriteToRemove) return;
                await removeFromAlbumMutation.mutateAsync(
                  favoriteToRemove.id,
                );
                setFavoriteToRemove(null);
              }}
            >
              {removeFromAlbumMutation.isPending
                ? "Removing..."
                : "Remove from album"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

