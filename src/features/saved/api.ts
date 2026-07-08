import { apiClient } from "@/lib/api-client";
import type { Favorite } from "@/types/wishbook";
import { COLLECTION_PAGE_SIZE } from "@/features/favorites/api";

export type SavedFavoriteAuthor = {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
};

export type SavedFavoriteItem = {
  favorite: Favorite;
  savedAt: string;
  author: SavedFavoriteAuthor;
};

export type SavedPageResponse = {
  items: SavedFavoriteItem[];
  hasMore: boolean;
  nextOffset: number;
};

export async function getFavoriteSaveStatus(
  favoriteId: string,
): Promise<{ saved: boolean }> {
  const { data } = await apiClient.get<{ saved: boolean }>(
    `/favorites/${favoriteId}/save`,
  );
  return data;
}

export async function toggleFavoriteSave(
  favoriteId: string,
): Promise<{ saved: boolean }> {
  const { data } = await apiClient.post<{ saved: boolean }>(
    `/favorites/${favoriteId}/save`,
  );
  return data;
}

export async function getSavedFavoriteIds(): Promise<string[]> {
  const { data } = await apiClient.get<{ ids: string[] }>("/saved/ids");
  return data.ids ?? [];
}

export async function getSavedFavoritesPage(
  offset: number,
  categoryId?: string,
  search?: string,
): Promise<SavedPageResponse> {
  const params: Record<string, string> = {
    limit: String(COLLECTION_PAGE_SIZE),
    offset: String(offset),
  };
  if (categoryId) params.categoryId = categoryId;
  if (search?.trim()) params.q = search.trim();

  const { data } = await apiClient.get<SavedPageResponse>("/saved", { params });
  return {
    items: (data.items ?? []).map((item) => ({
      ...item,
      savedAt: item.savedAt,
      favorite: {
        ...item.favorite,
        createdAt: new Date(item.favorite.createdAt),
      },
    })),
    hasMore: data.hasMore ?? false,
    nextOffset: data.nextOffset ?? offset + (data.items?.length ?? 0),
  };
}
