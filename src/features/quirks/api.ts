import { apiClient } from "@/lib/api-client";
import type { Quirk, QuirkMedia } from "@/types/wishbook";

type RawQuirk = Omit<Quirk, "createdAt"> & {
  createdAt?: string | Date;
};

function mapQuirk(raw: RawQuirk): Quirk {
  return {
    ...raw,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
  };
}

export type CreateQuirkPayload = {
  title: string;
  story?: string;
  media?: QuirkMedia | null;
  bloopers?: QuirkMedia | null;
  isPublic?: boolean;
};

export type UpdateQuirkPayload = Partial<CreateQuirkPayload>;

export async function getQuirks(userId?: string): Promise<Quirk[]> {
  const path = userId ? `/quirks/user/${userId}` : "/quirks";
  const { data } = await apiClient.get<RawQuirk[]>(path);
  return (data ?? []).map(mapQuirk);
}

export async function createQuirk(
  payload: CreateQuirkPayload,
): Promise<Quirk> {
  const { data } = await apiClient.post<RawQuirk>("/quirks", payload);
  return mapQuirk(data);
}

export async function updateQuirk(
  id: string,
  payload: UpdateQuirkPayload,
): Promise<Quirk> {
  const { data } = await apiClient.patch<RawQuirk>(`/quirks/${id}`, payload);
  return mapQuirk(data);
}

export async function deleteQuirk(id: string): Promise<void> {
  await apiClient.delete(`/quirks/${id}`);
}

export async function uploadQuirkMedia(file: File): Promise<string> {
  const { uploadToCloudinary } = await import("@/lib/upload");
  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const result = await uploadToCloudinary(
    file,
    resourceType,
    "taste-tapestry/quirks",
  );
  return result.original_url;
}

