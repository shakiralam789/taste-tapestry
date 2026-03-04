"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useWishbook } from "@/contexts/WishbookContext";
import { useAuth } from "@/features/auth/AuthContext";
import type { Favorite, TimeCapsule } from "@/types/wishbook";
import { getCapsule, toggleCapsuleLove } from "@/features/capsules/api";
import {
  ArrowLeft,
  Clock,
  Globe2,
  Lock,
  ImageIcon,
  Pencil,
  Heart,
  Play,
} from "lucide-react";
import { VideoThumbnail } from "@/components/common/VideoThumbnail";
import { VideoPlayer } from "@/components/common/VideoPlayer";

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
  const queryClient = useQueryClient();
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

  const [loved, setLoved] = useState(capsule?.lovedByMe ?? false);
  const [loveCount, setLoveCount] = useState(capsule?.loveCount ?? 0);

  useEffect(() => {
    if (!capsule) return;
    setLoved(capsule.lovedByMe ?? false);
    setLoveCount(capsule.loveCount ?? 0);
  }, [capsule?.lovedByMe, capsule?.loveCount]);

  const loveMutation = useMutation({
    mutationFn: () => toggleCapsuleLove(id),
    onMutate: () => {
      setLoved((prev) => !prev);
      setLoveCount((prev) => (loved ? Math.max(prev - 1, 0) : prev + 1));
    },
    onSuccess: ({ loved, count }) => {
      setLoved(loved);
      setLoveCount(count);
      queryClient.setQueryData<TimeCapsule | undefined>(
        ["capsule", id],
        (old) =>
          old
            ? {
                ...old,
                lovedByMe: loved,
                loveCount: count,
              }
            : old,
      );
      queryClient.setQueriesData<TimeCapsule[] | undefined>(
        { queryKey: ["capsules"] },
        (old) =>
          old
            ? old.map((c) =>
                c.id === id ? { ...c, lovedByMe: loved, loveCount: count } : c,
              )
            : old,
      );
    },
  });

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
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
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
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 border border-white/10 hover:border-primary/60 hover:text-primary transition-colors text-xs"
                onClick={() => loveMutation.mutate()}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    loved
                      ? "fill-red-500 text-red-500"
                      : "fill-white/20"
                  }`}
                />
                <span>{loveCount}</span>
              </button>
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
                <div className="columns-2 md:columns-3 gap-0 [column-fill:_balance]">
                  {safeImages.map((src, idx) => (
                    <div
                      key={`img-${idx}-${src}`}
                      className="relative break-inside-avoid overflow-hidden cursor-pointer group"
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  ))}
                  {safeVideos.map((src, idx) => (
                    <div
                      key={`vid-${idx}-${src}`}
                      className="relative break-inside-avoid overflow-hidden bg-black/60 cursor-pointer group"
                      onClick={() =>
                        setPreview({
                          type: "video",
                          src,
                        })
                      }
                    >
                      <VideoThumbnail src={src} className="w-full" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="rounded-full bg-black/60 p-3 text-white border border-white/20">
                          <Play className="w-6 h-6 fill-current pl-0.5" />
                        </div>
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

      {preview && (
        <div
          className="fixed inset-0 z-50 w-screen h-screen bg-black/90 flex items-center justify-center"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative w-full h-full max-w-5xl px-4 md:px-8 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-6 right-8 z-50 rounded-full bg-black/70 border border-white/20 text-white px-3 py-1 text-xs hover:bg-black"
              onClick={() => setPreview(null)}
            >
              Close
            </button>
            {preview.type === "video" ? (
              <div className="w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
                <VideoPlayer
                  src={preview.src}
                  containerClassName="w-full h-full"
                  videoClassName="max-h-[80vh] w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full max-w-3xl max-h-[80vh] bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
                <img
                  src={preview.src}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

