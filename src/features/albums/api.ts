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

export type AlbumShowResponse = {
  album: Album;
  itemCounts: AlbumItemCounts;
  items: Favorite[];
};

export type AlbumShowPageResponse = {
  album: Album | null;
  itemCounts: AlbumItemCounts | null;
  items: Favorite[];
  hasMore: boolean;
  nextOffset: number;
};

const PAGE_SIZE = 12;

function mapFavorite(fav: Favorite & { createdAt?: string }): Favorite {
  return {
    ...fav,
    createdAt: new Date((fav as Favorite).createdAt ?? 0),
  };
}

/** Single call for the album show page: album + itemCounts + items. Optional categoryId filters items on the backend. */
export async function getAlbumShow(
  id: string,
  categoryId?: string,
): Promise<AlbumShowResponse> {
  const params = categoryId ? { categoryId } : undefined;
  const { data } = await apiClient.get<{
    album: Album;
    itemCounts: AlbumItemCounts;
    items: Favorite[];
  }>(`/albums/${id}/show`, { params });
  return {
    album: {
      ...data.album,
      createdAt: new Date(data.album.createdAt),
    },
    itemCounts: data.itemCounts,
    items: (data.items ?? []).map(mapFavorite),
  };
}

/** Paginated page for infinite scroll. First page includes album + itemCounts. */
export async function getAlbumShowPage(
  id: string,
  categoryId: string | undefined,
  offset: number,
): Promise<AlbumShowPageResponse> {
  const params: Record<string, string> = {
    limit: String(PAGE_SIZE),
    offset: String(offset),
  };
  if (categoryId) params.categoryId = categoryId;
  const { data } = await apiClient.get<{
    album: Album | null;
    itemCounts: AlbumItemCounts | null;
    items: Favorite[];
    hasMore: boolean;
    nextOffset: number;
  }>(`/albums/${id}/show`, { params });
  return {
    album: data.album
      ? { ...data.album, createdAt: new Date(data.album.createdAt) }
      : null,
    itemCounts: data.itemCounts ?? null,
    items: (data.items ?? []).map(mapFavorite),
    hasMore: data.hasMore ?? false,
    nextOffset: data.nextOffset ?? offset + (data.items?.length ?? 0),
  };
}

export { PAGE_SIZE as ALBUM_SHOW_PAGE_SIZE };

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

