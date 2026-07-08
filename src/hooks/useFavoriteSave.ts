"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFavoriteSaveStatus,
  getSavedFavoriteIds,
  toggleFavoriteSave,
} from "@/features/saved/api";
import { useAuth } from "@/features/auth/AuthContext";

export function useSavedFavoriteIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved", "ids"],
    queryFn: getSavedFavoriteIds,
    enabled: !!user,
    staleTime: 1000 * 30,
  });
}

export function useFavoriteSave(
  favoriteId: string,
  isOwner: boolean,
  options?: { enabled?: boolean },
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hookEnabled = options?.enabled ?? true;

  const { data, isLoading } = useQuery({
    queryKey: ["favorite-save", favoriteId],
    queryFn: () => getFavoriteSaveStatus(favoriteId),
    enabled: !!user && !isOwner && hookEnabled,
    staleTime: 1000 * 30,
  });

  const mutation = useMutation({
    mutationFn: () => toggleFavoriteSave(favoriteId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["favorite-save", favoriteId] });
      const previous = queryClient.getQueryData<{ saved: boolean }>([
        "favorite-save",
        favoriteId,
      ]);
      queryClient.setQueryData(["favorite-save", favoriteId], {
        saved: !previous?.saved,
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["favorite-save", favoriteId], context.previous);
      }
      toast.error("Could not update saved item");
    },
    onSuccess: ({ saved }) => {
      queryClient.setQueryData(["favorite-save", favoriteId], { saved });
      queryClient.invalidateQueries({ queryKey: ["saved"] });
      queryClient.invalidateQueries({ queryKey: ["saved", "ids"] });
      toast.success(saved ? "Saved to your list" : "Removed from saved");
    },
  });

  return {
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
  };
}

export function useIsFavoriteSaved(favoriteId: string) {
  const { data: savedIds = [] } = useSavedFavoriteIds();
  return savedIds.includes(favoriteId);
}
