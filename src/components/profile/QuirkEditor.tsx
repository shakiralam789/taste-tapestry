"use client";

import { useState } from "react";
import { Sparkles, SmilePlus, UploadCloud, Lock, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Quirk, QuirkMedia } from "@/types/wishbook";
import { createQuirk, uploadQuirkMedia } from "@/features/quirks/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface QuirkEditorProps {
  onCreated?: (quirk: Quirk) => void;
}

export function QuirkEditor({ onCreated }: QuirkEditorProps) {
  const [emoji, setEmoji] = useState("🎉");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [media, setMedia] = useState<QuirkMedia>({});
  const [bloopers, setBloopers] = useState<QuirkMedia>({});
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingBloopers, setUploadingBloopers] = useState(false);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createQuirk,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["quirks", "me"] });
      onCreated?.(result);
      setTitle("");
      setStory("");
      setMedia({});
      setBloopers({});
      setIsPublic(true);
      toast.success("Quirk added to your tapestry", {
        description: "Thanks for sharing a tiny piece of your weird, lovely self.",
      });
    },
    onError: () => {
      toast.error("Could not save quirk. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Give your quirk a tiny title");
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      emoji: emoji.trim() || "✨",
      story: story.trim() || undefined,
      media: Object.keys(media).length ? media : undefined,
      bloopers: Object.keys(bloopers).length ? bloopers : undefined,
      isPublic,
    });
  };

  const handleUpload = async (
    files: FileList | null,
    target: "media" | "bloopers",
  ) => {
    if (!files || files.length === 0) return;
    const isBloopers = target === "bloopers";
    isBloopers ? setUploadingBloopers(true) : setUploadingMain(true);
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
      const current = isBloopers ? bloopers : media;
      next.images = [...(current.images ?? [])];
      next.videos = [...(current.videos ?? [])];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const mime = files[i]?.type ?? "";
        if (mime.startsWith("video/")) {
          next.videos?.push(url);
        } else {
          next.images?.push(url);
        }
      }

      if (isBloopers) {
        setBloopers(next);
      } else {
        setMedia(next);
      }
    } finally {
      isBloopers ? setUploadingBloopers(false) : setUploadingMain(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-[auto,1fr]">
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/40 border border-white/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <Label
            htmlFor="quirk-emoji"
            className="text-[11px] uppercase tracking-wide text-muted-foreground"
          >
            Emoji
          </Label>
          <Input
            id="quirk-emoji"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            className="w-16 text-center text-xl rounded-2xl"
          />
          <p className="text-[10px] text-muted-foreground text-center">
            Pick one that feels like this quirk.
          </p>
        </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-xs font-medium">
            <UploadCloud className="h-4 w-4 text-primary" />
            A little visual (optional)
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Add a photo or tiny clip that matches the vibe.
          </p>
          <Input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => handleUpload(e.target.files, "media")}
          />
          {uploadingMain && (
            <p className="text-[10px] text-muted-foreground">Uploading…</p>
          )}
          {(media.images?.length || media.videos?.length) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {(media.images ?? []).map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-14 w-20 rounded-xl object-cover border border-white/10 bg-black/30"
                />
              ))}
              {(media.videos ?? []).map((url) => (
                <video
                  key={url}
                  src={url}
                  className="h-14 w-20 rounded-xl object-cover border border-white/10 bg-black/30"
                  muted
                  loop
                  playsInline
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-xs font-medium">
            <UploadCloud className="h-4 w-4 text-primary" />
            The mess-up (optional blooper)
          </Label>
          <p className="text-[11px] text-muted-foreground">
            If you have a funny fail clip or photo, this is its cozy corner.
          </p>
          <Input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => handleUpload(e.target.files, "bloopers")}
          />
          {uploadingBloopers && (
            <p className="text-[10px] text-muted-foreground">Uploading…</p>
          )}
          {(bloopers.images?.length || bloopers.videos?.length) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {(bloopers.images ?? []).map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-14 w-20 rounded-xl object-cover border border-white/10 bg-black/30"
                />
              ))}
              {(bloopers.videos ?? []).map((url) => (
                <video
                  key={url}
                  src={url}
                  className="h-14 w-20 rounded-xl object-cover border border-white/10 bg-black/30"
                  muted
                  loop
                  playsInline
                />
              ))}
            </div>
          )}
        </div>
      </div>

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

        <Button
          type="submit"
          size="sm"
          className="rounded-full px-5"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Saving…" : "Add to my quirks"}
        </Button>
      </div>
    </form>
  );
}

