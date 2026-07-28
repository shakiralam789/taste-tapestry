import type { Favorite, TimeCapsule } from "@/types/wishbook";

/**
 * Adapter that turns a `TimeCapsule` (collection post) into the
 * `Favorite`-shaped object that `FavoriteCard` expects.
 *
 * This is the ONLY place that knows how to project a capsule onto a
 * Favorite. `FavoriteCard` reads a strict subset of Favorite fields
 * (see `FavoriteCard.tsx`), so we deliberately emit only those — we do
 * NOT invent empty `mood`, `recommendedTime`, or `fields` arrays just
 * to satisfy the type. Optional fields stay absent unless they have a
 * real value.
 *
 * `categoryId: "capsule"` is used by `getFavoriteCoverImage` to pick a
 * default cover while a real "collection" category doesn't exist.
 */
export function capsuleToFavorite(
  capsule: TimeCapsule,
  owner: {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
  },
): Favorite {
  const createdAt =
    capsule.createdAt instanceof Date
      ? capsule.createdAt
      : new Date(capsule.createdAt ?? Date.now());
  return {
    id: capsule.id,
    userId: capsule.userId,
    // Sentinel value used by the cover-image helper and the "is this a
    // capsule post?" check on the details page. Not a real category.
    categoryId: "capsule",
    title: capsule.title,
    image: capsule.image ?? null,
    rating: typeof capsule.avgRating === "number" ? capsule.avgRating : 0,
    viewCount: capsule.viewCount,
    clickCount: capsule.clickCount,
    whyILike: capsule.description || capsule.story || "",
    timePeriod: capsule.period,
    // Capsule has only `emotions` (free-form labels); no mood/tags split.
    mood: [],
    tags: capsule.emotions ?? [],
    createdAt,
    fields: {},
    status: capsule.visibility === "private" ? "private" : "published",
    author: {
      id: owner.id,
      name: owner.name,
      username: owner.username,
      avatar: owner.avatar ?? null,
    },
  };
}