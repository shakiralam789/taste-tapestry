import { motion } from 'framer-motion';
import { TopMatchItem } from '@/features/users/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Sparkles, CheckCircle2, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFollowStatus, followUser, unfollowUser } from '@/features/users/api';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface TasteMatchCardProps {
  match: TopMatchItem;
  onClick?: () => void;
}

export function TasteMatchCard({ match, onClick }: TasteMatchCardProps) {
  const scorePercent = match.score;
  const user = match.user;
  const auth = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: followStatus, isLoading: followStatusLoading } = useQuery({
    queryKey: ['user-follow-status', match.matchedUserId],
    queryFn: () => getFollowStatus(match.matchedUserId),
    enabled: !!auth.user && auth.user.id !== match.matchedUserId,
  });

  const isFollowing = followStatus?.isFollowing ?? false;

  const followMutation = useMutation({
    mutationFn: () => followUser(match.matchedUserId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-follow-status', match.matchedUserId] });
      toast.success('Following');
    },
    onError: () => toast.error('Could not follow'),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(match.matchedUserId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-follow-status', match.matchedUserId] });
      toast.success('Unfollowed');
    },
    onError: () => toast.error('Could not unfollow'),
  });

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.user) {
      toast.error('Please log in to follow users');
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.user) {
      toast.error('Please log in to send messages');
      return;
    }
    router.push(`/messages?userId=${match.matchedUserId}`);
  };
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="elevated-card p-6 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Score Circle */}
        <div className="relative">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(hsl(var(--primary)) ${scorePercent}%, hsl(var(--muted)) ${scorePercent}%)`,
              padding: '4px'
            }}
          >
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <span className="font-display text-2xl font-bold gradient-text">
                {scorePercent}%
              </span>
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-secondary-foreground" />
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20">
              {user?.avatar && <AvatarImage src={user.avatar} alt={user.displayName} />}
              <AvatarFallback>{user?.displayName?.[0] ?? 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{user?.displayName}</h3>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
            </div>
          </div>

          {/* Reasons */}
          <div className="space-y-2 mb-4 mt-4">
            {match.reasons.slice(0, 3).map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{reason.text}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "gradient"}
              className="flex-1"
              onClick={handleFollowClick}
              disabled={followStatusLoading || followMutation.isPending || unfollowMutation.isPending}
            >
              {isFollowing ? <Users className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
              {followMutation.isPending || unfollowMutation.isPending
                ? '...'
                : isFollowing
                  ? 'Following'
                  : 'Follow'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleMessageClick}>
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
