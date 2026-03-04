import { apiClient } from "@/lib/api-client";
import type { TimeCapsule } from "@/types/wishbook";

export type CreateCapsulePayload = {
  title: string;
  description?: string;
  period?: string;
  image?: string;
  bannerImage?: string;
  images?: string[];
  videos?: string[];
  favorites?: string[];
  emotions?: string[];
  story?: string;
  visibility?: TimeCapsule["visibility"];
  unlockAt?: string | null;
};

export type UpdateCapsulePayload = Partial<CreateCapsulePayload>;

function mapCapsule(
  raw: TimeCapsule & { createdAt?: string; updatedAt?: string; unlockAt?: string | null },
): TimeCapsule {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    unlockAt: raw.unlockAt ? new Date(raw.unlockAt) : undefined,
  };
}

/** Create a new time capsule for the authenticated user. */
export async function createCapsule(
  payload: CreateCapsulePayload,
): Promise<TimeCapsule> {
  const { data } = await apiClient.post<TimeCapsule>("/capsules", payload);
  return mapCapsule(data as any);
}

/** List all capsules for the authenticated user. */
export async function getMyCapsules(): Promise<TimeCapsule[]> {
  const { data } = await apiClient.get<TimeCapsule[]>("/capsules");
  return (data as any[]).map(mapCapsule);
}

/** List public (and unlocked future) capsules for a given user profile. */
export async function getUserCapsules(userId: string): Promise<TimeCapsule[]> {
  const { data } = await apiClient.get<TimeCapsule[]>(
    `/users/${userId}/capsules`,
  );
  return (data as any[]).map(mapCapsule);
}

/** Get a single capsule detail (visibility rules handled by backend). */
export async function getCapsule(id: string): Promise<TimeCapsule> {
  const { data } = await apiClient.get<TimeCapsule>(`/capsules/${id}`);
  return mapCapsule(data as any);
}

/** Update an existing capsule owned by the authenticated user. */
export async function updateCapsule(
  id: string,
  payload: UpdateCapsulePayload,
): Promise<TimeCapsule> {
  const { data } = await apiClient.patch<TimeCapsule>(
    `/capsules/${id}`,
    payload,
  );
  return mapCapsule(data as any);
}

export async function deleteCapsule(id: string): Promise<void> {
  await apiClient.delete(`/capsules/${id}`);
}

export async function uploadCapsuleMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<{ url: string }>(
    "/capsules/media",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data.url;
}

export async function getCapsuleLove(
  id: string,
): Promise<{ loved: boolean; count: number }> {
  const { data } = await apiClient.get<{ loved: boolean; count: number }>(
    `/capsules/${id}/love`,
  );
  return data;
}

export async function toggleCapsuleLove(
  id: string,
): Promise<{ loved: boolean; count: number }> {
  const { data } = await apiClient.post<{ loved: boolean; count: number }>(
    `/capsules/${id}/love`,
  );
  return data;
}


