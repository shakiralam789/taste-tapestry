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

export default function AddFavoritePage() {
  const router = useRouter();

  const handleSubmit = async (payload: FavoriteEditorPayload) => {
    try {
      await createFavorite(
        payload as Omit<Favorite, "id" | "userId" | "createdAt">,
      );
      toast.success("Added to your collection", {
        description: "Your favorite has been saved.",
      });
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

