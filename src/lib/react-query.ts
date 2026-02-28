import { QueryClient } from "@tanstack/react-query";

/** Default stale time: avoid refetching on every navigation/focus for list and detail data. */
const DEFAULT_STALE_MS = 2 * 60 * 1000; // 2 minutes

/** How long unused data stays in cache. */
const DEFAULT_GC_MS = 10 * 60 * 1000; // 10 minutes

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_MS,
      gcTime: DEFAULT_GC_MS,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
};

export function createQueryClient(): QueryClient {
  return new QueryClient(queryClientConfig);
}
