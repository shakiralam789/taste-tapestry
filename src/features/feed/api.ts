import { apiClient } from "@/lib/api-client";
import type { Favorite, TimeCapsule } from "@/types/wishbook";

export interface FeedAuthor {
  id: string;
  displayName: string | null;
  username: string | null;
  avatar: string | null;
}

export interface FeedPost {
  type: 'capsule';
  capsule: TimeCapsule & {
    loveCount: number;
    lovedByMe: boolean;
    commentCount: number;
    /** Whether the viewer has saved this capsule as a time capsule. Null when anonymous. */
    savedByMe: boolean | null;
    /**
     * For collection posts, the linked Favorite payload is inlined by the
     * backend so the card renders without issuing a per-card GET
     * `/favorites/:id`. Null when this post is a pure time capsule.
     */
    favorite?: Favorite | null;
  };
  /**
   * For collection posts (capsule.favorites non-empty), whether the
   * viewer has bookmarked the linked Favorite itself. Null when anonymous
   * or when this post doesn't link a favorite.
   */
  favoriteSavedByMe: boolean | null;
  author: FeedAuthor;
  score: number;
}

export interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function getTimeline(cursor?: string): Promise<FeedResponse> {
  const { data } = await apiClient.get<FeedResponse>('/feed/timeline', {
    params: {
      cursor: cursor || undefined,
      limit: 20
    }
  });

  // Hydrate dates like the other apis
  return {
    ...data,
    posts: data.posts.map(p => ({
      ...p,
      capsule: {
        ...p.capsule,
        createdAt: new Date(p.capsule.createdAt),
        unlockAt: p.capsule.unlockAt ? new Date(p.capsule.unlockAt) : undefined,
        favorite: p.capsule.favorite
          ? { ...p.capsule.favorite, createdAt: new Date(p.capsule.favorite.createdAt) }
          : null,
      }
    }))
  };
}

export interface TrendingCapsule {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  period?: string | null;
  createdAt: string | Date;
  loveCount: number;
  commentCount: number;
  author: FeedAuthor;
}

export interface TrendingResponse {
  items: TrendingCapsule[];
}

export async function getTrending(
  scope: 'global' | 'circles' = 'global',
  limit = 5,
): Promise<TrendingResponse> {
  const { data } = await apiClient.get<TrendingResponse>('/feed/trending', {
    params: { scope, limit },
  });
  return {
    items: data.items.map((item) => {
      // Backend returns { capsule: {...}, author: {...}, ... }.
      // Flatten it into the shape TrendingCapsule expects.
      const c = item.capsule;
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        image: c.image,
        period: c.period,
        createdAt:
          typeof c.createdAt === 'string'
            ? new Date(c.createdAt)
            : c.createdAt,
        loveCount: c.loveCount ?? 0,
        commentCount: c.commentCount ?? 0,
        author: item.author,
      };
    }),
  };
}
