import { motion } from "framer-motion";
import { TimeCapsule } from "@/types/wishbook";
import { Calendar, Globe2, Lock, Unlock, Film, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimeCapsuleCardProps {
  capsule: TimeCapsule;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onToggleVisibility?: (visibility: "public" | "private") => void;
  onDelete?: () => void;
}

export function TimeCapsuleCard({
  capsule,
  onClick,
  showActions,
  onEdit,
  onToggleVisibility,
  onDelete,
}: TimeCapsuleCardProps) {
  const visibility = capsule.visibility ?? "public";
  const unlockLabel =
    visibility === "future" && capsule.unlockAt
      ? `Opens ${capsule.unlockAt.toLocaleDateString()}`
      : "Future";

  const rawCover =
    capsule.image || capsule.images?.[0] || capsule.videos?.[0];
  const coverUrl =
    rawCover && rawCover.startsWith("blob:") ? undefined : rawCover;
  const isVideoCover =
    !!coverUrl && (capsule.videos ?? []).includes(coverUrl);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl bg-card/40 border border-white/5 backdrop-blur-sm hover:border-primary/30 transition-colors"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10" />

      {/* Media Header */}
      <div className="relative h-48 overflow-hidden">
        {coverUrl ? (
          isVideoCover ? (
            <video
              src={coverUrl}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:blur-[2px]"
              autoPlay
              muted
              loop
            />
          ) : (
            <img
              src={coverUrl}
              alt={capsule.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:blur-[2px]"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">
              No cover media
            </span>
          </div>
        )}

        {/* Period Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 z-20">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-white">
            {capsule.period}
          </span>
        </div>
        {/* Visibility + actions */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
          {visibility !== "public" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px]">
              {visibility === "private" && (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-xs font-medium text-amber-50">
                    Private
                  </span>
                </>
              )}
              {visibility === "future" && (
                <>
                  <Lock className="w-3.5 h-3.5 text-sky-300" />
                  <span className="text-xs font-medium text-sky-50">
                    {unlockLabel}
                  </span>
                </>
              )}
            </div>
          )}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 border border-white/10 text-muted-foreground hover:text-primary hover:border-primary/60 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    Edit capsule
                  </DropdownMenuItem>
                )}
                {onToggleVisibility && (
                  <DropdownMenuItem
                    onClick={() =>
                      onToggleVisibility(
                        visibility === "public" ? "private" : "public",
                      )
                    }
                  >
                    {visibility === "public"
                      ? "Make private"
                      : "Make public"}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500"
                    onClick={onDelete}
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5 z-20 -mt-12">
        <h3 className="font-display text-xl font-bold text-white mb-2 drop-shadow-lg">
          {capsule.title}
        </h3>
        <p className="text-sm text-gray-300 line-clamp-2 mb-4 h-10">
          {capsule.description}
        </p>

        {/* Emotions */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {capsule.emotions.slice(0, 3).map((emotion) => (
            <span 
              key={emotion}
              className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm bg-primary/10 text-primary border border-primary/20"
            >
              {emotion}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-primary transition-colors">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {capsule.favorites.length} memories locked
          </div>
          <Unlock className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
