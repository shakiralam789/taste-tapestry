"use client";

import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFavoriteSaveStatus,
  getSavedFavoriteIds,
  toggleFavoriteSave,
} from "@/features/saved/api";
import { useAuth } from "@/features/auth/AuthContext";

// ── Cache keys ──────────────────────────────────────────────────────────────
export const SAVED_FAVORITE_IDS_KEY = ["saved", "favorites", "ids"] as const;
const favoriteSaveKey = (id: string) => ["favorite-save", id] as const;

// ── Shared IDs query ────────────────────────────────────────────────────────
// One request per page. Every <FavoriteCard> reads from this; nobody
// issues a per-card GET. staleTime is intentionally long so scrolling
// doesn't refetch.
export function useSavedFavoriteIds() {
  const { user } = useAuth();
  return useQuery<string[]>({
    queryKey: SAVED_FAVORITE_IDS_KEY,
    queryFn: getSavedFavoriteIds,
    enabled: !!user,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });
}

// O(1) lookup against the shared IDs list. Safe to call from every card
// in a list — no extra requests.
export function useIsFavoriteSaved(favoriteId: string): boolean {
  const { data: savedIds = [] } = useSavedFavoriteIds();
  return savedIds.includes(favoriteId);
}

// ── Mutation-only toggle ───────────────────────────────────────────────────
// Used inside list cards. Reads + patches the shared IDs cache; never
// issues a per-card GET.
export function useToggleFavoriteSave(favoriteId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => toggleFavoriteSave(favoriteId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: SAVED_FAVORITE_IDS_KEY });
      const previous =
        queryClient.getQueryData<string[]>(SAVED_FAVORITE_IDS_KEY) ?? [];
      const isSaved = previous.includes(favoriteId);
      const next = isSaved
        ? previous.filter((id) => id !== favoriteId)
        : [...previous, favoriteId];
      queryClient.setQueryData<string[]>(SAVED_FAVORITE_IDS_KEY, next);
      // Mirror the optimistic state into the per-favorite key too, in case
      // the detail page has it cached.
      queryClient.setQueryData(favoriteSaveKey(favoriteId), {
        saved: !isSaved,
      });
      return { previous, isSaved };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SAVED_FAVORITE_IDS_KEY, context.previous);
      }
      toast.error("Could not update saved item");
    },
    onSuccess: ({ saved }) => {
      // Refetch the canonical list once on success — keeps the cache honest
      // in case the server applies business rules we don't know about.
      void queryClient.invalidateQueries({ queryKey: SAVED_FAVORITE_IDS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["saved"] });
      toast.success(saved ? "Saved to your list" : "Removed from saved");
    },
  });

  const toggle = useCallback(() => {
    if (!user) {
      toast.error("Sign in to save favorites");
      return;
    }
    mutation.mutate();
  }, [user, mutation]);

  return {
    toggle,
    isToggling: mutation.isPending,
  };
}

// ── Detail-page hook ────────────────────────────────────────────────────────
// Reserved for routes that render exactly one favorite (show page, edit page)
// and benefit from the full server-side status payload.
export function useFavoriteSave(
  favoriteId: string,
  isOwner: boolean,
  options?: { enabled?: boolean },
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hookEnabled = options?.enabled ?? true;

  const { data, isLoading } = useQuery({
    queryKey: favoriteSaveKey(favoriteId),
    queryFn: () => getFavoriteSaveStatus(favoriteId),
    enabled: !!user && !isOwner && hookEnabled,
    staleTime: 1000 * 30,
  });

  const mutation = useMutation({
    mutationFn: () => toggleFavoriteSave(favoriteId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: favoriteSaveKey(favoriteId) });
      const previous = queryClient.getQueryData<{ saved: boolean }>(
        favoriteSaveKey(favoriteId),
      );
      queryClient.setQueryData(favoriteSaveKey(favoriteId), {
        saved: !previous?.saved,
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          favoriteSaveKey(favoriteId),
          context.previous,
        );
      }
      toast.error("Could not update saved item");
    },
    onSuccess: ({ saved }) => {
      queryClient.setQueryData(favoriteSaveKey(favoriteId), { saved });
      void queryClient.invalidateQueries({ queryKey: ["saved"] });
      void queryClient.invalidateQueries({ queryKey: SAVED_FAVORITE_IDS_KEY });
      toast.success(saved ? "Saved to your list" : "Removed from saved");
    },
  });

  return useMemo(
    () => ({
      saved: data?.saved ?? false,
      isLoading,
      canSave: !!user && !isOwner,
      toggleSave: () => {
        if (!user) {
          toast.error("Sign in to save favorites");
          return;
        }
        if (isOwner) {
          toast.error("You cannot save your own favorite");
          return;
        }
        mutation.mutate();
      },
      isToggling: mutation.isPending,
    }),
    [data?.saved, isLoading, user, isOwner, mutation],
  );
}
