"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCapsuleSaveStatus,
  getSavedCapsuleIds,
  toggleCapsuleSave,
} from "@/features/saved/capsule-api";
import { useAuth } from "@/features/auth/AuthContext";

export function useSavedCapsuleIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved", "capsules", "ids"],
    queryFn: getSavedCapsuleIds,
    enabled: !!user,
    staleTime: 1000 * 30,
  });
}

export function useCapsuleSave(
  capsuleId: string,
  isOwner: boolean,
  options?: { enabled?: boolean },
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hookEnabled = options?.enabled ?? true;

  const { data, isLoading } = useQuery({
    queryKey: ["capsule-save", capsuleId],
    queryFn: () => getCapsuleSaveStatus(capsuleId),
    enabled: !!user && !isOwner && hookEnabled,
    staleTime: 1000 * 30,
  });

  const mutation = useMutation({
    mutationFn: () => toggleCapsuleSave(capsuleId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["capsule-save", capsuleId] });
      const previous = queryClient.getQueryData<{ saved: boolean }>([
        "capsule-save",
        capsuleId,
      ]);
      queryClient.setQueryData(["capsule-save", capsuleId], {
        saved: !previous?.saved,
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["capsule-save", capsuleId], context.previous);
      }
      toast.error("Could not update saved capsule");
    },
    onSuccess: ({ saved }) => {
      queryClient.setQueryData(["capsule-save", capsuleId], { saved });
      queryClient.invalidateQueries({ queryKey: ["saved"] });
      queryClient.invalidateQueries({ queryKey: ["saved", "capsules", "ids"] });
      toast.success(saved ? "Saved to your list" : "Removed from saved");
    },
  });

  return {
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
  };
}

export function useIsCapsuleSaved(capsuleId: string) {
  const { data: savedIds = [] } = useSavedCapsuleIds();
  return savedIds.includes(capsuleId);
}
