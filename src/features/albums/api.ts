import { apiClient } from "@/lib/api-client";
import type { Album, Favorite } from "@/types/wishbook";

export type CreateAlbumPayload = {
  name: string;
  description?: string;
  coverImage?: string;
  favoriteIds?: string[];
};

export type UpdateAlbumPayload = Partial<
  Omit<Album, "id" | "userId" | "createdAt">
>;

export type AlbumItemCounts = {
  all: number;
  movies: number;
  series: number;
  songs: number;
  books: number;
};

export async function createAlbum(
  payload: CreateAlbumPayload,
): Promise<Album> {
  const { data } = await apiClient.post<Album>("/albums", payload);
  return {
    ...data,
    createdAt: new Date(data.createdAt),
  };
}

export async function getAlbums(): Promise<Album[]> {
  const { data } = await apiClient.get<Album[]>("/albums");
  return data.map((album) => ({
    ...album,
    createdAt: new Date(album.createdAt),
  }));
}

export async function getAlbum(id: string): Promise<Album> {
  const { data } = await apiClient.get<Album>(`/albums/${id}`);
  return {
    ...data,
    createdAt: new Date(data.createdAt),
  };
}

export async function getAlbumItemCounts(
  id: string,
): Promise<AlbumItemCounts> {
  const { data } = await apiClient.get<AlbumItemCounts>(
    `/albums/${id}/item-counts`,
  );
  return data;
}

export async function getAlbumItems(
  id: string,
  categoryId?: string,
): Promise<Favorite[]> {
  const params = categoryId ? { categoryId } : undefined;
  const { data } = await apiClient.get<Favorite[]>(`/albums/${id}/items`, {
    params,
  });
  return data.map((fav) => ({
    ...fav,
    createdAt: new Date(fav.createdAt),
  }));
}

export async function updateAlbum(
  id: string,
  payload: UpdateAlbumPayload,
): Promise<Album> {
  const { data } = await apiClient.patch<Album>(`/albums/${id}`, payload);
  return {
    ...data,
    createdAt: new Date(data.createdAt),
  };
}

export async function deleteAlbum(id: string): Promise<void> {
  await apiClient.delete(`/albums/${id}`);
}

