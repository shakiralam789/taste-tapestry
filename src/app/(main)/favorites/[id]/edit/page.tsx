"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { Layout } from "@/components/layout/Layout";
import { FavoriteEditor, type FavoriteEditorPayload } from "@/components/favorites/FavoriteEditor";
import { getFavorite, updateFavorite } from "@/features/favorites/api";
import type { Favorite } from "@/types/wishbook";

export default function EditFavoritePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const {
    data: favorite,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["favorite", id],
    queryFn: async (): Promise<Favorite> => getFavorite(id),
    enabled: typeof id === "string",
  });

  const handleSubmit = async (payload: FavoriteEditorPayload) => {
    if (!id || typeof id !== "string") return;
    try {
      await updateFavorite(id, payload);
      toast.success("Favorite updated", {
        description: "Your collection has been refreshed.",
      });
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

  if (isLoading || !favorite) {
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

