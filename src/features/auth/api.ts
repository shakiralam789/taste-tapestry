import { apiClient } from "@/lib/api-client";

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string | null;
  username?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export async function login(payload: {
  emailOrUsername: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  dateOfBirth: string;
  country?: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function deactivateAccount(): Promise<void> {
  await apiClient.post("/users/me/deactivate");
}

export async function deleteAccount(
  password: string,
): Promise<{ deletionScheduledAt: string }> {
  const { data } = await apiClient.post<{
    success: boolean;
    deletionScheduledAt: string;
  }>("/users/me/delete", { password });
  return { deletionScheduledAt: data.deletionScheduledAt };
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
}

export async function resetPassword(payload: {
  token: string;
  password: string;
}): Promise<void> {
  await apiClient.post("/auth/reset-password", payload);
}

