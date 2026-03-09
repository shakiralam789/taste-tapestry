import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TimeCapsuleCardSkeleton() {
    return (
        <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 mb-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            {/* Body text */}
            <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>

                {/* Media Placeholder */}
                <Skeleton className="h-48 w-full rounded-xl" />

                {/* Emotions */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5">
                    <Skeleton className="h-6 w-12 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </div>
        </div>
    );
}
