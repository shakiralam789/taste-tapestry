"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { Layout } from "@/components/layout/Layout";
import {
  FavoriteEditor,
  type FavoriteEditorPayload,
} from "@/components/favorites/FavoriteEditor";
import { getFavorite, updateFavorite } from "@/features/favorites/api";
import type { Favorite } from "@/types/wishbook";
import { useAuth } from "@/features/auth/AuthContext";

export default function EditFavoritePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user: authUser, loading } = useAuth();
  const queryClient = useQueryClient(); 
  const {
    data: favorite,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["favorite", id],
    queryFn: async (): Promise<Favorite> =>
      getFavorite(typeof id === "string" ? id : ""),
    enabled: typeof id === "string",
  });

  const isOwner =
    !!authUser && !!favorite && authUser.id === (favorite as Favorite).userId;

  const handleSubmit = async (payload: FavoriteEditorPayload) => {
    if (!id || typeof id !== "string") return;
    try {
      await updateFavorite(id, payload);
      toast.success("Favorite updated", {
        description: "Your collection has been refreshed.",
      });
      void queryClient.invalidateQueries({ queryKey: ["favorite", id] });
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      void queryClient.invalidateQueries({ queryKey: ["favorites-page"] });
      router.push(`/favorites/${id}`);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ??
        "Could not update favorite. Please try again.";
      toast.error("Update failed", { description: message });
      throw err;
    }
  };

  useEffect(() => {
    if (!loading && !isLoading && favorite && !isOwner && typeof id === "string") {
      router.replace(`/favorites/${id}`);
    }
  }, [loading, isLoading, favorite, isOwner, router, id]);

  if (loading || isLoading || !favorite || (!isOwner && typeof id === "string")) {
    return <FullScreenLoader />;
  }

  if (isError) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this favorite to edit.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <FavoriteEditor
      mode="edit"
      initialFavorite={favorite}
      onSubmit={handleSubmit}
    />
  );
}

