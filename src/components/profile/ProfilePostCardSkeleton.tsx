"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface ProfilePostCardSkeletonProps {
  /** grid = tall card (default), list = compact full-width row */
  variant?: "grid" | "list";
}

export function ProfilePostCardSkeleton({
  variant = "grid",
}: ProfilePostCardSkeletonProps) {
  if (variant === "list") {
    return (
      <div className="flex rounded-2xl overflow-hidden bg-card/40 border border-white/5">
        <Skeleton className="w-28 sm:w-32 h-24 sm:h-28 flex-shrink-0 rounded-none" />
        <div className="flex-1 flex flex-col justify-center px-3 py-2 sm:px-4 sm:py-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-3 pt-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-card/40 border border-white/5">
      <Skeleton className="h-3/4 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}

