import { motion } from 'framer-motion';
import { Favorite } from '@/types/wishbook';
import { Star, Clock, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { moodOptions } from '@/data/mockData';

interface FavoriteCardProps {
  favorite: Favorite;
  onClick?: () => void;
}

export function FavoriteCard({ favorite, onClick }: FavoriteCardProps) {
  const getMoodEmoji = (moodId: string) => {
    return moodOptions.find(m => m.id === moodId)?.emoji || '✨';
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="elevated-card overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={favorite.image}
          alt={favorite.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
        
        {/* Rating Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
          <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
          <span className="text-sm font-semibold">{favorite.rating}</span>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-lg font-semibold text-primary-foreground mb-2 line-clamp-2">
            {favorite.title}
          </h3>
          
          {/* Mood Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {favorite.mood.slice(0, 3).map((mood) => (
              <span 
                key={mood} 
                className="text-xs px-2 py-0.5 rounded-full bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground"
              >
                {getMoodEmoji(mood)} {mood}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {favorite.whyILike}
        </p>
        
        <div className="flex items-center justify-between">
          {favorite.timePeriod && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{favorite.timePeriod}</span>
            </div>
          )}
          
          <button className="p-1.5 rounded-full hover:bg-accent transition-colors">
            <Heart className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
