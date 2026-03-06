import {
  getFavorites,
  updateFavorite,
  deleteFavorite,
  PROFILE_PREVIEW_LIMIT,
} from "@/features/favorites/api";
import { getCookie, setCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CATEGORY_TABS } from "@/features/albums/constants";
import { ProfilePostCard } from "@/components/profile/ProfilePostCard";
import { ProfilePostCardSkeleton } from "@/components/profile/ProfilePostCardSkeleton";
import type { Favorite } from "@/types/wishbook";
import { Button } from "@/components/ui/button";
import { AddToAlbumDropdown } from "@/components/albums/AddToAlbumDropdown";
import { getAlbums, updateAlbum } from "@/features/albums/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  Images,
  Plus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Lock,
  Globe,
  Trash2,
  ChevronRight,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useRouter } from "nextjs-toploader/app";
import { useAuth } from "@/features/auth/AuthContext";

export default function MyCollections() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | "all"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const stored = getCookie("profileCollectionView");
    return stored === "list" || stored === "grid" ? stored : "grid";
  });
  const [favoriteToDelete, setFavoriteToDelete] = useState<Favorite | null>(
    null,
  );
  const [albumPickerOpen, setAlbumPickerOpen] = useState(false);
  const [albumPickerFavorite, setAlbumPickerFavorite] =
    useState<Favorite | null>(null);

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["favorites", selectedCategoryFilter],
    queryFn: async (): Promise<Favorite[]> => {
      const categoryId =
        selectedCategoryFilter === "all" ? undefined : selectedCategoryFilter;
      return getFavorites(categoryId);
    },
  });

  const { data: albums = [], isLoading: albumsLoading } = useQuery({
    queryKey: ["albums"],
    queryFn: getAlbums,
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: deleteFavorite,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      void queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Item deleted");
      setFavoriteToDelete(null);
    },
    onError: () => {
      toast.error("Could not delete item");
    },
  });

  const toggleFavoriteVisibilityMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      updateFavorite(id, { isPublic }),
    onSuccess: (_, { isPublic }) => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(isPublic ? "Item is now public" : "Item is now private");
    },
    onError: () => toast.error("Could not update visibility"),
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };
  const addToAlbumMutation = useMutation({
    mutationFn: async (args: { albumId: string; favoriteId: string }) => {
      const currentAlbum = albums.find((a) => a.id === args.albumId);
      if (!currentAlbum) throw new Error("Album not found");
      const currentIds = currentAlbum.favoriteIds ?? [];
      if (currentIds.includes(args.favoriteId)) return currentAlbum;
      const nextIds = [...currentIds, args.favoriteId];
      return updateAlbum(args.albumId, { favoriteIds: nextIds });
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["albums"] });
      void queryClient.invalidateQueries({
        queryKey: ["album-show", variables.albumId],
      });
      toast.success("Added to album");
    },
    onError: () => toast.error("Could not add to album"),
  });

  useEffect(() => {
    setCookie("profileCollectionView", viewMode, {
      maxAgeSeconds: 60 * 60 * 24 * 365,
      path: "/",
    });
  }, [viewMode]);
  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-display font-bold">My collection</h3>
            <p className="text-muted-foreground text-sm">
              Curated favorites — movies, songs, books, places. Your taste, your
              story.
            </p>
          </div>
          <div className="w-full sm:w-auto flex items-center gap-3">
            <Link href="/albums" className="flex-1 sm:flex-none">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto rounded-full"
              >
                <Images className="w-3.5 h-3.5" />
                Albums
              </Button>
            </Link>
            <Link
              href={
                selectedCategoryFilter === "all"
                  ? "/add-favorite"
                  : `/add-favorite?category=${selectedCategoryFilter}`
              }
              className="flex-1 sm:flex-none"
            >
              <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-full">
                <Plus className="w-4 h-4 mr-1 group-hover:rotate-90 transition-transform" />{" "}
                Add new
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TABS.map((cat) => {
              const Icon = "icon" in cat ? cat.icon : undefined;

              return (
                <Button
                  key={cat.value}
                  type="button"
                  size="sm"
                  variant={
                    selectedCategoryFilter === cat.value ? "default" : "outline"
                  }
                  onClick={() => setSelectedCategoryFilter(cat.value)}
                  className={`rounded-full`}
                >
                  <span aria-hidden >
                    {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                  </span>
                  <span className="hidden sm:block">{cat.label}</span>
                </Button>
              );
            })}
          </div>
          <div className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/60 px-0.5 py-0.5">
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
        {favoritesLoading && favorites.length === 0 ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <ProfilePostCardSkeleton key={idx} variant={viewMode} />
          ))
        ) : favorites.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              {selectedCategoryFilter === "all"
                ? "No items in your collection yet."
                : `No ${CATEGORY_TABS.find((c) => c.value === selectedCategoryFilter)?.label ?? selectedCategoryFilter} in your collection.`}
            </p>
            <Link href="/add-favorite">
              <Button variant="outline" size="sm" className="rounded-full mt-2">
                <Plus className="w-4 h-4" />
                Add your first
              </Button>
            </Link>
          </div>
        ) : (
          favorites.slice(0, PROFILE_PREVIEW_LIMIT).map((favorite) => (
            <div
              key={favorite.id}
              className={`relative ${viewMode === "list" ? "w-full" : ""}`}
            >
              <ProfilePostCard
                favorite={favorite}
                variant={viewMode}
                onTitleClick={() => router.push(`/favorites/${favorite.id}`)}
              />
              {authUser && (
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center size-8 rounded-full bg-background/95 border border-white/20 shadow-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-white/30 backdrop-blur-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        aria-label="Item actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer"
                        onSelect={(e) => {
                          e.preventDefault();
                          setAlbumPickerFavorite(favorite);
                          setAlbumPickerOpen(true);
                        }}
                      >
                        <Images className="w-4 h-4" />
                        Add to album
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer"
                        onSelect={(e) => {
                          e.preventDefault();
                          if (toggleFavoriteVisibilityMutation.isPending)
                            return;
                          toggleFavoriteVisibilityMutation.mutate({
                            id: favorite.id,
                            isPublic: !(favorite.isPublic ?? true),
                          });
                        }}
                      >
                        {(favorite.isPublic ?? true) ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Make private
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4" />
                            Make public
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                        onSelect={(e) => {
                          e.preventDefault();
                          if (deleteFavoriteMutation.isPending) return;
                          setFavoriteToDelete(favorite);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))
        )}
        {favorites.length > PROFILE_PREVIEW_LIMIT && (
          <div className="col-span-full flex justify-center pt-4">
            <Link
              href={
                selectedCategoryFilter === "all"
                  ? "/profile/collection"
                  : `/profile/collection?category=${selectedCategoryFilter}`
              }
            >
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
              >
                See all ({favorites.length})
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      <AlertDialog
        open={!!favoriteToDelete}
        onOpenChange={(open) => {
          if (!open) setFavoriteToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove it from your collection. It will also
              be removed from any albums it was added to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {favoriteToDelete && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/40 p-3 mt-2">
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {favoriteToDelete.image ? (
                  <img
                    src={favoriteToDelete.image}
                    alt={favoriteToDelete.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground px-1 text-center">
                    {favoriteToDelete.title}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {favoriteToDelete.title}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {favoriteToDelete.categoryId}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setFavoriteToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFavoriteMutation.isPending || !favoriteToDelete}
              onClick={async () => {
                if (!favoriteToDelete) return;
                await deleteFavoriteMutation.mutateAsync(favoriteToDelete.id);
              }}
            >
              {deleteFavoriteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={albumPickerOpen}
        onOpenChange={(open) => {
          setAlbumPickerOpen(open);
          if (!open) setAlbumPickerFavorite(null);
        }}
      >
        <DialogContent className="sm:max-w-md overflow-visible">
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
                <span className="font-medium">{albumPickerFavorite.title}</span>
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
    </>
  );
}
