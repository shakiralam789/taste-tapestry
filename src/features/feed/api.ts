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
