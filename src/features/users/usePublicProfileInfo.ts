"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicProfile, type PublicProfile } from "./api";

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

  const displayLocation = safeProfile?.location?.trim() || "";

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
    displayLocation,
    displaySinceYear,
  };
}

