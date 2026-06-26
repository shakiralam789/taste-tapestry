"use client";

import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { TimeCapsuleCard } from "@/components/capsules/TimeCapsuleCard";
import { TimeCapsuleCardSkeleton } from "@/components/capsules/TimeCapsuleCardSkeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTimeline } from "@/features/feed/useTimeline";
import { useInView } from "react-intersection-observer";
import { Clock } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { posts, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useTimeline();
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Layout className="px-0 md:px-0 pt-0 md:pt-0">
      <div className="min-h-screen pb-12">
        <div className="max-w-2xl mx-auto md:px-4 pt-4">
          {/* Create Post Input (Desktop) */}
          <div className="px-4 md:px-0 mb-6 relative group">
            <Link href="/create-capsule">
              <div className="flex gap-4 p-4 bg-card/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/5 cursor-text hover:bg-card/80 transition-colors">
                <div className="flex-1 text-muted-foreground pt-2 md:text-base text-sm">
                  Share your taste with the universe...
                </div>
                <Button size="sm" variant="gradient">Post</Button>
              </div>
            </Link>
          </div>

          {/* Feed */}
          <div className="space-y-4 px-4 md:px-0">
            {posts.map((post) => {
              if (post.type === 'capsule') {
                return (
                  <TimeCapsuleCard
                    key={`feed-${post.capsule.id}`}
                    capsule={post.capsule}
                    onClick={() => router.push(`/capsules/${post.capsule.id}`)}
                    authorName={post.author.displayName || post.author.username || "Unknown"}
                    authorAvatar={post.author.avatar}
                    authorSubtitle={`Time capsule • ${post.capsule.period || 'A moment'}`}
                    showActions={false} 
                  />
                );
              }
              return null; // For future extensibility (e.g., 'favorite' type)
            })}

            {/* Loading / Sentinel */}
            {isLoading || isFetchingNextPage ? (
              <div className="space-y-4 pt-4">
                <TimeCapsuleCardSkeleton />
                <TimeCapsuleCardSkeleton />
              </div>
            ) : null}
            <div ref={ref} className="h-10 w-full" />

            {/* Empty State */}
            {!isLoading && posts.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Your timeline is quiet</h3>
                <p className="mb-6 max-w-sm mx-auto">
                  Follow people to see their time capsules here, or create your own to get started.
                </p>
                <Link href="/discover">
                  <Button variant="outline" className="mr-3">Discover People</Button>
                </Link>
                <Link href="/create-capsule">
                  <Button variant="gradient">Create Capsule</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
