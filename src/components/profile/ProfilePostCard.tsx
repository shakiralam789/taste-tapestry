import { Favorite } from '@/types/wishbook';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Star } from 'lucide-react';

interface ProfilePostCardProps {
  favorite: Favorite;
  onClick?: () => void;
}

export function ProfilePostCard({ favorite, onClick }: ProfilePostCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer bg-muted border border-white/5"
      onClick={onClick}
    >
      {/* Background Image */}
      {favorite.image ? (
        <img
          src={favorite.image}
          alt={favorite.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-6">
          <p className="font-display text-2xl font-bold text-white/20 text-center uppercase tracking-widest break-words">
            {favorite.title}
          </p>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

      {/* Content */}
      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-2 mb-2 text-primary text-xs font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity delay-100">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {favorite.category}
          </div>
          
          <h3 className="font-display text-xl font-bold text-white mb-2 leading-tight drop-shadow-md">
            {favorite.title}
          </h3>
          
          <div className="flex items-center justify-between text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
             <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 fill-white/20" /> 24
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" /> 8
                </span>
             </div>
             {favorite.rating && (
               <span className="flex items-center gap-1 text-yellow-500 font-bold">
                 <Star className="w-3.5 h-3.5 fill-yellow-500" />
                 {favorite.rating}
               </span>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
