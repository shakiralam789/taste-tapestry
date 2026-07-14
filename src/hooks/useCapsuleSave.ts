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
  getCapsuleSaveStatus,
  getSavedCapsuleIds,
  toggleCapsuleSave,
} from "@/features/saved/capsule-api";
import { useAuth } from "@/features/auth/AuthContext";

// ── Cache keys ──────────────────────────────────────────────────────────────
export const SAVED_IDS_KEY = ["saved", "capsules", "ids"] as const;
const capsuleSaveKey = (id: string) => ["capsule-save", id] as const;

// ── Shared IDs query ────────────────────────────────────────────────────────
// One request per page. Every <TimeCapsuleCard> reads from this; nobody
// issues a per-card GET. staleTime is intentionally long so scrolling
// doesn't refetch.
export function useSavedCapsuleIds() {
  const { user } = useAuth();
  return useQuery<string[]>({
    queryKey: SAVED_IDS_KEY,
    queryFn: getSavedCapsuleIds,
    enabled: !!user,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });
}

// True once the shared IDs query has resolved at least once.
export function useSavedCapsuleIdsReady(): boolean {
  const { user } = useAuth();
  const { data, isFetched } = useSavedCapsuleIds();
  return !!user && isFetched && Array.isArray(data);
}

// O(1) lookup against the shared IDs list. Safe to call from every card
// in a list — no extra requests.
export function useIsCapsuleSaved(capsuleId: string): boolean {
  const { data: savedIds = [] } = useSavedCapsuleIds();
  return savedIds.includes(capsuleId);
}

// ── Mutation-only toggle ───────────────────────────────────────────────────
// Used inside list cards. Mirrors the love-react shape:
//   onMutate  → patch the shared IDs cache so every subscribed card flips
//   onSuccess → sync the per-page ["saved"] lists via setQueriesData (no
//               refetch, no reorder — saves don't affect ranking)
//   onError   → roll the cache back to the snapshot taken in onMutate
// Cards read state via `useIsCapsuleSaved`, which subscribes to the
// shared cache and re-renders on every patch.
export function useToggleCapsuleSave(capsuleId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => toggleCapsuleSave(capsuleId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: SAVED_IDS_KEY });
      const previous = queryClient.getQueryData<string[]>(SAVED_IDS_KEY) ?? [];
      const isSaved = previous.includes(capsuleId);
      const next = isSaved
        ? previous.filter((id) => id !== capsuleId)
        : [...previous, capsuleId];
      queryClient.setQueryData<string[]>(SAVED_IDS_KEY, next);
      queryClient.setQueryData(capsuleSaveKey(capsuleId), {
        saved: !isSaved,
      });
      return { previous, isSaved };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SAVED_IDS_KEY, context.previous);
      }
      queryClient.setQueryData(capsuleSaveKey(capsuleId), {
        saved: context?.isSaved ?? false,
      });
      toast.error("Could not update saved capsule");
    },

    onSuccess: ({ saved }) => {
      // Patch any mounted /saved pages so the list shrinks/grows without
      // a refetch (which would blank the screen and re-rank).
      queryClient.setQueriesData<any>(
        { queryKey: ["saved"] },
        (old: any) => {
          if (!old || !old.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: (page.items ?? []).filter(
                (it: any) => it?.capsule?.id !== capsuleId,
              ),
            })),
          };
        },
      );
      toast.success(saved ? "Saved to collection" : "Removed from saved");
    },
  });

  const toggle = useCallback(() => {
    if (!user) {
      toast.error("Sign in to save capsules");
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
// Reserved for routes that render exactly one capsule (show page, edit page)
// and benefit from the full server-side status payload.
export function useCapsuleSave(
  capsuleId: string,
  isOwner: boolean,
  options?: { enabled?: boolean },
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hookEnabled = options?.enabled ?? true;

  const { data, isLoading } = useQuery({
    queryKey: capsuleSaveKey(capsuleId),
    queryFn: () => getCapsuleSaveStatus(capsuleId),
    enabled: !!user && !isOwner && hookEnabled,
    staleTime: 1000 * 30,
  });

  const mutation = useMutation({
    mutationFn: () => toggleCapsuleSave(capsuleId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: capsuleSaveKey(capsuleId) });
      const previous = queryClient.getQueryData<{ saved: boolean }>(
        capsuleSaveKey(capsuleId),
      );
      queryClient.setQueryData(capsuleSaveKey(capsuleId), {
        saved: !previous?.saved,
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          capsuleSaveKey(capsuleId),
          context.previous,
        );
      }
      toast.error("Could not update saved capsule");
    },
    onSuccess: ({ saved }) => {
      queryClient.setQueryData(capsuleSaveKey(capsuleId), { saved });
      void queryClient.invalidateQueries({ queryKey: ["saved"] });
      void queryClient.invalidateQueries({ queryKey: SAVED_IDS_KEY });
      toast.success(saved ? "Saved to collection" : "Removed from saved");
    },
  });

  return useMemo(
    () => ({
      saved: data?.saved ?? false,
      isLoading,
      canSave: !!user && !isOwner,
      toggleSave: () => {
        if (!user) {
          toast.error("Sign in to save capsules");
          return;
        }
        if (isOwner) {
          toast.error("You cannot save your own capsule");
          return;
        }
        mutation.mutate();
      },
      isToggling: mutation.isPending,
    }),
    [data?.saved, isLoading, user, isOwner, mutation],
  );
}
