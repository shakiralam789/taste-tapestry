"use client";

import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useQuery,
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

/**
 * Single-shot count of the caller's own favorites in this mood. Used by the
 * "Include mine (N)" chip on /mood so users can decide whether to toggle
 * their collection into the discovery grid. Hits the same paginated
 * endpoint with limit=1, so the round-trip is tiny.
 */
export function useMoodMineCount(moods: readonly string[]) {
  const key = useMemo(() => moodsToKey(moods), [moods]);
  return useQuery({
    queryKey: ["mood-favorites-mine-count", key],
    queryFn: () => getFavoritesByMoods(0, key.length > 0 ? key.split(",") : [], 1, "newest", "mine"),
    enabled: key.length > 0,
    staleTime: 1000 * 60,
    select: (page) => {
      // When `scope=mine` is used the endpoint only returns items where
      // userId === caller. We need a count, not the page contents, but the
      // backend doesn't expose a count-only route, so we treat
      // `hasMore || items.length > 0` as ">= 1" and rely on `nextOffset`
      // for an exact tally on the first page.
      const base = page.items.length;
      const extra = page.hasMore ? page.nextOffset - base : 0;
      return base + extra;
    },
  });
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
        queryKey: [...moodFavoritesKey(key), "all"],
        queryFn: ({ pageParam = 0 }) =>
          getFavoritesByMoods(pageParam, key.split(","), limit, "newest", "all"),
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
    scope?: "all" | "mine";
  },
) {
  const key = useMemo(() => moodsToKey(moods), [moods]);
  const limit = options?.limit ?? 12;
  const sortBy = options?.sortBy ?? "newest";
  const scope = options?.scope ?? "all";
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
    queryKey: [...moodFavoritesKey(key), scope],
    queryFn: ({ pageParam = 0 }) => {
      const moodsForFetch = key.length > 0 ? key.split(",") : [];
      return getFavoritesByMoods(
        pageParam,
        moodsForFetch,
        limit,
        sortBy,
        scope,
      );
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
