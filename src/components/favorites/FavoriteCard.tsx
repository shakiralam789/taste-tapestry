"use client";
import { useState } from 'react';
import { Favorite } from '@/types/wishbook';
import { useWishbook } from '@/contexts/WishbookContext';
import { EmotionalJourneyView } from '@/components/favorites/EmotionalJourneyView';
import { getFavoriteCoverImage } from '@/features/favorites/default-covers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Star, ChevronDown, ChevronUp, ArrowRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface FavoriteCardProps {
  favorite: Favorite;
  onClick?: () => void;
  authorOverride?: {
    name: string;
    username: string;
    avatar: string | null;
  };
  matchPercentage?: number | null;
}

export function FavoriteCard({ favorite, onClick, authorOverride, matchPercentage }: FavoriteCardProps) {
  const { allUsers } = useWishbook();
  const router = useRouter();
  const [showEmotionalJourney, setShowEmotionalJourney] = useState(false);

  const author = authorOverride || allUsers.find(u => u.id === favorite.userId) || {
    name: 'Unknown User',
    username: 'unknown',
    avatar: '',
  };

  const handleAuthorClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (favorite.userId) {
      router.push(`/users/${favorite.userId}`);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/favorites/${favorite.id}`;
    const title = favorite.title || "Check out this favorite on Taste Tapestry";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error("Could not share favorite");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Could not copy link");
      }
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
            <AvatarImage src={author.avatar ?? undefined} />
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
              <span className="text-muted-foreground text-xs">
                • {formatDistanceToNow(new Date(favorite.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-primary/80 flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" /> 
              {favorite.timePeriod ? `${favorite.timePeriod} • ` : ""}
              {favorite.rating}/10
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {matchPercentage !== undefined && matchPercentage !== null && (
            <span className="text-xs font-semibold text-primary px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
              {matchPercentage}% Match
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        <h3 
          className="text-lg font-display font-semibold mb-2 cursor-pointer hover:text-primary transition-colors"
          onClick={onClick}
        >
          {favorite.title}
        </h3>
        <p className="text-sm md:text-base text-foreground/90 mb-3 whitespace-pre-wrap leading-relaxed">
          {favorite.whyILike}
        </p>

        {/* Media */}
        <div className="relative rounded-xl overflow-hidden mb-3 border border-white/5 bg-black/80 flex items-center justify-center group cursor-pointer">
          <img
            src={getFavoriteCoverImage(favorite.image, favorite.categoryId)}
            alt={favorite.title}
            className="max-h-[420px] w-full object-contain z-10 transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = getFavoriteCoverImage("", favorite.categoryId);
            }}
          />
          <img
            src={getFavoriteCoverImage(favorite.image, favorite.categoryId)}
            alt={favorite.title}
            className="absolute inset-0 w-full h-full object-cover z-0 blur-2xl opacity-30"
            onError={(e) => {
              e.currentTarget.src = getFavoriteCoverImage("", favorite.categoryId);
            }}
          />
        </div>

        {/* Emotional journey (read-only) when present — collapsed by default */}
        {((favorite.fields?.emotionalSegments?.length > 0 && favorite.categoryId !== 'series' && favorite.categoryId !== 'anime') ||
          (favorite.fields?.totalDurationSeconds && favorite.fields?.emotionalCurve?.length >= 2) ||
          ((favorite.categoryId === 'series' || favorite.categoryId === 'anime') && Array.isArray(favorite.fields?.episodeSegments) && favorite.fields.episodeSegments.some((arr: unknown) => Array.isArray(arr) && arr.length > 0)) ||
          (favorite.fields?.emotionalCurve?.length >= 2 && favorite.fields?.emotionalCurve?.some((p: { id?: string }) => p.id)) ||
          (favorite.fields?.emotionalCurve?.length >= 5) ||
          (favorite.fields?.momentPins?.length ?? 0) > 0) && (
          <div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowEmotionalJourney(prev => !prev); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm group ${
                showEmotionalJourney 
                  ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]' 
                  : 'bg-card/30 border-white/5 hover:bg-card/50 hover:border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className={`w-4 h-4 ${showEmotionalJourney ? 'text-primary' : 'text-primary/60 group-hover:text-primary transition-colors'}`} />
                <span className="font-medium">Emotional Journey</span>
              </div>
              {showEmotionalJourney ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 group-hover:text-foreground transition-colors" />}
            </button>
            <AnimatePresence>
              {showEmotionalJourney && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-b-xl bg-card/30 border border-t-0 border-white/5">
                    <EmotionalJourneyView
                      categoryId={favorite.categoryId}
                      totalDurationSeconds={favorite.fields?.totalDurationSeconds}
                      episodeDurations={Array.isArray(favorite.fields?.episodeDurations) ? favorite.fields.episodeDurations : undefined}
                      episodeSegments={Array.isArray(favorite.fields?.episodeSegments) ? favorite.fields.episodeSegments : undefined}
                      seasonEpisodeCounts={Array.isArray(favorite.fields?.seasonEpisodeCounts) ? favorite.fields.seasonEpisodeCounts : undefined}
                      curvePoints={Array.isArray(favorite.fields.emotionalCurve) ? favorite.fields.emotionalCurve : []}
                      emotionalSegments={Array.isArray(favorite.fields.emotionalSegments) ? favorite.fields.emotionalSegments : []}
                      momentPins={Array.isArray(favorite.fields.momentPins) ? favorite.fields.momentPins : []}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-1.5 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 px-2 rounded-full group"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 px-2 rounded-full group">
              <Bookmark className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
          <button
            type="button"
            onClick={onClick}
            className="capitalize text-primary/60 inline-flex items-center gap-1.5 text-xs hover:text-primary cursor-pointer transition-colors"
          >
            show details
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
