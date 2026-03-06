"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { AlbumCard } from "@/components/albums/AlbumCard";
import { ClientOnly } from "@/components/common/ClientOnly";
import {
  Images,
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  MoreHorizontal,
  Lock,
  Globe,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import {
  createAlbum,
  deleteAlbum,
  getAlbums,
  updateAlbum,
} from "@/features/albums/api";
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
import { useAuth } from "@/features/auth/AuthContext";
import type { Album } from "@/types/wishbook";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlbumForm,
  type AlbumFormValues,
} from "@/components/albums/AlbumForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "nextjs-toploader/app";

export function AlbumsPageInner() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [albumToEdit, setAlbumToEdit] = useState<Album | null>(null);
  const router = useRouter();

  const {
    data: albums = [],
    isLoading: albumsLoading,
    isError: albumsError,
  } = useQuery({
    queryKey: ["albums"],
    queryFn: getAlbums,
  });

  const createAlbumMutation = useMutation({
    mutationFn: createAlbum,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Album created");
      setCreateOpen(false);
    },
    onError: () => toast.error("Could not create album"),
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteAlbum(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Album deleted");
      setAlbumToDelete(null);
    },
    onError: () => {
      toast.error("Could not delete album");
    },
  });

  const staggerDelay = 0.08;

  const updateAlbumMutation = useMutation({
    mutationFn: async (payload: { id: string; values: AlbumFormValues }) => {
      await updateAlbum(payload.id, payload.values);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["albums"] });
      void queryClient.invalidateQueries({ queryKey: ["album-show", variables.id] });
      toast.success("Album updated");
      setEditOpen(false);
      setAlbumToEdit(null);
    },
    onError: () => toast.error("Could not update album"),
  });

  const toggleAlbumVisibilityMutation = useMutation({
    mutationFn: async ({
      id,
      isPublic,
    }: { id: string; isPublic: boolean }) =>
      updateAlbum(id, { isPublic }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["albums"] });
      void queryClient.invalidateQueries({ queryKey: ["album-show", variables.id] });
      toast.success(variables.isPublic ? "Album is now public" : "Album is now private");
    },
    onError: () => toast.error("Could not update visibility"),
  });

  return (
    <Layout className="px-0 md:px-0 pt-0">
      <header className="px-4 py-3 border-b border-white/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="border rounded-full shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </header>
      <div className="min-h-screen py-12">

        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Images className="w-4 h-4" />
              <span className="text-sm font-medium">
                Curate albums of your taste
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
              Your <span className="gradient-text">Albums</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Group any mix of movies, series, songs, and books into beautiful
              themed albums you can revisit and share.
            </p>
          </motion.div>

          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex justify-center mb-10"
          >
            <Button
              variant="gradient"
              size="lg"
              className="rounded-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-5 h-5" />
              Create New Album
            </Button>
          </motion.div>

          {/* Albums Grid / Empty State */}
          {albumsLoading ? (
            <div className="flex justify-center py-16 text-sm text-muted-foreground">
              Loading albums...
            </div>
          ) : albumsError ? (
            <div className="flex justify-center py-16 text-sm text-red-400">
              We couldn&apos;t load your albums right now.
            </div>
          ) : albums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * staggerDelay, duration: 0.25 }}
                  className="relative group"
                >
                  <Link href={`/albums/${album.id}`} className="block h-full">
                    <AlbumCard album={album} />
                  </Link>
                  {authUser && authUser.id === album.userId && (
                    <div className="absolute top-3 right-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full bg-background/90 border border-white/20 p-1 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/60 backdrop-blur-sm shadow-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            aria-label="Album actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-32 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onSelect={(event) => {
                              event.preventDefault();
                              setAlbumToEdit(album);
                              setEditOpen(true);
                            }}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onSelect={(event) => {
                              event.preventDefault();
                              if (toggleAlbumVisibilityMutation.isPending) return;
                              toggleAlbumVisibilityMutation.mutate({
                                id: album.id,
                                isPublic: !(album.isPublic ?? true),
                              });
                            }}
                          >
                            {(album.isPublic ?? true) ? (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>Make private</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-3 h-3" />
                                <span>Make public</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 hover:text-white text-destructive"
                            onSelect={(event) => {
                              event.preventDefault();
                              setAlbumToDelete(album);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Add new card */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: albums.length * staggerDelay,
                  duration: 0.25,
                }}
              >
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="group h-full w-full rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 bg-card/30 flex flex-col items-center justify-center gap-4 px-6 py-8 cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Start a new album</p>
                    <p className="text-sm text-muted-foreground">
                      Combine any favorites into a themed collection.
                    </p>
                  </div>
                </button>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="max-w-xl mx-auto text-center rounded-2xl border border-dashed border-white/10 bg-card/30 px-8 py-10"
            >
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">
                No albums yet
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Create your first album to bundle your comfort movies, favorite
                series, healing songs, and unforgettable books in one place.
              </p>
              <Button
                variant="gradient"
                className="rounded-full"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Create an album
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <AlertDialog
        open={!!albumToDelete}
        onOpenChange={(open) => {
          if (!open) setAlbumToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this album?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the album from your list but{" "}
              <span className="font-medium">won&apos;t delete</span> any of the
              favorites inside.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {albumToDelete && (
            <div className="mt-3 rounded-xl border border-white/10 bg-card/40 p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {albumToDelete.name}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              onClick={() => setAlbumToDelete(null)}
              disabled={deleteAlbumMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAlbumMutation.isPending || !albumToDelete}
              onClick={async () => {
                if (!albumToDelete) return;
                await deleteAlbumMutation.mutateAsync(albumToDelete.id);
              }}
            >
              {deleteAlbumMutation.isPending ? "Deleting..." : "Delete album"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (createAlbumMutation.isPending) return;
          setCreateOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Create album</DialogTitle>
          </DialogHeader>
          <AlbumForm
            mode="create"
            submitting={createAlbumMutation.isPending}
            onSubmit={async (values) => {
              await createAlbumMutation.mutateAsync({
                ...values,
                favoriteIds: [],
              });
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (updateAlbumMutation.isPending) return;
          setEditOpen(open);
          if (!open) setAlbumToEdit(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit album</DialogTitle>
          </DialogHeader>
          {albumToEdit && (
            <AlbumForm
              mode="edit"
              initialValues={{
                name: albumToEdit.name,
                description: albumToEdit.description ?? "",
                coverImage: albumToEdit.coverImage ?? "",
              }}
              submitting={updateAlbumMutation.isPending}
              onSubmit={async (values) => {
                await updateAlbumMutation.mutateAsync({
                  id: albumToEdit.id,
                  values,
                });
              }}
              onCancel={() => setEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default function AlbumsPage() {
  return (
    <ClientOnly>
      <AlbumsPageInner />
    </ClientOnly>
  );
}

