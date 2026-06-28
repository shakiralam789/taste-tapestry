import { motion } from 'framer-motion';
import { TopMatchItem } from '@/features/users/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface TasteMatchCardProps {
  match: TopMatchItem;
  onClick?: () => void;
}

export function TasteMatchCard({ match, onClick }: TasteMatchCardProps) {
  const scorePercent = match.score;
  const user = match.user;

  
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
            <Button size="sm" variant="gradient" className="flex-1">
              <Heart className="w-4 h-4" />
              Follow
            </Button>
            <Button size="sm" variant="outline">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
