"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useWishbook } from "@/contexts/WishbookContext";
import { useAuth } from "@/features/auth/AuthContext";
import type { Favorite, TimeCapsule } from "@/types/wishbook";
import { getCapsule } from "@/features/capsules/api";
import {
  ArrowLeft,
  Clock,
  Globe2,
  Lock,
  Film,
  ImageIcon,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

function getFavoritesForCapsule(
  capsule: TimeCapsule,
  allFavorites: Favorite[],
): Favorite[] {
  if (!capsule.favorites?.length) return [];
  const ids = new Set(capsule.favorites);
  return allFavorites.filter((f) => ids.has(f.id));
}

export default function CapsuleShowPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { favorites } = useWishbook();
  const [preview, setPreview] = useState<
    | {
        type: "image" | "video";
        src: string;
      }
    | null
  >(null);

  const id = typeof params?.id === "string" ? params.id : "";

  const {
    data: capsule,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["capsule", id],
    queryFn: () => getCapsule(id),
    enabled: !!id,
  });

  const capsuleFavorites = useMemo(
    () => (capsule ? getFavoritesForCapsule(capsule, favorites) : []),
    [capsule, favorites],
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">
            Loading capsule...
          </p>
        </div>
      </Layout>
    );
  }

  if (isError || !capsule) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">
            Capsule not found or no longer available.
          </p>
          <Button variant="outline" onClick={() => router.push("/capsules")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to capsules
          </Button>
        </div>
      </Layout>
    );
  }

  const isFuture =
    capsule.visibility === "future" &&
    capsule.unlockAt &&
    capsule.unlockAt.getTime() > Date.now();

  const isOwner = authUser?.id === capsule.userId;

  // Filter out blob: URLs that cannot be reused after reload
  const safeImages =
    (capsule.images ?? []).filter((src) => !src.startsWith("blob:"));
  const safeVideos =
    (capsule.videos ?? []).filter((src) => !src.startsWith("blob:"));
  const safeImage =
    capsule.image && !capsule.image.startsWith("blob:")
      ? capsule.image
      : undefined;

  const coverUrl =
    safeImage ||
    safeImages[0] ||
    safeVideos[0] ||
    "https://picsum.photos/seed/capsule/1200/600";
  const isVideoCover = safeVideos.includes(coverUrl);

  return (
    <Layout className="md:px-0 px-0 pt-0 md:pt-0">
      <div className="min-h-screen pb-12">
        {/* Hero */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          {isVideoCover ? (
            <video
              src={coverUrl}
              className="w-full h-full object-cover brightness-[0.5]"
              autoPlay
              muted
              loop
              onClick={() =>
                setPreview({
                  type: "video",
                  src: coverUrl,
                })
              }
            />
          ) : (
            <img
              src={coverUrl}
              alt={capsule.title}
              className="w-full h-full object-cover brightness-[0.5]"
              onClick={() =>
                setPreview({
                  type: "image",
                  src: coverUrl,
                })
              }
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 md:px-8 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="rounded-full bg-background/60 border border-white/10 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/update-captule/${capsule.id}`)}
                className="rounded-full bg-background/60 border border-white/10 backdrop-blur-sm"
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 px-4 md:px-8 pb-6 flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-primary flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {capsule.period || "Time period not set"}
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {capsule.title}
            </h1>
            {capsule.description && (
              <p className="text-sm text-muted-foreground max-w-xl">
                {capsule.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
              {capsule.visibility === "private" && (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Private capsule</span>
                </>
              )}
              {capsule.visibility === "future" && (
                <>
                  <Lock className="w-3 h-3" />
                  <span>
                    Opens{" "}
                    {capsule.unlockAt
                      ? capsule.unlockAt.toLocaleDateString()
                      : "in future"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-8 grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-start">
          {/* Left: media + favorites */}
          <div className="space-y-6">
            {/* Gallery */}
            {(safeImages.length || safeVideos.length) ?  <div className="elevated-card p-4">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Visual memories
                </h2>
                <div className="columns-2 md:columns-3 gap-3 [column-fill:_balance]">
                  {safeImages.map((src, idx) => (
                    <div
                      key={`img-${idx}-${src}`}
                      className="relative mb-3 break-inside-avoid rounded-xl overflow-hidden border border-white/10 cursor-pointer group"
                      onClick={() =>
                        setPreview({
                          type: "image",
                          src,
                        })
                      }
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                  {safeVideos.map((src, idx) => (
                    <div
                      key={`vid-${idx}-${src}`}
                      className="mb-3 break-inside-avoid rounded-xl border border-white/10 bg-black/60 cursor-pointer group overflow-hidden"
                      onClick={() =>
                        setPreview({
                          type: "video",
                          src,
                        })
                      }
                    >
                      <div className="aspect-video w-full flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Film className="w-4 h-4 text-primary" />
                        <span>Video {idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div> : null}

            {/* Favorites timeline */}
            <div className="elevated-card p-4">
              <h2 className="text-sm font-semibold mb-3">
                Memories in this chapter
              </h2>
              {capsuleFavorites.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No favorites linked yet. Later you can attach movies, songs,
                  books, or places that defined this time.
                </p>
              ) : (
                <div className="space-y-3">
                  {capsuleFavorites.map((fav) => (
                    <Link
                      key={fav.id}
                      href={`/favorites/${fav.id}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/40 p-2.5 hover:border-primary/40 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {fav.image ? (
                          <img
                            src={fav.image}
                            alt={fav.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                            {fav.title}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fav.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground capitalize">
                          {fav.categoryId}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: DNA + story */}
          <div className="space-y-6">
            <div className="elevated-card p-4 space-y-4">
              <h2 className="text-sm font-semibold">Capsule DNA</h2>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Dominant moods
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {capsule.emotions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      No moods added yet.
                    </span>
                  ) : (
                    capsule.emotions.slice(0, 6).map((emotion) => (
                      <span
                        key={emotion}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary border border-primary/30"
                      >
                        {emotion}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Number of memories
                </p>
                <p className="text-sm font-medium">
                  {capsule.favorites.length} favorites
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Created at
                </p>
                <p className="text-sm font-medium">
                  {capsule.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            {capsule.story && (
              <div className="elevated-card p-4">
                <h2 className="text-sm font-semibold mb-2">Story</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {capsule.story}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black">
          <DialogTitle className="sr-only">
            {preview?.type === "video" ? "Video preview" : "Image preview"}
          </DialogTitle>
          {preview?.type === "video" ? (
            <video
              src={preview.src}
              controls
              autoPlay
              className="w-full h-full max-h-[80vh] object-contain"
            />
          ) : preview ? (
            <img
              src={preview.src}
              alt=""
              className="w-full h-full max-h-[80vh] object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

