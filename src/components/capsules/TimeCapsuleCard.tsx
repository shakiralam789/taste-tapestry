import { hover, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { TimeCapsule } from "@/types/wishbook";
import {
  Calendar,
  Lock,
  Film,
  MoreHorizontal,
  Heart,
  MessageCircle,
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
import { cn, getOptimizedUrl } from "@/lib/utils";
import { useNotifications } from "@/features/notifications/NotificationsContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoPlayer } from "@/components/common/VideoPlayer";
import { CommentSection } from "@/components/comments/CommentSection";
import { Wrapper } from "./Wrapper";

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
  authorID?: string | null | undefined;
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
  authorID,
}: TimeCapsuleCardProps) {
  const visibility = capsule.visibility ?? "public";
  const unlockLabel =
    visibility === "future" && capsule.unlockAt
      ? `Opens ${capsule.unlockAt.toLocaleDateString()}`
      : "Future";

  const rawCover = capsule.image || capsule.images?.[0] || capsule.videos?.[0];
  const coverUrlStr = typeof rawCover === 'string' ? rawCover : (rawCover as any)?.original_url;
  const coverUrl =
    coverUrlStr && coverUrlStr.startsWith("blob:") ? undefined : coverUrlStr;
  const isVideoCover = !!coverUrl && (capsule.videos ?? []).includes(coverUrl);

  const queryClient = useQueryClient();
  const [loved, setLoved] = useState(capsule.lovedByMe ?? false);
  const [loveCount, setLoveCount] = useState(capsule.loveCount ?? 0);
  const [commentCount, setCommentCount] = useState(capsule.commentCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const { joinCapsule, leaveCapsule } = useNotifications();

  const displayAuthorName = authorName ?? "Time capsule";
  const displayAuthorSubtitle =
    authorSubtitle ?? `Chapter from ${capsule.period || "a moment"}`;

  useEffect(() => {
    setLoved(capsule.lovedByMe ?? false);
    setLoveCount(capsule.loveCount ?? 0);
    setCommentCount(capsule.commentCount ?? 0);
  }, [capsule.lovedByMe, capsule.loveCount, capsule.commentCount]);

  useEffect(() => {
    joinCapsule(capsule.id);
    return () => leaveCapsule(capsule.id);
  }, [capsule.id, joinCapsule, leaveCapsule]);

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
        <Wrapper
          authorID={authorID}
          className="flex items-center gap-3 group">
          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
            <AvatarImage src={authorAvatar ?? undefined} />
            <AvatarFallback>{displayAuthorName[0] ?? "T"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className={`capitalize font-bold text-foreground ${authorID ? "group-hover:text-primary" : ""}`}>
                {displayAuthorName}
              </span>
              {capsule.createdAt && (
                <span className="text-muted-foreground text-xs font-normal">
                  • {formatDistanceToNow(new Date(capsule.createdAt))} ago
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {displayAuthorSubtitle}
            </span>
          </div>
        </Wrapper>
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
          <div className="relative rounded-xl overflow-hidden mb-3 border border-white/5 bg-black/80 flex items-center justify-center">
            {isVideoCover ? (
              <VideoPlayer
                src={coverUrl}
                videoClassName="max-h-[420px] w-full object-contain"
              />
            ) : (

              <>
                <img
                  src={getOptimizedUrl(coverUrl, 800)}
                  alt={capsule.title}
                  className="max-h-[420px] w-full object-contain z-10"
                />
                <img
                  src={getOptimizedUrl(coverUrl, 800)}
                  alt={capsule.title}
                  className="absolute inset-0 w-full h-full object-cover z-0 blur-2xl opacity-30"
                />
              </>
            )}
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
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary hover:bg-secondary/10 px-2 rounded-full group"
            onClick={(e) => {
              e.stopPropagation();
              loveMutation.mutate();
            }}
          >
            <Heart
              className={`w-4 h-4 group-hover:scale-110 transition-transform ${loved ? "fill-secondary text-secondary" : ""}`}
            />
            <span>{loveCount}</span>
          </button>

          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 px-2 py-1 rounded-full group transition-colors",
              showComments && "text-primary bg-primary/10"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
          >
            <MessageCircle className={cn("w-4 h-4 group-hover:scale-110 transition-transform", showComments && "fill-current")} />
            <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
          </button>

          <div
            onClick={onClick}
            className="capitalize text-primary/60 inline-flex items-center gap-1.5 text-xs hover:text-primary cursor-pointer"
          >
            show details
            <ArrowRight className="w-4 h-4" />

          </div>
        </div>

        {/* Inline Comment Section */}
        {showComments && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <CommentSection capsuleId={capsule.id} isInline />
          </div>
        )}
      </div>
    </motion.div>
  );
}
