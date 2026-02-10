import { Favorite } from '@/types/wishbook';
import { useWishbook } from '@/contexts/WishbookContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface FavoriteCardProps {
  favorite: Favorite;
  onClick?: () => void;
}

export function FavoriteCard({ favorite, onClick }: FavoriteCardProps) {
  const { allUsers } = useWishbook();
  const navigate = useNavigate();

  const author = allUsers.find(u => u.id === favorite.userId) || {
    name: 'Unknown User',
    username: 'unknown',
    avatar: '',
  };

  const handleAuthorClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (favorite.userId) {
      navigate(`/users/${favorite.userId}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 mb-4 hover:border-primary/20 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar 
            className="w-10 h-10 ring-2 ring-primary/20 cursor-pointer"
            onClick={handleAuthorClick}
          >
            <AvatarImage src={author.avatar} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-bold text-foreground hover:underline cursor-pointer"
                onClick={handleAuthorClick}
              >
                {author.name}
              </span>
              {/* <span className="text-muted-foreground text-sm">
                @{author.username}
              </span> */}
              <span className="text-muted-foreground text-xs">
                • {formatDistanceToNow(new Date(favorite.createdAt), { addSuffix: true })}
              </span>
            </div>
            {favorite.timePeriod && (
               <p className="text-xs text-primary/80 flex items-center gap-1">
                 <Star className="w-3 h-3 fill-current" /> 
                 {favorite.title} • {favorite.rating}/10
               </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="" onClick={onClick}>
        <h3 className="text-lg font-display font-semibold mb-2">{favorite.title}</h3>
        <p className="text-foreground/90 mb-3 whitespace-pre-wrap leading-relaxed">
          {favorite.whyILike}
        </p>

        {/* Media */}
        {favorite.image && (
          <div className="rounded-xl overflow-hidden mb-3 border border-white/5 bg-black/20 relative group cursor-pointer">
            <img 
              src={favorite.image} 
              alt={favorite.title} 
              className="w-full max-h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}

        {/* Tags/Moods */}
        <div className="flex flex-wrap gap-2 mb-4">
          {favorite.mood.map((m) => (
            <span key={m} className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              #{m}
            </span>
          ))}
          {favorite.tags.map((t) => (
            <span key={t} className="text-xs font-medium px-2 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
              #{t}
            </span>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10 px-2 rounded-full group">
              <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs">24</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 px-2 rounded-full group">
              <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs">8</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 px-2 rounded-full group">
              <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-primary px-2">
             <Bookmark className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
