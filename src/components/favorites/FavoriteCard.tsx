"use client";
import { useState } from 'react';
import { Favorite } from '@/types/wishbook';
import { useWishbook } from '@/contexts/WishbookContext';
import { EmotionalJourneyView } from '@/components/favorites/EmotionalJourneyView';
import { getFavoriteCoverImage } from '@/features/favorites/default-covers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Star, ChevronDown, ChevronUp, ArrowRight, Activity, Eye, MousePointerClick } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useImpressionTracker } from '@/hooks/useImpressionTracker';
import { useClickTracker } from '@/hooks/useClickTracker';
import { useToggleFavoriteSave, useIsFavoriteSaved, useSavedFavoriteIdsReady } from '@/hooks/useFavoriteSave';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/utils';

interface FavoriteCardProps {
  favorite: Favorite;
  onClick?: () => void;
  authorOverride?: {
    name: string;
    username: string;
    avatar: string | null;
  };
  matchPercentage?: number | null;
  /**
   * Whether the viewer has saved this favorite. Pass from the parent —
   * the card itself never fetches. This is what makes the timeline fast.
   */
  saved?: boolean | null;
  /** Show save/unsave bookmark — enabled on saved page only */
  showSaveButton?: boolean;
}

export function FavoriteCard({
  favorite,
  onClick,
  authorOverride,
  matchPercentage,
  saved = false,
  showSaveButton = false,
}: FavoriteCardProps) {
  const { allUsers, categories } = useWishbook();
  const { user } = useAuth();
  const router = useRouter();
  const [showEmotionalJourney, setShowEmotionalJourney] = useState(false);
  const isOwner = user?.id === favorite.userId;
  const { toggle: toggleSave, isToggling } = useToggleFavoriteSave(favorite.id);
  // The mutation patches the shared SAVED_FAVORITE_IDS_KEY on click, so the
  // cache is the source of truth once it's loaded. Until then we fall back
  // to the prop (server truth at render time) so the icon paints correctly
  // on first render.
  const isSavedFromCache = useIsFavoriteSaved(favorite.id);
  const cacheLoaded = useSavedFavoriteIdsReady();
  const isSaved = cacheLoaded ? isSavedFromCache : saved === true;

  const category = categories.find(c => c.id === favorite.categoryId);

  const { ref } = useImpressionTracker({
    itemId: favorite.id,
    source: "feed",
    enabled: user?.id !== favorite.userId,
  });

  const { trackClick } = useClickTracker("feed");

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
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden mb-4 hover:border-primary/20 transition-colors"
    >
      {/* Main horizontal layout */}
      <div className="flex">
        {/* Left: Poster Image */}
        <div
          onClick={(e) => {
            if (user?.id !== favorite.userId) trackClick(favorite.id);
            if (onClick) onClick();
          }}
          className="group cursor-pointer relative flex-shrink-0 w-28 md:w-36 bg-black/60 overflow-hidden">
          <img
            src={getFavoriteCoverImage(favorite.image, favorite.categoryId)}
            alt={favorite.title}
            className="duration-300 group-hover:scale-105 absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-125"
            onError={(e) => {
              e.currentTarget.src = getFavoriteCoverImage("", favorite.categoryId);
            }}
          />
          <img
            src={getFavoriteCoverImage(favorite.image, favorite.categoryId)}
            alt={favorite.title}
            className="duration-300 group-hover:scale-105 relative w-full h-full object-cover z-10"
            onError={(e) => {
              e.currentTarget.src = getFavoriteCoverImage("", favorite.categoryId);
            }}
          />
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0 p-3 md:p-4 flex flex-col justify-between">
          {/* Top: Author row */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar
                className="w-6 h-6 ring-1 ring-primary/20 cursor-pointer flex-shrink-0"
                onClick={handleAuthorClick}
              >
                <AvatarImage src={author.avatar ?? undefined} />
                <AvatarFallback className="text-[10px]">{author.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <span
                  className="text-xs font-medium text-foreground/80 hover:underline cursor-pointer truncate block"
                  onClick={handleAuthorClick}
                >
                  {author.name}
                </span>
                <span className="text-muted-foreground text-[10px]">
                  {category && <>{category.icon} {category.name} · </>}
                  {formatDistanceToNow(new Date(favorite.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            {matchPercentage !== undefined && matchPercentage !== null && (
              <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/15 border border-primary/30 backdrop-blur-sm flex-shrink-0">
                {matchPercentage}% Match
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="text-sm md:text-base font-display font-semibold leading-tight cursor-pointer hover:text-primary transition-colors line-clamp-1 mb-1"
            onClick={(e) => {
              if (user?.id !== favorite.userId) trackClick(favorite.id);
              if (onClick) onClick();
            }}
          >
            {favorite.title}
          </h3>

          {/* Why I Like - truncated */}
          <p className="text-xs text-foreground/70 leading-relaxed mb-2">
            {favorite.whyILike.length > 110 ? (
              <>
                {favorite.whyILike.substring(0, 110)}...{" "}
                <span
                  className="text-primary hover:underline cursor-pointer font-medium"
                  onClick={onClick}
                >
                  See more
                </span>
              </>
            ) : (
              favorite.whyILike
            )}
          </p>

          {/* Rating + Tags row */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary/90 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              <Star className="w-3 h-3 fill-current" />
              {favorite.rating}/10
            </span>
            {favorite.timePeriod && (
              <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                {favorite.timePeriod}
              </span>
            )}
            {favorite.mood.slice(0, 2).map((m) => (
              <span key={m} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/5 text-primary/70 border border-primary/10">
                #{m}
              </span>
            ))}
            {favorite.tags.slice(0, 1).map((t) => (
              <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary/5 text-secondary/70 border border-secondary/10">
                #{t}
              </span>
            ))}
            {(favorite.mood.length + favorite.tags.length) > 3 && (
              <span className="text-[10px] text-muted-foreground">+{favorite.mood.length + favorite.tags.length - 3}</span>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 px-1.5 rounded-full group"
                onClick={handleShare}
              >
                <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </Button>
              {!isOwner && showSaveButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-1.5 rounded-full group",
                    isSaved
                      ? "text-primary hover:text-primary hover:bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                  )}
                  disabled={isToggling}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave();
                  }}
                  title={isSaved ? "Saved to collection" : "Save to collection"}
                >
                  <Bookmark
                    className={cn(
                      "w-3.5 h-3.5 group-hover:scale-110 transition-transform",
                      isSaved && "fill-current",
                    )}
                  />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mr-2">
                {user?.id === favorite.userId && (
                  <>
                    <span className="flex items-center gap-1" title="Views">
                      <Eye className="w-3.5 h-3.5" /> {favorite.viewCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1" title="Clicks">
                      <MousePointerClick className="w-3.5 h-3.5" /> {favorite.clickCount ?? 0}
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={onClick}
                className="capitalize text-primary/60 inline-flex items-center gap-1 text-[11px] hover:text-primary cursor-pointer transition-colors"
              >
                details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emotional Journey — full width below the horizontal layout */}
      {((favorite.fields?.emotionalSegments?.length > 0 && favorite.categoryId !== 'series' && favorite.categoryId !== 'anime') ||
        (favorite.fields?.totalDurationSeconds && favorite.fields?.emotionalCurve?.length >= 2) ||
        ((favorite.categoryId === 'series' || favorite.categoryId === 'anime') && Array.isArray(favorite.fields?.episodeSegments) && favorite.fields.episodeSegments.some((arr: unknown) => Array.isArray(arr) && arr.length > 0)) ||
        (favorite.fields?.emotionalCurve?.length >= 2 && favorite.fields?.emotionalCurve?.some((p: { id?: string }) => p.id)) ||
        (favorite.fields?.emotionalCurve?.length >= 5) ||
        (favorite.fields?.momentPins?.length ?? 0) > 0) && (
          <div className="border-t border-white/5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowEmotionalJourney(prev => !prev); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 transition-all text-xs group ${showEmotionalJourney
                ? 'bg-primary/10 text-primary'
                : 'bg-card/20 text-muted-foreground hover:bg-card/40 hover:text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <Activity className={`w-3.5 h-3.5 ${showEmotionalJourney ? 'text-primary' : 'text-primary/60 group-hover:text-primary transition-colors'}`} />
                <span className="font-medium">Emotional Journey</span>
              </div>
              {showEmotionalJourney ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 group-hover:text-foreground transition-colors" />}
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
                  <div className="p-4 bg-card/30 border-t border-white/5">
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
    </motion.div>
  );
}
