"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicProfile, type PublicProfile } from "./api";
import { countryName } from "@/lib/countries";

export function usePublicProfileInfo(id: string | undefined) {
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: () => getPublicProfile(id as string),
    enabled: !!id,
  });

  const safeProfile: PublicProfile | null = profile ?? null;

  const displayName =
    safeProfile?.displayName?.trim() ||
    safeProfile?.username?.trim() ||
    "User";

  const displayUsername = safeProfile?.username?.trim()
    ? `@${safeProfile.username}`
    : "";

  const displayBio =
    safeProfile?.bio?.trim() || "This user hasn't added a bio yet.";

  const locationParts = [
    safeProfile?.location?.trim(), 
    safeProfile?.country?.trim() ? countryName(safeProfile.country.trim()) : ""
  ].filter(Boolean);
  const displayLocationStr = locationParts.length > 0 ? locationParts.join(", ") : "";

  const displayDob = safeProfile?.age 
    ? `${safeProfile.age} years old` 
    : "";

  const displaySinceYear = safeProfile?.createdAt
    ? new Date(safeProfile.createdAt).getFullYear()
    : new Date().getFullYear();

  return {
    profile: safeProfile,
    loading: isLoading,
    error: isError,
    displayName,
    displayUsername,
    displayBio,
    displayLocationStr,
    displayDob,
    displaySinceYear,
  };
}

