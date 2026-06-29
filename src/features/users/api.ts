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
  interests?: any[];
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

export interface SuggestedUser {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
  matchScore: number | null;
}

export async function getSuggestedUsers(limit = 5): Promise<SuggestedUser[]> {
  const { data } = await apiClient.get<SuggestedUser[]>("/users/suggested", {
    params: { limit },
  });
  return data ?? [];
}

export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  const { data } = await apiClient.get<PublicProfile | null>(`/users/${id}`);
  return data ?? null;
}

export async function getPublicFavorites(
  userId: string,
  categoryId?: string,
): Promise<Favorite[]> {
  const params = categoryId ? { categoryId } : undefined;
  const { data } = await apiClient.get<Favorite[]>(`/users/${userId}/favorites`, {
    params,
  });
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

export interface PaginatedUserResponse {
  items: UserSearchHit[];
  hasMore: boolean;
  nextOffset: number;
}

export async function getFollowers(
  userId: string,
  offset = 0,
  limit = 20,
): Promise<PaginatedUserResponse> {
  const { data } = await apiClient.get<PaginatedUserResponse>(
    `/users/${userId}/followers`,
    { params: { offset, limit } }
  );
  return data;
}

export async function getFollowing(
  userId: string,
  offset = 0,
  limit = 20,
): Promise<PaginatedUserResponse> {
  const { data } = await apiClient.get<PaginatedUserResponse>(
    `/users/${userId}/following`,
    { params: { offset, limit } }
  );
  return data;
}

export interface SimilarityExplanation {
  text: string;
  signal: string;
}

export interface SimilarityResult {
  score: number | null;
  availableSignals: number;
  explanations: SimilarityExplanation[];
  message?: string;
}

export async function getSimilarity(userId: string): Promise<SimilarityResult> {
  const { data } = await apiClient.get<SimilarityResult>(`/users/${userId}/similarity`);
  return data;
}

export interface TopMatchItem {
  matchedUserId: string;
  score: number;
  reasons: { text: string; signal: string }[];
  user: {
    id: string;
    displayName: string;
    username: string;
    avatar: string | null;
  } | null;
}

export interface PaginatedMatchesResponse {
  items: TopMatchItem[];
  hasMore: boolean;
  nextOffset: number;
}

export async function getTopMatches(
  userId: string,
  limit = 20,
  offset = 0,
  refresh = false,
): Promise<PaginatedMatchesResponse> {
  const { data } = await apiClient.get<PaginatedMatchesResponse>(
    `/users/${userId}/similarity/matches`,
    { params: { limit, offset, refresh } }
  );
  return data;
}

// ── Global Item Search ──────────────────────────────────────────────────────

export interface ItemSearchUser {
  id: string;
  favoriteId: string;
  displayName: string;
  username: string;
  avatar: string | null;
  similarityScore: number | null;
}

export interface GlobalSearchItemResult {
  title: string;
  categoryId: string;
  users: ItemSearchUser[];
}

export async function globalSearchItems(
  query: string,
): Promise<GlobalSearchItemResult[]> {
  if (!query?.trim()) return [];
  const { data } = await apiClient.get<GlobalSearchItemResult[]>(
    '/search/items',
    { params: { q: query.trim() } },
  );
  return data ?? [];
}
