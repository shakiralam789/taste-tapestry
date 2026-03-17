"use client";

import { useState } from "react";
import type { Quirk } from "@/types/wishbook";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuirkEditor } from "@/components/profile/QuirkEditor";
import { deleteQuirk } from "@/features/quirks/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn, getOptimizedUrl } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Play, Pencil, Trash2 } from "lucide-react";
import { VideoPlayer } from "@/components/common/VideoPlayer";

interface QuirkCardProps {
  quirk: Quirk;
}

type PreviewMedia = { type: "image"; url: string } | { type: "video"; url: string };

export function QuirkCard({ quirk }: QuirkCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = !!user?.id && user.id === quirk.userId;
  const [preview, setPreview] = useState<PreviewMedia | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showFullStory, setShowFullStory] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuirk(quirk.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["quirks", "me"] });
      setDeleteConfirmOpen(false);
      toast.success("Quirk removed");
    },
    onError: () => {
      toast.error("Could not delete quirk. Please try again.");
    },
  });

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
  };

  const storyText = quirk.story ?? "A little story lives here.";
  const isLongStory = storyText.length > 160;

  const hasMedia =
    (quirk.media?.images?.length ?? 0) > 0 ||
    (quirk.media?.videos?.length ?? 0) > 0 ||
    (quirk.bloopers?.images?.length ?? 0) > 0 ||
    (quirk.bloopers?.videos?.length ?? 0) > 0;

  return (
    <>
      <div className="group relative w-full text-left rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-primary/10 px-4 py-4 sm:px-5 sm:py-5 backdrop-blur-xl shadow-lg hover:border-primary/30 transition-all">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-2xl shrink-0">
              <span>{quirk.emoji || "✨"}</span>
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-base sm:text-lg font-semibold">
                    {quirk.title}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-white/20 bg-white/5 text-[10px] uppercase tracking-wide"
                  >
                    {quirk.isPublic ? "On your tapestry" : "Just for you"}
                  </Badge>
                </div>
                {quirk.createdAt && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(quirk.createdAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p
                  className={cn(
                    "text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap",
                    isLongStory && !showFullStory && "line-clamp-2"
                  )}
                >
                  {storyText}
                </p>
                {isLongStory && (
                  <button
                    type="button"
                    onClick={() => setShowFullStory((v) => !v)}
                    className="text-[11px] font-medium text-primary hover:text-primary/80 focus:outline-none"
                  >
                    {showFullStory ? "See less" : "See more"}
                  </button>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditOpen(true);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Edit quirk"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmOpen(true);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  aria-label="Delete quirk"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {hasMedia && (
            <div className="ml-12 flex gap-2 overflow-x-auto pt-1">
              {quirk.media?.images?.map((url) => (
                <button
                  key={`thumb-main-img-${url}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview({ type: "image", url });
                  }}
                  className="h-16 w-20 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <img
                    src={getOptimizedUrl(url, 300) ?? url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
              {quirk.media?.videos?.map((url) => (
                <button
                  key={`thumb-main-vid-${url}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview({ type: "video", url });
                  }}
                  className="relative h-16 w-20 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <video
                    src={url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                </button>
              ))}
              {quirk.bloopers?.images?.map((url) => (
                <button
                  key={`thumb-bloop-img-${url}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview({ type: "image", url });
                  }}
                  className="h-16 w-20 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <img
                    src={getOptimizedUrl(url, 300) ?? url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
              {quirk.bloopers?.videos?.map((url) => (
                <button
                  key={`thumb-bloop-vid-${url}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview({ type: "video", url });
                  }}
                  className="relative h-16 w-20 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <video
                    src={url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image / video preview dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-2xl rounded-3xl border border-white/10 bg-background/95 p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {preview?.type === "image" ? "Image preview" : "Video preview"}
          </DialogTitle>
          {preview?.type === "image" && (
            <img
              src={getOptimizedUrl(preview.url, 2048) ?? preview.url}
              alt=""
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
            />
          )}
          {preview?.type === "video" && preview.url && (
            <div className="w-full rounded-2xl overflow-hidden bg-black">
              <VideoPlayer
                src={preview.url}
                containerClassName="w-full aspect-video"
                videoClassName="w-full h-full object-contain"
                autoPlayInView={false}
                loop={false}
                mutedByDefault={false}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit quirk dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl bg-gradient-to-b from-background via-background/95 to-background border border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl sm:text-2xl flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit quirk
            </DialogTitle>
          </DialogHeader>
          <QuirkEditor
            quirk={quirk}
            onUpdated={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm rounded-2xl border border-white/10 bg-background/95">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Remove quirk?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This will permanently remove &quot;{quirk.title}&quot;. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-full"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
