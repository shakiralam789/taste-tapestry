import { apiClient } from "@/lib/api-client";
import { uploadToCloudinary } from "@/lib/upload";

/** Keep profile in cache so /users/me isn't called on every page navigation. */
export const PROFILE_QUERY_STALE_MS = 5 * 60 * 1000; // 5 minutes

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  bannerUrl?: string | null;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
}

export type UpdateProfilePayload = Partial<
  Pick<
    Profile,
    "displayName" | "username" | "avatar" | "bio" | "location" | "bannerUrl"
  >
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

/**
 * Upload avatar directly to Cloudinary, then notify the backend of the new URL.
 * Returns the updated profile.
 */
export async function uploadAvatar(file: File): Promise<Profile | null> {
  const url = await uploadToCloudinary(file, "image", "taste-tapestry/avatars");
  const { data } = await apiClient.post<Profile | null>("/users/me/avatar", { url });
  return data;
}

/**
 * Upload banner directly to Cloudinary, then notify the backend of the new URL.
 * Returns the updated profile.
 */
export async function uploadBanner(file: File): Promise<Profile | null> {
  const url = await uploadToCloudinary(file, "image", "taste-tapestry/banners");
  const { data } = await apiClient.post<Profile | null>("/users/me/banner", { url });
  return data;
}
