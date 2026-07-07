"use client";
import { Favorite } from "@/types/wishbook";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { PrivateBadge } from "@/components/common/PrivateBadge";
import { DraftBadge } from "@/components/common/DraftBadge";
import { getCategoryCardSubtitle } from "@/features/favorites/category-fields";
import { getFavoriteCoverImage } from "@/features/favorites/default-covers";

interface ProfilePostCardProps {
  favorite: Favorite;
  /** grid = tall card (default), list = compact full-width row */
  variant?: "grid" | "list";
  onTitleClick?: () => void;
}

export function ProfilePostCard({
  favorite,
  variant = "list",
  onTitleClick,
}: ProfilePostCardProps) {

  if (variant === "list") {
    return (
      <motion.div
        whileHover={{ y: -3 }}
        className="group relative flex rounded-2xl overflow-hidden bg-muted border border-white/5"
      >
        <div className="w-28 sm:w-32 h-24 sm:h-28 flex-shrink-0 overflow-hidden">
          <img
            src={getFavoriteCoverImage(favorite.image, favorite.categoryId)}
            alt={favorite.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = getFavoriteCoverImage(
                "",
                favorite.categoryId,
              );
            }}
          />
        </div>
        <div className="flex-1 flex flex-col justify-center px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              {favorite.categoryId}
            </span>
            {favorite.rating != null && (
              <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] text-yellow-500 font-semibold">
                <Star className="w-3 h-3 fill-yellow-500" />
                {favorite.rating}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTitleClick?.();
            }}
            className="text-left w-fit"
          >
            <h3 className="font-display text-sm sm:text-base font-semibold text-foreground truncate underline-offset-2 hover:underline">
              {favorite.title}
            </h3>
          </button>
          {favorite.status === 'private' && (
            <PrivateBadge className="absolute top-2 left-2 w-fit mt-0.5" />
          )}
          {favorite.status === 'draft' && (
            <DraftBadge className="absolute top-2 left-2 w-fit mt-0.5 rounded bg-gray-500/20 px-1.5 py-0.5 text-[10px] text-gray-400 ring-gray-500/20" />
          )}
        </div>
      </motion.div>
    );
  }

  // Default grid variant
  return (
    <motion.div
      onClick={() => onTitleClick?.()}
      whileHover={{ y: -5 }}
      className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-muted border border-white/5"
    >
      {/* Background Image */}
      <img
        src={getFavoriteCoverImage(favorite.image, favorite.categoryId)}
        alt={favorite.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        onError={(e) => {
          e.currentTarget.src = getFavoriteCoverImage("", favorite.categoryId);
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end">
        {favorite.status === 'private' && (
          <PrivateBadge className="absolute top-3 left-3" />
        )}
        {favorite.status === 'draft' && (
          <DraftBadge className="absolute top-3 left-3" />
        )}
        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <div className="px-3 md:px-4">
            <div className="flex items-center gap-2 mb-1 text-primary text-xs font-semibold tracking-wider uppercase opacity-90 group-hover:opacity-100 transition-opacity delay-100">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {favorite.categoryId}
            </div>
            {(() => {
              const sub = getCategoryCardSubtitle(
                favorite.categoryId,
                favorite.fields,
              );
              return sub ? (
                <p className="text-[11px] text-white/80 truncate mb-1 drop-shadow-md">
                  {sub}
                </p>
              ) : null;
            })()}
            <p className="truncate font-display md:text-lg text-base font-bold text-white mb-2 leading-tight drop-shadow-md underline-offset-2 hover:underline">
              {favorite.title}
            </p>
          </div>
          {favorite.rating != null && (
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="cursor-default p-3 md:p-5 pt-2 md:pt-2.5 flex items-center justify-end text-white/80 text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300 delay-75"
            >
              <span className="flex items-center gap-1 text-yellow-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-yellow-500" />
                {favorite.rating}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
