import { motion } from 'framer-motion';
import { TasteMatch } from '@/types/wishbook';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Sparkles } from 'lucide-react';

interface TasteMatchCardProps {
  match: TasteMatch;
  onClick?: () => void;
}

export function TasteMatchCard({ match, onClick }: TasteMatchCardProps) {
  const scorePercent = match.compatibilityScore;
  
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
              <AvatarImage src={match.user.avatar} alt={match.user.name} />
              <AvatarFallback>{match.user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{match.user.name}</h3>
              <p className="text-sm text-muted-foreground">@{match.user.username}</p>
            </div>
          </div>

          {/* Location */}
          {match.user.location && (
            <p className="text-sm text-muted-foreground mb-3">
              📍 {match.user.location}
            </p>
          )}

          {/* Category Breakdown */}
          <div className="space-y-2 mb-4">
            {match.breakdown.slice(0, 3).map((item) => (
              <div key={item.category} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">{item.category}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ background: 'var(--gradient-sunset)' }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">{item.score}%</span>
              </div>
            ))}
          </div>

          {/* Shared Favorites Preview */}
          {match.sharedFavorites.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Shared:</span>
              <div className="flex -space-x-2">
                {match.sharedFavorites.slice(0, 3).map((fav) => (
                  <div 
                    key={fav.id}
                    className="w-8 h-8 rounded-lg border-2 border-background overflow-hidden"
                  >
                    <img src={fav.image} alt={fav.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {match.sharedFavorites.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{match.sharedFavorites.length - 3} more
                </span>
              )}
            </div>
          )}

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
