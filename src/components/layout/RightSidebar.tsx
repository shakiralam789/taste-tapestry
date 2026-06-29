"use client";

import { useRouter } from 'next/navigation';
import { TrendingUp, UserPlus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/AuthContext';
import {
  getSuggestedUsers,
  followUser,
  type SuggestedUser,
} from '@/features/users/api';
import { toast } from 'sonner';

const SUGGESTED_LIMIT = 5;

export function RightSidebar() {
  const router = useRouter();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const trends = [
    { tag: '#CyberPunk2077', posts: '54.2k' },
    { tag: '#NeuralLink', posts: '32.1k' },
    { tag: '#SpaceX', posts: '28.4k' },
    { tag: '#AIArt', posts: '21.9k' },
  ];

  const suggestedQueryKey = ['suggested-users', SUGGESTED_LIMIT];

  const {
    data: suggestions = [],
    isLoading,
  } = useQuery({
    queryKey: suggestedQueryKey,
    queryFn: () => getSuggestedUsers(SUGGESTED_LIMIT),
    enabled: !!auth.user,
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

  return (
    <aside className="pt-20 fixed right-0 top-0 h-screen w-80 bg-sidebar border-l border-sidebar-border hidden xl:flex flex-col p-6 z-40 gap-8 overflow-y-auto">

      {/* Trending */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Trending Now
        </h3>
        <div className="space-y-4 bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/10 dark:border-white/10">
          {trends.map((trend, i) => (
            <div key={i} className="flex justify-between items-center group cursor-pointer">
              <div>
                <p className="font-bold group-hover:text-primary transition-colors">{trend.tag}</p>
                <p className="text-xs text-muted-foreground">{trend.posts} posts</p>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-muted-foreground text-xl">→</span>
              </Button>
            </div>
          ))}
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
        <p>© 2026 Nebula Social. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <span className="hover:text-primary cursor-pointer">Privacy</span>
          <span className="hover:text-primary cursor-pointer">Terms</span>
          <span className="hover:text-primary cursor-pointer">More</span>
        </div>
      </div>
    </aside>
  );
}
