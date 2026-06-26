import { useInfiniteQuery } from "@tanstack/react-query";
import { getTimeline } from "./api";

export function useTimeline() {
  const query = useInfiniteQuery({
    queryKey: ["feed", "timeline"],
    queryFn: ({ pageParam }) => getTimeline(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];

  return {
    ...query,
    posts,
  };
}
