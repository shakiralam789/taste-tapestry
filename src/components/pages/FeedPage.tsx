"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { TimeCapsuleCard } from "@/components/capsules/TimeCapsuleCard";
import { TimeCapsuleCardSkeleton } from "@/components/capsules/TimeCapsuleCardSkeleton";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTimeline } from "@/features/feed/useTimeline";
import { getFavorite } from "@/features/favorites/api";
import { useInView } from "react-intersection-observer";
import { Clock, Layers, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/features/feed/api";

type FeedFilter = "all" | "capsules" | "collections";
type PostType = "capsule" | "collection-review";

const CREATE_POST_ROUTES: Record<PostType, string> = {
  capsule: "/create-capsule",
  "collection-review": "/add-favorite",
};

function isCollectionPost(post: FeedPost): boolean {
  return post.type === 'capsule' && (post.capsule.favorites?.length ?? 0) > 0;
}

export default function FeedPage({ filter = "all", children, showComposer = false }: { filter?: FeedFilter; children?: React.ReactNode; showComposer?: boolean }) {
  const router = useRouter();
  const [postType, setPostType] = useState<PostType>("capsule");
  const { posts, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useTimeline();
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const collectionPostIds = useMemo(
    () => posts.filter(isCollectionPost).map((p) => p.capsule.favorites![0]),
    [posts],
  );

  const collectionFavorites = useQueries({
    queries: collectionPostIds.map((id) => ({
      queryKey: ["favorite", id],
      queryFn: () => getFavorite(id),
      staleTime: 1000 * 60 * 5,
      enabled: !!id,
    })),
  });

  const favoriteMap = useMemo(() => {
    const map = new Map<string, NonNullable<(typeof collectionFavorites)[number]["data"]>>();
    collectionPostIds.forEach((id, i) => {
      if (collectionFavorites[i]?.data) {
        map.set(id, collectionFavorites[i].data!);
      }
    });
    return map;
  }, [collectionPostIds, collectionFavorites]);

  const filteredPosts = useMemo(() => {
    if (filter === "all") return posts;
    if (filter === "capsules") return posts.filter((p) => !isCollectionPost(p));
    return posts.filter(isCollectionPost);
  }, [posts, filter]);

  const emptyMessage = useMemo(() => {
    if (filter === "collections") return "No collection posts yet.";
    if (filter === "capsules") return "No capsules yet.";
    return "Your timeline is quiet";
  }, [filter]);

  return (
    <Layout className="px-0 md:px-0 pt-0 md:pt-0">
      <div className="min-h-screen pb-12">
        <div className="max-w-[700px] mx-auto md:px-4 pt-4">
          {children}

          {/* Create Post Input */}
          {showComposer && (
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
          )}

        

          {/* Feed */}
          <div className="space-y-4 px-4 md:px-0">
            {filteredPosts.map((post) => {
              if (isCollectionPost(post)) {
                const fav = post.capsule.favorites![0] ? favoriteMap.get(post.capsule.favorites![0]) : undefined;
                if (!fav) {
                  return (
                    <div key={`feed-${post.capsule.id}`} className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden mb-4 animate-pulse">
                      <div className="flex">
                        <div className="w-28 md:w-36 bg-muted" />
                        <div className="flex-1 p-3 md:p-4 space-y-3">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-5 bg-muted rounded w-2/3" />
                          <div className="h-3 bg-muted rounded w-full" />
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <FavoriteCard
                    key={`feed-${post.capsule.id}`}
                    favorite={fav}
                    onClick={() => router.push(`/favorites/${fav.id}`)}
                    authorOverride={{
                      name: post.author.displayName || post.author.username || "Unknown",
                      username: post.author.username || "Unknown",
                      avatar: post.author.avatar,
                    }}
                  />
                );
              }
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
              return null;
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
            {!isLoading && filteredPosts.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{emptyMessage}</h3>
                <p className="mb-6 max-w-sm mx-auto">
                  {filter === "collections"
                    ? "When someone publishes a collection as a post, it will appear here."
                    : "Follow people to see their time capsules here, or create your own to get started."}
                </p>
                {filter === "all" && (
                  <>
                    <Link href="/discover">
                      <Button variant="outline" className="mr-3">Discover People</Button>
                    </Link>
                    <Link href="/create-capsule">
                      <Button variant="gradient">Create Capsule</Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
