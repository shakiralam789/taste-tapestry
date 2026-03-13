"use client";

import { useState } from "react";
import type { Quirk } from "@/types/wishbook";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface QuirkCardProps {
  quirk: Quirk;
}

export function QuirkCard({ quirk }: QuirkCardProps) {
  const [open, setOpen] = useState(false);

  const preview =
    quirk.story && quirk.story.length > 120
      ? `${quirk.story.slice(0, 117)}…`
      : quirk.story ?? "A little story lives here.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative w-full text-left rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-primary/10 px-4 py-4 sm:px-5 sm:py-5 backdrop-blur-xl shadow-lg hover:border-primary/30 hover:shadow-primary/20 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-2xl shrink-0">
              <span>{quirk.emoji || "✨"}</span>
            </div>
            <div className="space-y-1">
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
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                {preview}
              </p>
              <div className="flex gap-2 pt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Tap to read story
                </span>
              </div>
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-xl bg-gradient-to-b from-background via-background/95 to-background border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-2xl">
              {quirk.emoji || "✨"}
            </span>
            <span className="font-display text-xl sm:text-2xl">
              {quirk.title}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            A tiny, low-pressure corner for the silly, tender, and quietly
            impressive things you do when the stakes are low.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {quirk.story && (
            <p className="whitespace-pre-wrap rounded-2xl bg-white/5 px-4 py-3 text-sm leading-relaxed text-foreground">
              {quirk.story}
            </p>
          )}

          {(quirk.media?.images?.length ||
            quirk.media?.videos?.length ||
            quirk.bloopers?.images?.length ||
            quirk.bloopers?.videos?.length) && (
            <div className="space-y-3">
              {quirk.media && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Little visuals
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {quirk.media.images?.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="h-28 w-full rounded-xl object-cover border border-white/10 bg-black/30"
                      />
                    ))}
                    {quirk.media.videos?.map((url) => (
                      <video
                        key={url}
                        src={url}
                        className="h-28 w-full rounded-xl object-cover border border-white/10 bg-black/30"
                        controls
                      />
                    ))}
                  </div>
                </div>
              )}

              {quirk.bloopers && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    The mess-up (bloopers)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {quirk.bloopers.images?.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="h-28 w-full rounded-xl object-cover border border-white/10 bg-black/30"
                      />
                    ))}
                    {quirk.bloopers.videos?.map((url) => (
                      <video
                        key={url}
                        src={url}
                        className="h-28 w-full rounded-xl object-cover border border-white/10 bg-black/30"
                        controls
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full text-xs"
            >
              Me too
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full text-xs"
            >
              Teach me
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

