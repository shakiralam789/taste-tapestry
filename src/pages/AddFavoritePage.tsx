"use client";

import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import type { Favorite } from "@/types/wishbook";
import { createFavorite } from "@/features/favorites/api";
import {
  FavoriteEditor,
  type FavoriteEditorPayload,
} from "@/components/favorites/FavoriteEditor";
import { ClientOnly } from "@/components/common/ClientOnly";
import { useQueryClient } from "@tanstack/react-query";

export function AddFavoritePageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  if (typeof window === "undefined") {
    return null;
  }


  const handleSubmit = async (payload: FavoriteEditorPayload) => {
    try {
      await createFavorite(
        payload as Omit<Favorite, "id" | "userId" | "createdAt">,
      );
      toast.success("Added to your collection", {
        description: "Your favorite has been saved.",
      });
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      void queryClient.invalidateQueries({ queryKey: ["favorites-page"] });
      router.push("/profile");
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ??
        "Could not save favorite. Please try again.";
      toast.error("Could not add favorite", { description: message });
      throw err;
    }
  };

  return <FavoriteEditor mode="create" onSubmit={handleSubmit} />;
}

export default function AddFavoritePage() {
  return (
    <ClientOnly>
      <AddFavoritePageInner />
    </ClientOnly>
  );
}