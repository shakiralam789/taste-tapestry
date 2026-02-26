"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePostCardSkeleton() {
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

