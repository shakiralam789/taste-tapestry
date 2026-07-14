"use client";

import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Favorite } from "@/types/wishbook";
import {
  getFavoritesByMoods,
  type FavoritesPageResponse,
} from "@/features/favorites/api";

// ── Cache keys ──────────────────────────────────────────────────────────────
// `moodsKey` keeps the key stable across renders with the same mood set so
// TanStack Query doesn't refetch when the parent re-renders with a fresh
// array reference. The love/save hooks patch these keys on heart/save
// toggles so counts stay reactive across the mood grid.
export const MOOD_FAVORITES_KEY = "mood-favorites";
export const moodFavoritesKey = (moodsKey: string) =>
  [MOOD_FAVORITES_KEY, moodsKey] as const;

/**
 * Stable string form of a mood array — joins lowercased, trimmed slugs.
 * Empty string = no mood filter (returns the public newest feed).
 */
export function moodsToKey(moods: readonly string[]): string {
  return moods
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(",");
}

// ── Prefetch helper ─────────────────────────────────────────────────────────
// Hover over a chip → seed the cache so the eventual click resolves from
// cache. The page must opt in via the `usePrefetchMood()` hook (which
// reads the QueryClient directly, never re-renders).
export function useMoodPrefetcher(limit = 12) {
  const queryClient = useQueryClient();

  return useCallback(
    (moods: readonly string[]) => {
      const key = moodsToKey(moods);
      if (key.length === 0) return;
      void queryClient.prefetchInfiniteQuery({
        queryKey: moodFavoritesKey(key),
        queryFn: ({ pageParam = 0 }) =>
          getFavoritesByMoods(pageParam, key.split(","), limit, "newest"),
        initialPageParam: 0,
      });
    },
    [queryClient, limit],
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────
/**
 * Mood-filtered infinite-scroll favorites for /mood and /moods/[slug].
 * Returns paginated pages plus a flattened `items` array for easy rendering.
 * With no moods selected the query is gated off (callers can pass
 * `enabled: true` to fetch the public timeline).
 */
export function useMoodFavorites(
  moods: readonly string[],
  options?: {
    limit?: number;
    sortBy?: "newest" | "oldest" | "rating_desc" | "rating_asc";
    enabled?: boolean;
  },
) {
  const key = useMemo(() => moodsToKey(moods), [moods]);
  const limit = options?.limit ?? 12;
  const sortBy = options?.sortBy ?? "newest";
  // Caller must opt in to fetching without a mood. With no moods selected
  // we keep the page in its "pick a mood first" state instead of falling
  // back to the user's own favorites feed (which would be confusing).
  const enabled = options?.enabled ?? key.length > 0;

  const query = useInfiniteQuery<
    FavoritesPageResponse,
    Error,
    { pages: FavoritesPageResponse[]; pageParams: unknown[] },
    readonly unknown[],
    number
  >({
    queryKey: moodFavoritesKey(key),
    queryFn: ({ pageParam = 0 }) => {
      const moodsForFetch = key.length > 0 ? key.split(",") : [];
      return getFavoritesByMoods(pageParam, moodsForFetch, limit, sortBy);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    enabled,
  });

  const items = useMemo<Favorite[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  return {
    ...query,
    items,
    moodsKey: key,
  };
}
