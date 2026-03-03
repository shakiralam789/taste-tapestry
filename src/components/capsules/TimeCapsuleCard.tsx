import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TimeCapsule } from "@/types/wishbook";
import {
  Calendar,
  Lock,
  Film,
  MoreHorizontal,
  Heart,
  ArrowRight,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleCapsuleLove } from "@/features/capsules/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TimeCapsuleCardProps {
  capsule: TimeCapsule;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onToggleVisibility?: (visibility: "public" | "private") => void;
  onDelete?: () => void;
  authorName?: string;
  authorSubtitle?: string;
  authorAvatar?: string | null;
}

export function TimeCapsuleCard({
  capsule,
  onClick,
  showActions,
  onEdit,
  onToggleVisibility,
  onDelete,
  authorName,
  authorSubtitle,
  authorAvatar,
}: TimeCapsuleCardProps) {
  const visibility = capsule.visibility ?? "public";
  const unlockLabel =
    visibility === "future" && capsule.unlockAt
      ? `Opens ${capsule.unlockAt.toLocaleDateString()}`
      : "Future";

  const rawCover = capsule.image || capsule.images?.[0] || capsule.videos?.[0];
  const coverUrl =
    rawCover && rawCover.startsWith("blob:") ? undefined : rawCover;
  const isVideoCover = !!coverUrl && (capsule.videos ?? []).includes(coverUrl);

  const queryClient = useQueryClient();
  const [loved, setLoved] = useState(capsule.lovedByMe ?? false);
  const [loveCount, setLoveCount] = useState(capsule.loveCount ?? 0);

  const displayAuthorName = authorName ?? "Time capsule";
  const displayAuthorSubtitle =
    authorSubtitle ?? `Chapter from ${capsule.period || "a moment"}`;

  useEffect(() => {
    setLoved(capsule.lovedByMe ?? false);
    setLoveCount(capsule.loveCount ?? 0);
  }, [capsule.lovedByMe, capsule.loveCount]);

  const loveMutation = useMutation({
    mutationFn: () => toggleCapsuleLove(capsule.id),
    onMutate: () => {
      setLoved((prev) => !prev);
      setLoveCount((prev) => (loved ? Math.max(prev - 1, 0) : prev + 1));
    },
    onSuccess: ({ loved, count }) => {
      setLoved(loved);
      setLoveCount(count);
      queryClient.setQueriesData<TimeCapsule | undefined>(
        { queryKey: ["capsule", capsule.id] },
        (old) =>
          old
            ? {
                ...old,
                lovedByMe: loved,
                loveCount: count,
              }
            : old,
      );
      queryClient.setQueriesData<TimeCapsule[] | undefined>(
        { queryKey: ["capsules"] },
        (old) =>
          old
            ? old.map((c) =>
                c.id === capsule.id
                  ? { ...c, lovedByMe: loved, loveCount: count }
                  : c,
              )
            : old,
      );
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 mb-4 hover:border-primary/20 transition-colors"
    >
      {/* Header - like FavoriteCard */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
            <AvatarImage src={authorAvatar ?? undefined} />
            <AvatarFallback>{displayAuthorName[0] ?? "T"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">
                {displayAuthorName}
              </span>
              <span className="text-muted-foreground text-xs">
                • {capsule.period || "A moment in time"}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {displayAuthorSubtitle}
            </span>
          </div>
        </div>
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-white/5 focus:outline-none"
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
                  {visibility === "public" ? "Make private" : "Make public"}
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

      {/* Meta row */}
      <div className="flex items-center gap-2 mb-2 text-[11px] text-muted-foreground">
        {visibility !== "public" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            <Lock className="w-3 h-3" />
            <span>{visibility === "private" ? "Private" : unlockLabel}</span>
          </span>
        )}
      </div>

      {/* Body text */}
      <div className="">
        <h3 className="text-lg font-display font-semibold mb-2">
          {capsule.title}
        </h3>
        {capsule.description && (
          <p className="text-sm md:text-base text-foreground/90 mb-3 whitespace-pre-wrap leading-relaxed">
            {capsule.description}
          </p>
        )}

        {/* Media */}
        {coverUrl && (
          <div className="rounded-xl overflow-hidden mb-3 border border-white/5 bg-black/80 flex items-center justify-center cursor-pointer">
            {coverUrl ? (
              isVideoCover ? (
                <video
                  src={coverUrl}
                  className="max-h-[420px] w-full object-contain"
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={coverUrl}
                  alt={capsule.title}
                  className="max-h-[420px] w-full object-contain"
                />
              )
            ) : null}
          </div>
        )}

        {/* Emotions as hashtags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {capsule.emotions.slice(0, 3).map((emotion) => (
            <span
              key={emotion}
              className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              #{emotion}
            </span>
          ))}
        </div>

        {/* Action Bar */}
        <div
          className="cursor-default flex items-center justify-between mt-2 pt-2 border-t border-white/5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10 px-2 rounded-full group"
            onClick={(e) => {
              e.stopPropagation();
              loveMutation.mutate();
            }}
          >
            <Heart
              className={`w-4 h-4 group-hover:scale-110 transition-transform ${loved ? "fill-red-500 text-red-500" : ""}`}
            />
            <span>{loveCount}</span>
          </button>
          <div
            onClick={onClick}
            className="capitalize text-primary/60 inline-flex items-center gap-1.5 text-xs hover:text-primary cursor-pointer"
          >
            show details
            <ArrowRight className="w-4 h-4" />

          </div>
        </div>
      </div>
    </motion.div>
  );
}
