"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { getProfile, PROFILE_QUERY_STALE_MS } from "./api";
import { countryName } from "@/lib/countries";

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

  const locationParts = [
    profile?.location?.trim(), 
    profile?.country?.trim() ? countryName(profile.country.trim()) : ""
  ].filter(Boolean);
  const displayLocationStr = locationParts.length > 0 ? locationParts.join(", ") : "";
  
  const displayDob = profile?.dateOfBirth 
    ? `Born ${new Date(profile.dateOfBirth).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`
    : profile?.age 
      ? `${profile.age} years old` 
      : "";

  return {
    profile,
    loading: isLoading,
    displayName,
    displayUsername,
    displayAvatar,
    displayBio,
    displayLocationStr,
    displayDob,
    displayBannerUrl,
    displaySinceYear,
  };
}


