"use client";

import { useState, useEffect, useRef } from "react";
import { SmilePlus, Lock, Globe2, Play, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/common/VideoPlayer";
import { toast } from "sonner";
import type { Quirk, QuirkMedia } from "@/types/wishbook";
import { createQuirk, updateQuirk, uploadQuirkMedia } from "@/features/quirks/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type PreviewMedia = { type: "image"; url: string } | { type: "video"; url: string };

interface QuirkEditorProps {
  /** When set, editor runs in edit mode and submits via updateQuirk */
  quirk?: Quirk | null;
  onCreated?: (quirk: Quirk) => void;
  onUpdated?: (quirk: Quirk) => void;
  /** In edit mode, called when user cancels without saving */
  onCancel?: () => void;
}

export function QuirkEditor({ quirk, onCreated, onUpdated, onCancel }: QuirkEditorProps) {
  const isEdit = !!quirk?.id;
  const [title, setTitle] = useState(quirk?.title ?? "");
  const [story, setStory] = useState(quirk?.story ?? "");
  const [isPublic, setIsPublic] = useState(quirk?.isPublic ?? true);
  const [media, setMedia] = useState<QuirkMedia>(quirk?.media ?? {});
  const [uploadingMain, setUploadingMain] = useState(false);
  const [preview, setPreview] = useState<PreviewMedia | null>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quirk) {
      setTitle(quirk.title ?? "");
      setStory(quirk.story ?? "");
      setIsPublic(quirk.isPublic ?? true);
      setMedia(quirk.media ?? {});
    }
  }, [quirk?.id, quirk?.title, quirk?.story, quirk?.isPublic, quirk?.media]);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createQuirk,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["quirks", "me"] });
      onCreated?.(result);
      setTitle("");
      setStory("");
      setMedia({});
      setIsPublic(true);
      toast.success("Quirk added to your tapestry", {
        description: "Thanks for sharing a tiny piece of your weird, lovely self.",
      });
    },
    onError: () => {
      toast.error("Could not save quirk. Please try again.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateQuirk>[1] }) =>
      updateQuirk(id, payload),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["quirks", "me"] });
      onUpdated?.(result);
      toast.success("Quirk updated");
    },
    onError: () => {
      toast.error("Could not update quirk. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Give your quirk a tiny title");
      return;
    }
    if (isEdit && quirk) {
      updateMutation.mutate({
        id: quirk.id,
        payload: {
          title: title.trim(),
          story: story.trim() || undefined,
          media: Object.keys(media).length ? media : undefined,
          isPublic,
        },
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        story: story.trim() || undefined,
        media: Object.keys(media).length ? media : undefined,
        isPublic,
      });
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingMain(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        try {
          const url = await uploadQuirkMedia(file);
          urls.push(url);
        } catch {
          toast.error("Failed to upload one of the files");
        }
      }
      if (!urls.length) return;

      const next: QuirkMedia = { images: [], videos: [] };
      next.images = [...(media.images ?? [])];
      next.videos = [...(media.videos ?? [])];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const mime = files[i]?.type ?? "";
        if (mime.startsWith("video/")) {
          next.videos?.push(url);
        } else {
          next.images?.push(url);
        }
      }

      setMedia(next);
    } finally {
      setUploadingMain(false);
    }
  };

  const removeImage = (url: string) => {
    setMedia((prev) => ({
      ...prev,
      images: (prev.images ?? []).filter((u) => u !== url),
    }));
  };

  const removeVideo = (url: string) => {
    setMedia((prev) => ({
      ...prev,
      videos: (prev.videos ?? []).filter((u) => u !== url),
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-1">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="quirk-title">Title</Label>
            <Input
              id="quirk-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`"Can open jars with one pinky"`}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quirk-story">Tiny origin story</Label>
            <Textarea
              id="quirk-story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={4}
              placeholder={
                "What’s the story behind this quirk?\nMaybe a childhood dare, a bored summer, or a happy accident."
              }
            />
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <SmilePlus className="h-3 w-3" />
              Honest and a bit silly is perfect — one or two sentences are enough.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Photos & clips — modern upload zone */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Photos & clips
          </Label>
          <div
            role="button"
            tabIndex={0}
            onClick={() => mainInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && mainInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-primary/40", "bg-white/[0.06]"); }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-primary/40", "bg-white/[0.06]"); }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-primary/40", "bg-white/[0.06]");
              handleUpload(e.dataTransfer.files);
            }}
            className="relative flex min-h-[120px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-card/50 px-4 py-6 transition-colors hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <input
              ref={mainInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="sr-only"
              onChange={(e) => handleUpload(e.target.files)}
            />
            {uploadingMain ? (
              <p className="text-sm text-muted-foreground">Uploading…</p>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                  <ImagePlus className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground">Drop or click to add</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Photos or short clips</p>
              </>
            )}
          </div>
          {(media.images?.length || media.videos?.length) ? (
            <div className="flex flex-wrap gap-2">
              {(media.images ?? []).map((url) => (
                <div key={url} className="relative group/thumb h-16 w-20 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreview({ type: "image", url })}
                    className="h-full w-full block focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(url); }}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200 hover:bg-destructive focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {(media.videos ?? []).map((url) => (
                <div key={url} className="relative group/thumb h-16 w-20 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreview({ type: "video", url })}
                    className="h-full w-full block focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl"
                  >
                    <video src={url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                      <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeVideo(url); }}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200 hover:bg-destructive focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Remove video"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-2xl rounded-3xl border border-white/10 bg-background/95 p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {preview?.type === "image" ? "Image preview" : "Video preview"}
          </DialogTitle>
          {preview?.type === "image" && (
            <img
              src={preview.url}
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-black/30 px-3 py-2 border border-white/10">
          <Switch
            id="quirk-visibility"
            checked={isPublic}
            onCheckedChange={(v) => setIsPublic(Boolean(v))}
          />
          <div className="space-y-0.5">
            <Label
              htmlFor="quirk-visibility"
              className="flex items-center gap-1 text-xs font-medium"
            >
              {isPublic ? (
                <>
                  <Globe2 className="h-3.5 w-3.5 text-primary" />
                  Visible on your profile
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Just for you
                </>
              )}
            </Label>
            <p className="text-[10px] text-muted-foreground">
              You can always turn this on or off later.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full px-5"
              onClick={onCancel}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="rounded-full px-5"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving…"
              : isEdit
                ? "Update quirk"
                : "Add to my quirks"}
          </Button>
        </div>
      </div>
    </form>
  );
}

