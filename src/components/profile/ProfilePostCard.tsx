"use client";
import { useEffect, useState } from "react";
import { Favorite } from "@/types/wishbook";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFavoriteLove } from "@/features/favorites/api";
import { PrivateBadge } from "@/components/common/PrivateBadge";
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
  variant = "grid",
  onTitleClick,
}: ProfilePostCardProps) {
  const queryClient = useQueryClient();
  const [loved, setLoved] = useState(favorite.lovedByMe ?? false);
  const [loveCount, setLoveCount] = useState(favorite.loveCount ?? 0);

  useEffect(() => {
    setLoved(favorite.lovedByMe ?? false);
    setLoveCount(favorite.loveCount ?? 0);
  }, [favorite.lovedByMe, favorite.loveCount]);
  const loveMutation = useMutation({
    mutationFn: () => toggleFavoriteLove(favorite.id),
    onMutate: () => {
      setLoved((prev) => !prev);
      setLoveCount((prev) => (loved ? Math.max(prev - 1, 0) : prev + 1));
    },
    onSuccess: ({ loved, count }) => {
      setLoved(loved);
      setLoveCount(count);
      queryClient.setQueriesData<Favorite>(
        { queryKey: ["favorite", favorite.id] },
        (old) =>
          old
            ? {
                ...old,
                lovedByMe: loved,
                loveCount: count,
              }
            : old,
      );
      queryClient.setQueriesData<Favorite[]>(
        { queryKey: ["favorites"] },
        (old) =>
          old
            ? old.map((f) =>
                f.id === favorite.id
                  ? { ...f, lovedByMe: loved, loveCount: count }
                  : f,
              )
            : old,
      );
    },
  });

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
          {(() => {
            const sub = getCategoryCardSubtitle(
              favorite.categoryId,
              favorite.fields,
            );
            return sub ? (
              <p className="text-[11px] text-muted-foreground truncate mb-0.5">
                {sub}
              </p>
            ) : null;
          })()}
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
          {favorite.isPublic === false && (
            <PrivateBadge className="absolute top-2 left-2 w-fit mt-0.5" />
          )}
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground"
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                loveMutation.mutate();
              }}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  loved ? "fill-red-500 text-red-500" : "fill-white/10"
                }`}
              />
              <span>{loveCount}</span>
            </button>
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
        {favorite.isPublic === false && (
          <PrivateBadge className="absolute top-3 left-3" />
        )}
        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <div className="px-3 md:px-5">
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTitleClick?.();
              }}
              className="text-left w-fit"
            >
              <h3 className="font-display md:text-xl text-lg font-bold text-white mb-2 leading-tight drop-shadow-md underline-offset-2 hover:underline">
                {favorite.title}
              </h3>
            </button>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="cursor-default p-3 md:p-5 pt-2 md:pt-2.5 flex items-center justify-between text-white/80 text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300 delay-75"
          >
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  loveMutation.mutate();
                }}
              >
                <Heart
                  className={`w-4 h-4 ${
                    loved ? "fill-red-500 text-red-500" : "fill-white/20"
                  }`}
                />{" "}
                {loveCount}
              </button>
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
