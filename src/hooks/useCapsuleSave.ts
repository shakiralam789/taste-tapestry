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

// O(1) lookup against the shared IDs list. Safe to call from every card
// in a list — no extra requests.
export function useIsCapsuleSaved(capsuleId: string): boolean {
  const { data: savedIds = [] } = useSavedCapsuleIds();
  return savedIds.includes(capsuleId);
}

// ── Mutation-only toggle ───────────────────────────────────────────────────
// Used inside list cards. Reads + patches the shared IDs cache; never
// issues a per-card GET.
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
      // Mirror the optimistic state into the per-capsule key too, in case
      // the detail page has it cached.
      queryClient.setQueryData(capsuleSaveKey(capsuleId), {
        saved: !isSaved,
      });
      return { previous, isSaved };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SAVED_IDS_KEY, context.previous);
      }
      toast.error("Could not update saved capsule");
    },
    onSuccess: ({ saved }) => {
      // Refetch the canonical list once on success — keeps the cache honest
      // in case the server applies business rules we don't know about.
      void queryClient.invalidateQueries({ queryKey: SAVED_IDS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["saved"] });
      toast.success(saved ? "Saved to your list" : "Removed from saved");
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
