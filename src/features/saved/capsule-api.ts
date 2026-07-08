import { apiClient } from "@/lib/api-client";
import type { TimeCapsule } from "@/types/wishbook";
import { COLLECTION_PAGE_SIZE } from "@/features/favorites/api";

export type SavedCapsuleAuthor = {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
};

export type SavedCapsuleItem = {
  capsule: TimeCapsule;
  savedAt: string;
  author: SavedCapsuleAuthor;
};

export type SavedCapsulesPageResponse = {
  items: SavedCapsuleItem[];
  hasMore: boolean;
  nextOffset: number;
};

export async function getCapsuleSaveStatus(
  capsuleId: string,
): Promise<{ saved: boolean }> {
  const { data } = await apiClient.get<{ saved: boolean }>(
    `/capsules/${capsuleId}/save`,
  );
  return data;
}

export async function toggleCapsuleSave(
  capsuleId: string,
): Promise<{ saved: boolean }> {
  const { data } = await apiClient.post<{ saved: boolean }>(
    `/capsules/${capsuleId}/save`,
  );
  return data;
}

export async function getSavedCapsuleIds(): Promise<string[]> {
  const { data } = await apiClient.get<{ ids: string[] }>("/saved/capsules/ids");
  return data.ids ?? [];
}

export async function getSavedCapsulesPage(
  offset: number,
  search?: string,
): Promise<SavedCapsulesPageResponse> {
  const params: Record<string, string> = {
    limit: String(COLLECTION_PAGE_SIZE),
    offset: String(offset),
  };
  if (search?.trim()) params.q = search.trim();

  const { data } = await apiClient.get<SavedCapsulesPageResponse>("/saved/capsules", { params });
  return {
    items: (data.items ?? []).map((item) => ({
      ...item,
      savedAt: item.savedAt,
      capsule: {
        ...item.capsule,
        createdAt: new Date(item.capsule.createdAt),
        unlockAt: item.capsule.unlockAt ? new Date(item.capsule.unlockAt) : undefined,
      },
    })),
    hasMore: data.hasMore ?? false,
    nextOffset: data.nextOffset ?? offset + (data.items?.length ?? 0),
  };
}
