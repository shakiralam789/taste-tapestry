import { apiClient } from "@/lib/api-client";
import type { Favorite, Album } from "@/types/wishbook";
import {
  COLLECTION_PAGE_SIZE,
  type FavoritesPageResponse,
} from "@/features/favorites/api";

export interface UserSearchHit {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
}

export interface PublicProfile {
  id: string;
  displayName: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
  bannerUrl?: string;
}

export async function searchUsers(
  q: string,
  options?: { excludeUserId?: string },
): Promise<UserSearchHit[]> {
  if (!q?.trim()) return [];
  const params: { q: string; exclude?: string } = { q: q.trim() };
  if (options?.excludeUserId) params.exclude = options.excludeUserId;
  const { data } = await apiClient.get<UserSearchHit[]>("/users/search", {
    params,
  });
  return data ?? [];
}

export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  const { data } = await apiClient.get<PublicProfile | null>(`/users/${id}`);
  return data ?? null;
}

export async function getPublicFavorites(userId: string): Promise<Favorite[]> {
  const { data } = await apiClient.get<Favorite[]>(`/users/${userId}/favorites`);
  return (data ?? []).map((fav) => ({
    ...fav,
    createdAt: new Date(fav.createdAt),
  }));
}

/** Paginated public favorites for another user's collection page. */
export async function getPublicFavoritesPage(
  userId: string,
  offset: number,
  categoryId?: string,
  search?: string,
  sortBy: 'newest' | 'oldest' | 'rating_desc' | 'rating_asc' = 'newest',
): Promise<FavoritesPageResponse> {
  const params: Record<string, string> = {
    limit: String(COLLECTION_PAGE_SIZE),
    offset: String(offset),
    sortBy,
  };
  if (categoryId) params.categoryId = categoryId;
  if (search?.trim()) params.q = search.trim();
  const { data } = await apiClient.get<FavoritesPageResponse>(
    `/users/${userId}/favorites`,
    { params },
  );
  return {
    items: (data.items ?? []).map((fav) => ({
      ...fav,
      createdAt: new Date(fav.createdAt),
    })),
    hasMore: data.hasMore ?? false,
    nextOffset: data.nextOffset ?? offset + (data.items?.length ?? 0),
  };
}

export async function getPublicAlbums(userId: string): Promise<Album[]> {
  const { data } = await apiClient.get<Album[]>(`/users/${userId}/albums`);
  return (data ?? []).map((album) => ({
    ...album,
    createdAt: new Date(album.createdAt),
  }));
}

export async function getFollowStatus(userId: string): Promise<{ isFollowing: boolean }> {
  const { data } = await apiClient.get<{ isFollowing: boolean }>(
    `/users/${userId}/follow-status`,
  );
  return data ?? { isFollowing: false };
}

export async function followUser(userId: string): Promise<void> {
  await apiClient.post(`/users/${userId}/follow`);
}

export async function unfollowUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}/follow`);
}
