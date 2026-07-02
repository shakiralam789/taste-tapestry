"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { TimeCapsuleCard } from "@/components/capsules/TimeCapsuleCard";
import { TimeCapsuleCardSkeleton } from "@/components/capsules/TimeCapsuleCardSkeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTimeline } from "@/features/feed/useTimeline";
import { useInView } from "react-intersection-observer";
import { Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type PostType = "capsule" | "collection-review";

const CREATE_POST_ROUTES: Record<PostType, string> = {
  capsule: "/create-capsule",
  "collection-review": "/add-favorite",
};

export default function HomePage() {
  const router = useRouter();
  const [postType, setPostType] = useState<PostType>("capsule");
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
          {/* Create Post Input */}
          <div className="px-4 md:px-0 mb-6">
            <div className="p-4 bg-card/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/5 hover:bg-card/80 transition-colors">
              <button
                type="button"
                onClick={() => router.push(CREATE_POST_ROUTES[postType])}
                className="w-full text-left text-muted-foreground mb-4 md:text-base text-sm cursor-text"
              >
                Share your taste with the universe...
              </button>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPostType("capsule")}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      postType === "capsule"
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    <Clock className="w-4 h-4" />
                    Time Capsule
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType("collection-review")}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      postType === "collection-review"
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    <Star className="w-4 h-4" />
                    Collection Review
                  </button>
                </div>
                <Button
                  size="sm"
                  variant="gradient"
                  onClick={() => router.push(CREATE_POST_ROUTES[postType])}
                >
                  Post
                </Button>
              </div>
            </div>
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
                    authorID={post.author.id}
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
