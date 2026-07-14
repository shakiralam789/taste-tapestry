"use client";

import { useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import {
  Flame,
  Heart,
  MessageCircle,
  UserPlus,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/AuthContext';
import {
  getSuggestedUsers,
  followUser,
  type SuggestedUser,
} from '@/features/users/api';
import { getTrending, type TrendingCapsule } from '@/features/feed/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SUGGESTED_LIMIT = 5;
const TRENDING_LIMIT = 5;

type TrendingScope = 'global' | 'circles';

export function RightSidebar() {
  const router = useRouter();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [trendingScope, setTrendingScope] = useState<TrendingScope>('global');

  const suggestedQueryKey = ['suggested-users', SUGGESTED_LIMIT];

  const {
    data: suggestions = [],
    isLoading,
  } = useQuery({
    queryKey: suggestedQueryKey,
    queryFn: () => getSuggestedUsers(SUGGESTED_LIMIT),
    enabled: !!auth.user,
  });

  const trendingQuery = useQuery({
    queryKey: ['trending', trendingScope, TRENDING_LIMIT],
    queryFn: () => getTrending(trendingScope, TRENDING_LIMIT),
    staleTime: 60_000,
    // Keep the previous scope's items visible while the new scope loads —
    // this prevents the panel from flashing an empty/skeleton state when the
    // user toggles between "Global" and "Your Circles".
    placeholderData: keepPreviousData,
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: suggestedQueryKey });
      const previous =
        queryClient.getQueryData<SuggestedUser[]>(suggestedQueryKey);
      // Optimistically remove the followed user from the list.
      queryClient.setQueryData<SuggestedUser[]>(
        suggestedQueryKey,
        (old) => (old ?? []).filter((u) => u.id !== userId),
      );
      return { previous };
    },
    onError: (_err, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(suggestedQueryKey, context.previous);
      }
      toast.error('Could not follow');
    },
    onSuccess: (_data, userId) => {
      void queryClient.invalidateQueries({
        queryKey: ['user-follow-status', userId],
      });
      toast.success('Following');
    },
  });

  const handleFollow = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!auth.user) {
      toast.error('Please log in to follow users');
      return;
    }
    followMutation.mutate(userId);
  };

  const handleTrendingClick = (item: TrendingCapsule) => {
    router.push(`/capsules/${item.id}`);
  };

  return (
    <aside className="pt-20 fixed right-0 top-0 h-screen w-80 bg-sidebar border-l border-sidebar-border hidden xl:flex flex-col p-6 z-40 gap-8 overflow-y-auto">

      {/* Trending Now */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Trending Now
          </h3>
        </div>

        {/* Scope toggle */}
        <div
          role="tablist"
          aria-label="Trending scope"
          className="inline-flex w-full items-center rounded-full border border-white/10 bg-card/60 p-0.5"
        >
          {(['global', 'circles'] as TrendingScope[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={trendingScope === s}
              onClick={() => setTrendingScope(s)}
              className={cn(
                "flex-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                trendingScope === s
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s === 'global' ? 'Global' : 'Your Circles'}
            </button>
          ))}
        </div>

        {/* Trending list */}
        <div
          className={cn(
            "space-y-1 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-1.5 transition-opacity duration-150",
            trendingQuery.isFetching && trendingQuery.data
              ? "opacity-60"
              : "opacity-100",
          )}
        >
          {trendingQuery.isPending && !trendingQuery.data ? (
            <TrendingSkeleton />
          ) : (trendingQuery.data?.items?.length ?? 0) === 0 ? (
            <div className="px-3 py-6 text-center">
              <Flame className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Nothing is trending yet — be the first to post.
              </p>
            </div>
          ) : (
            trendingQuery.data!.items
              // Dedupe defensively in case the backend returns the same
              // capsule twice across overlapping ranking windows.
              .filter(
                (item, idx, arr) =>
                  arr.findIndex((x) => x.id === item.id) === idx,
              )
              .map((item, i) => (
                <TrendingRow
                  // Prefix the key with the active scope so that during a
                  // keepPreviousData transition (Global <-> Your Circles)
                  // the two lists can't collide on identical capsule ids.
                  key={`${trendingScope}-${item.id}`}
                  rank={i + 1}
                  item={item}
                  onClick={() => handleTrendingClick(item)}
                />
              ))
          )}
        </div>
      </div>

      {/* Suggested Users */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-secondary" />
          Who to Follow
        </h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3">
              No suggestions right now. Check back later!
            </p>
          ) : (
            suggestions.map((user) => {
              const name = user.displayName || user.username || 'User';
              return (
                <div
                  key={user.id}
                  onClick={() => router.push(`/users/${user.id}`)}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <Avatar className="w-10 h-10 ring-2 ring-transparent group-hover:ring-secondary/50 transition-all">
                    {user.avatar && <AvatarImage src={user.avatar} alt={name} />}
                    <AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleFollow(e, user.id)}
                    disabled={
                      followMutation.isPending &&
                      followMutation.variables === user.id
                    }
                    className="h-8 w-8 p-0 rounded-full border-secondary/50 text-secondary hover:bg-secondary hover:text-white"
                    aria-label={`Follow ${name}`}
                  >
                    {followMutation.isPending &&
                    followMutation.variables === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 text-xs text-muted-foreground text-center">
        <p>© 2026 TasteTapestry. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <span className="hover:text-primary cursor-pointer">Privacy</span>
          <span className="hover:text-primary cursor-pointer">Terms</span>
          <span className="hover:text-primary cursor-pointer">More</span>
        </div>
      </div>
    </aside>
  );
}

// ── Trending row ────────────────────────────────────────────────────────────
function TrendingRow({
  rank,
  item,
  onClick,
}: {
  rank: number;
  item: TrendingCapsule;
  onClick: () => void;
}) {
  const title = item.title || 'Untitled capsule';
  const subtitle = item.period || 'Time capsule';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-white/5 transition-colors"
    >
      {/* Rank */}
      <span
        className={cn(
          'shrink-0 w-6 text-right font-mono text-sm tabular-nums',
          rank === 1 ? 'text-orange-500 font-bold' : 'text-muted-foreground/70',
        )}
        aria-hidden
      >
        {rank}
      </span>

      {/* Cover thumbnail */}
      <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-muted ring-1 ring-white/10">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30">
            <Flame className="w-4 h-4 text-white/70" />
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-2">
          <span>{subtitle}</span>
          <span className="inline-flex items-center gap-0.5">
            <Heart className="w-3 h-3" />
            {formatCount(item.loveCount)}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <MessageCircle className="w-3 h-3" />
            {formatCount(item.commentCount)}
          </span>
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

function TrendingSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2.5 py-2 animate-pulse">
          <div className="w-6 h-3 rounded bg-muted" />
          <div className="w-9 h-9 rounded-lg bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded bg-muted w-3/4" />
            <div className="h-2 rounded bg-muted w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
