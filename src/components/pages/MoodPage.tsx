"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { MoodSelector } from "@/components/mood/MoodSelector";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";
import { Button } from "@/components/ui/button";
import { moodOptions } from "@/data/mockData";
import {
  useMoodFavorites,
  useMoodPrefetcher,
  moodsToKey,
} from "@/hooks/useMoodFavorites";
import { getRandomFavorite } from "@/features/favorites/api";
import type { Favorite, Mood } from "@/types/wishbook";
import { Sparkles, RefreshCw, Shuffle, Eye, EyeOff } from "lucide-react";

// Whitelist of mood slugs accepted in ?moods=. Anything else is dropped.
const MOOD_IDS = new Set<Mood>(moodOptions.map((m) => m.id as Mood));

function parseMoodsParam(raw: string | null): Mood[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Mood => MOOD_IDS.has(s as Mood));
}

interface MoodPageProps {
  /**
   * When mounted from /moods/[slug], preselect this single mood until the
   * URL is updated by the first user interaction.
   */
  initialMood?: string;
}

export default function MoodPage({ initialMood }: MoodPageProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // The URL is the single source of truth. No local `selectedMoods` state —
  // that previously caused a hydration race where the hook fired with an
  // empty moods[] on first render and an empty result won against the
  // eventual mood-scoped fetch.
  const urlMoods = useMemo<Mood[]>(
    () => parseMoodsParam(searchParams.get("moods")),
    [searchParams],
  );

  const effectiveMoods: Mood[] =
    urlMoods.length > 0
      ? urlMoods
      : initialMood && MOOD_IDS.has(initialMood as Mood)
        ? [initialMood as Mood]
        : [];

  // Always called; the backend treats empty moods[] as "no filter".
  const {
    items,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    refetch,
    moodsKey,
  } = useMoodFavorites(effectiveMoods, { limit: 12 });

  // Hover-optimistic prefetch: when a user hovers a chip we warm the cache
  // for that mood's first page. The eventual click resolves from cache and
  // the grid renders without a network round-trip.
  const prefetchMood = useMoodPrefetcher(12);
  const handleMoodHover = useCallback(
    (moodId: string) => {
      prefetchMood([moodId]);
    },
    [prefetchMood],
  );

  const activeMood: Mood | null = effectiveMoods[0] ?? null;
  const activeOption = activeMood
    ? moodOptions.find((m) => m.id === activeMood)
    : null;

  // URL is the source of truth. startTransition keeps the click snappy: the
  // optimistic UI (chip selected, router pending) renders immediately while
  // React schedules the navigation and refetch.
  const syncUrl = useCallback(
    (next: Mood[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.length === 0) params.delete("moods");
      else params.set("moods", next.join(","));
      const qs = params.toString();
      const target = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        router.replace(target, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  const handleMoodSelect = useCallback(
    (moodId: string) => {
      syncUrl([moodId as Mood]);
    },
    [syncUrl],
  );

  const handleReset = useCallback(() => {
    syncUrl([]);
  }, [syncUrl]);

  // ── Blind-recommendation roulette ────────────────────────────────────────
  // `pick` is the current spin's favorite. `revealed` toggles whether the
  // card is face-up (true) or face-down (false). The "blind" experience:
  // click Spin → blur image + scrambled title → tap "Reveal" to flip.
  const [pick, setPick] = useState<Favorite | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  // Bounded session buffer — last 8 ids get excluded so rapid spins vary.
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const handleSpin = useCallback(async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setRevealed(false);
    setPick(null);
    try {
      const result = await getRandomFavorite(recentIds);
      setPick(result);
      if (result) {
        setRecentIds((prev) => {
          const next = [result.id, ...prev.filter((id) => id !== result.id)];
          return next.slice(0, 8);
        });
      }
    } finally {
      setIsSpinning(false);
    }
  }, [isSpinning, recentIds]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleDismissSpin = useCallback(() => {
    setPick(null);
    setRevealed(false);
  }, []);

  const showResults = effectiveMoods.length > 0;
  // Skeleton-streaming: show shimmer on first load OR while a different
  // mood's data is in flight and we have nothing to show yet. Once any
  // items are present we keep them visible (placeholderData-style) so
  // transitions feel instantaneous.
  const isHydrating =
    isLoading || (isFetching && items.length === 0 && moodsKey.length > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  } as const;

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Mood-Based Discovery</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              How are you feeling{" "}
              <span className="gradient-text">today?</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Select your current mood and we&apos;ll show you recommendations
              that match how you feel right now.
            </p>
          </motion.div>

          {/* Mood Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <MoodSelector
              moods={moodOptions}
              selectedMood={activeMood}
              onSelect={handleMoodSelect}
              onHover={handleMoodHover}
            />
          </motion.div>

          {/* Results */}
          {showResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeOption?.emoji}</span>
                  <div>
                    <h2 className="font-display text-2xl font-semibold">
                      Feeling {activeOption?.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {items.length}{" "}
                      {isHydrating ? "loading…" : "recommendations for you"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RefreshCw className="w-4 h-4" />
                    Change Mood
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                  >
                    <Shuffle className="w-4 h-4" />
                    Surprise Me
                  </Button>
                </div>
              </div>

              {/* Results Grid — skeleton-streaming */}
              {isHydrating ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-48 rounded-2xl bg-muted/40 animate-pulse"
                    />
                  ))}
                </div>
              ) : items.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {items.map((favorite) => (
                    <motion.div key={favorite.id} variants={itemVariants}>
                      <FavoriteCard favorite={favorite} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    No matches yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    We don&apos;t have favorites tagged with{" "}
                    {activeOption?.name ?? "this mood"} yet.
                  </p>
                  <Button variant="gradient">
                    Add Your First {activeOption?.name} Favorite
                  </Button>
                </motion.div>
              )}

              {/* Infinite-scroll sentinel */}
              {hasNextPage && !isHydrating && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetching}
                  >
                    {isFetching ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Blind Recommendation Feature */}
          {!showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-xl mx-auto mt-16"
            >
              <div className="elevated-card p-8">
                <div className="text-center">
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ background: "var(--gradient-sunset)" }}
                  >
                    <Shuffle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display md:text-xl text-lg font-semibold mb-2">
                    Blind Recommendation Roulette
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-6">
                    Feeling adventurous? Get a random recommendation without
                    knowing what it is. Experience first, then judge!
                  </p>
                  <Button
                    variant="glow"
                    size="lg"
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className="min-w-[160px]"
                  >
                    {isSpinning ? "Spinning…" : "Spin the Wheel"}
                  </Button>

                </div>

                <AnimatePresence mode="wait">
                  {pick && !revealed && (
                    <motion.div
                      key="blurred"
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className="mt-8 p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                          Mystery pick
                        </span>
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      </div>

                      <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 bg-muted">
                        {pick.image && (
                          <img
                            src={pick.image}
                            alt=""
                            aria-hidden
                            className="w-full h-full object-cover blur-2xl scale-110 saturate-150"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                          <span className="font-display text-xl">?????</span>
                        </div>
                      </div>

                      <div className="h-4 w-3/4 mx-auto rounded bg-muted blur-sm mb-2" />
                      <div className="h-3 w-1/2 mx-auto rounded bg-muted/70 blur-sm mb-6" />

                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleReveal}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Reveal
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDismissSpin}
                          className="gap-2"
                        >
                          <EyeOff className="w-4 h-4" />
                          Skip
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {pick && revealed && (
                    <motion.div
                      key="revealed"
                      initial={{ opacity: 0, rotateY: 90 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: -90 }}
                      transition={{ duration: 0.4 }}
                      className="mt-8 text-left"
                    >
                      <FavoriteCard favorite={pick} />
                      <div className="flex justify-center mt-4 gap-2">
                        <Button variant="glow" size="sm" onClick={handleSpin}>
                          Spin again
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleDismissSpin}>
                          Close
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
