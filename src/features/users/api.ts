import { apiClient } from "@/lib/api-client";
import type { Favorite, Album } from "@/types/wishbook";

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

export async function getPublicAlbums(userId: string): Promise<Album[]> {
  const { data } = await apiClient.get<Album[]>(`/users/${userId}/albums`);
  return (data ?? []).map((album) => ({
    ...album,
    createdAt: new Date(album.createdAt),
  }));
}
