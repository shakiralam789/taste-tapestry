import { apiClient } from "@/lib/api-client";
import type { TimeCapsule } from "@/types/wishbook";

export interface FeedAuthor {
  id: string;
  displayName: string | null;
  username: string | null;
  avatar: string | null;
}

export interface FeedPost {
  type: 'capsule';
  capsule: TimeCapsule & { loveCount: number; lovedByMe: boolean; commentCount: number };
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
