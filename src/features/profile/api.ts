import { apiClient } from "@/lib/api-client";

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
}

export type UpdateProfilePayload = Partial<
  Pick<Profile, "displayName" | "username" | "avatar" | "bio" | "location">
>;

export async function getProfile(): Promise<Profile | null> {
  const { data } = await apiClient.get<Profile | null>("/users/me");
  return data;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<Profile | null> {
  const { data } = await apiClient.patch<Profile | null>("/users/me", payload);
  return data;
}

/** Upload avatar image; returns updated profile. */
export async function uploadAvatar(file: File): Promise<Profile | null> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<Profile | null>("/users/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
