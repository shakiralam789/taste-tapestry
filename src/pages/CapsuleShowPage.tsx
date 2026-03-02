"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useWishbook } from "@/contexts/WishbookContext";
import type { Favorite, TimeCapsule } from "@/types/wishbook";
import {
  ArrowLeft,
  Clock,
  Globe2,
  Lock,
  Film,
  ImageIcon,
} from "lucide-react";

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
  const { timeCapsules, favorites } = useWishbook();

  const id = typeof params?.id === "string" ? params.id : "";
  const capsule = timeCapsules.find((c) => c.id === id) ?? null;

  const capsuleFavorites = useMemo(
    () => (capsule ? getFavoritesForCapsule(capsule, favorites) : []),
    [capsule, favorites],
  );

  if (!capsule) {
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

  const coverUrl =
    capsule.image || capsule.images?.[0] || capsule.videos?.[0] || "https://picsum.photos/seed/capsule/1200/600";
  const isVideoCover =
    !!coverUrl && (capsule.videos ?? []).includes(coverUrl);

  return (
    <Layout>
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
            />
          ) : (
            <img
              src={coverUrl}
              alt={capsule.title}
              className="w-full h-full object-cover brightness-[0.5]"
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
              {(!capsule.visibility || capsule.visibility === "public") && (
                <>
                  <Globe2 className="w-3 h-3" />
                  <span>Public capsule</span>
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
            {(capsule.images?.length || capsule.videos?.length) && (
              <div className="elevated-card p-4">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Visual memories
                </h2>
                <div className="flex flex-wrap gap-3">
                  {capsule.images?.map((src, idx) => (
                    <div
                      key={`img-${idx}-${src}`}
                      className="w-24 h-24 rounded-xl overflow-hidden border border-white/10"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {capsule.videos?.map((src, idx) => (
                    <div
                      key={`vid-${idx}-${src}`}
                      className="w-32 h-24 rounded-xl border border-white/10 bg-black/60 flex items-center justify-center gap-2 text-xs text-muted-foreground"
                    >
                      <Film className="w-4 h-4 text-primary" />
                      <span>Video {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
    </Layout>
  );
}

