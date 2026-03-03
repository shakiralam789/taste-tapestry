"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { getProfile, PROFILE_QUERY_STALE_MS } from "./api";

export function useProfileInfo() {
  const { user: authUser } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!authUser,
    staleTime: PROFILE_QUERY_STALE_MS,
  });

  const displayName =
    profile?.displayName?.trim() || authUser?.displayName?.trim() || "";

  const displayUsername = profile?.username?.trim()
    ? `@${profile.username}`
    : "";

  const displayAvatar = profile?.avatar?.trim() || "";

  const displayBio =
    profile?.bio?.trim() ||
    "" ||
    "Digital explorer navigating the neon tides. Curator of moments and memories.";

  const displayLocation = profile?.location?.trim() || "" || "Neo Tokyo";

  const displaySinceYear = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : new Date().getFullYear();

  return {
    profile,
    loading: isLoading,
    displayName,
    displayUsername,
    displayAvatar,
    displayBio,
    displayLocation,
    displaySinceYear,
  };
}


