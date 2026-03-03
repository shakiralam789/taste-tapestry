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

  const defaultBannerUrl =
    "https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2676&auto=format&fit=crop";

  const displayBannerUrl =
    profile?.bannerUrl?.trim() || defaultBannerUrl;

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
    displayBannerUrl,
    displaySinceYear,
  };
}


