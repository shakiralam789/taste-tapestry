"use client";
import { Favorite } from "@/types/wishbook";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Star } from "lucide-react";

interface ProfilePostCardProps {
  favorite: Favorite;
  /** grid = tall card (default), list = compact full-width row */
  variant?: "grid" | "list";
}

export function ProfilePostCard({
  favorite,
  variant = "grid",
}: ProfilePostCardProps) {
  if (variant === "list") {
    return (
      <motion.div
        whileHover={{ y: -3 }}
        className="group relative flex rounded-2xl overflow-hidden cursor-pointer bg-muted border border-white/5"
      >
        <div className="w-28 sm:w-32 h-24 sm:h-28 flex-shrink-0 overflow-hidden">
          {favorite.image ? (
            <img
              src={favorite.image}
              alt={favorite.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-2">
              <p className="font-display text-xs font-bold text-white/20 text-center uppercase tracking-widest break-words">
                {favorite.title}
              </p>
            </div>
          )}
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
          <h3 className="font-display text-sm sm:text-base font-semibold text-foreground truncate">
            {favorite.title}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-white/10" /> 24
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> 8
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default grid variant
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer bg-muted border border-white/5"
    >
      {/* Background Image */}
      {favorite.image ? (
        <img
          src={favorite.image}
          alt={favorite.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4 md:p-6">
          <p className="font-display md:text-2xl text-xl font-bold text-white/20 text-center uppercase tracking-widest break-words">
            {favorite.title}
          </p>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

      {/* Content */}
      <div className="absolute inset-0 p-3 md:p-5 flex flex-col justify-end">
        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-2 mb-2 text-primary text-xs font-semibold tracking-wider uppercase opacity-90 group-hover:opacity-100 transition-opacity delay-100">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {favorite.categoryId}
          </div>

          <h3 className="font-display md:text-xl text-lg font-bold text-white mb-2 leading-tight drop-shadow-md">
            {favorite.title}
          </h3>

          <div className="flex items-center justify-between text-white/80 text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300 delay-75">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-white/20" /> 24
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" /> 8
              </span>
            </div>
            {favorite.rating != null && (
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
