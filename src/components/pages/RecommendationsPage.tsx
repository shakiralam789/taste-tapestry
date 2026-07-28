"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";
import {
  getSystemRecommendations,
  type RecommendationItem,
} from "@/features/favorites/api";
import { useAuth } from "@/features/auth/AuthContext";
import type { Favorite } from "@/types/wishbook";
import {
  Sparkles,
  RefreshCw,
  Shuffle,
  Users,
  User,
} from "lucide-react";

type Scope = "network" | "all";

/**
 * Full-page destination of the Sparkles dropdown's "See all suggestions"
 * link. Reuses the same `FavoriteCard` used by the rest of the app so the
 * grid feels native to the rest of Taste Tapestry.
 *
 * The backend `/feed` endpoint is bucket-cached (no offset), so we fetch a
 * single large page (48) and let the user bust the cache with Refresh.
 */
export default function RecommendationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [scope, setScope] = useState<Scope>("network");

  const queryKey = useMemo(
    () => ["recommendations", "page", scope] as const,
    [scope],
  );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () =>
      getSystemRecommendations({
        limit: 48,
        bust: scope === "all", // explore-beyond-network always pulls fresh
      }),
    staleTime: 60_000,
  });

  const items: RecommendationItem[] = data?.items ?? [];
  const cached = data?.cached;

  const handleSurpriseMe = () => {
    if (items.length === 0) return;
    const choice = items[Math.floor(Math.random() * items.length)];
    router.push(`/favorites/${choice.item.id}`);
  };

  const handleRefresh = () => {
    refetch();
  };

  const showSkeleton = isLoading || (isFetching && items.length === 0);

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Suggested for you</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
              Hand-picked{" "}
              <span className="gradient-text">from your network</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Favorites curated by people you follow — ranked by taste,
              activity, and recency. Follow more to broaden the pool.
            </p>
          </motion.div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✨</span>
              <div>
                <h2 className="font-display text-2xl font-semibold">
                  {items.length > 0
                    ? `${items.length} recommendation${items.length === 1 ? "" : "s"}`
                    : "Building your feed"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {cached
                    ? "Served from cache — refresh for a fresh mix"
                    : isFetching
                      ? "Updating…"
                      : "Live ranking"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              {user && (
                <Button
                  variant={scope === "network" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScope("network")}
                  className="gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  From your network
                </Button>
              )}
              <Button
                variant={scope === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setScope("all")}
                className="gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                Explore beyond network
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleSurpriseMe}
                disabled={items.length === 0}
                className="gap-1.5"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Surprise me
              </Button>
            </div>
          </div>

          {/* Grid */}
          {showSkeleton ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState scope={scope} />
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {items.map((rec) => {
                const favorite = recToFavorite(rec);
                return (
                  <motion.div
                    key={`${rec.source}:${rec.id}`}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <FavoriteCard
                      favorite={favorite}
                      onClick={() => router.push(`/favorites/${rec.item.id}`)}
                      showSaveButton
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function EmptyState({ scope }: { scope: Scope }) {
  return (
    <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/40">
      <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <h3 className="font-display text-xl font-semibold mb-2">
        No suggestions yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {scope === "network"
          ? "Follow more people with overlapping taste to unlock personalized recommendations."
          : "Nothing to surface right now — try refreshing in a few minutes."}
      </p>
    </div>
  );
}

/**
 * Adapts a RecommendationItem to the Favorite shape that FavoriteCard
 * expects. Fields not exposed by the recommendation payload fall back to
 * safe defaults so the card renders without runtime errors.
 */
function recToFavorite(rec: RecommendationItem): Favorite {
  const { item, owner } = rec;
  return {
    id: item.id,
    userId: owner.id,
    categoryId: item.categoryId,
    title: item.title,
    image: item.image ?? undefined,
    // Recommendation payload only carries a single rating (1-5). The card
    // displays it on the same 10-point chip used elsewhere, so we keep the
    // raw value — the star chip is hidden when rating is 0.
    rating: item.rating ?? 0,
    mood: [],
    whyILike: item.whyILike ?? "",
    tags: [],
    createdAt: new Date(item.createdAt),
    fields: {},
    status: "published",
    author: {
      id: owner.id,
      name: owner.displayName,
      username: owner.username,
      avatar: owner.avatar ?? null,
    },
  };
}