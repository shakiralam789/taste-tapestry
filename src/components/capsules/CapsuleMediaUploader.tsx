"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, ImageIcon, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CapsuleMediaUploaderProps {
  images: string[];
  videos: string[];
  /** Current cover image URL for the capsule, if any */
  coverUrl?: string | null;
  onChange: (next: { images: string[]; videos: string[] }) => void;
  /** Called when user selects an image to be the cover */
  onCoverChange?: (url: string) => void;
}

export function CapsuleMediaUploader({
  images,
  videos,
  coverUrl,
  onChange,
  onCoverChange,
}: CapsuleMediaUploaderProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const handleImageFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      const newUrls = files
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => URL.createObjectURL(file));
      if (newUrls.length) {
        onChange({ images: [...images, ...newUrls], videos });
      }
      e.target.value = "";
    },
    [images, videos, onChange],
  );

  const handleVideoFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      const newUrls = files
        .filter((file) => file.type.startsWith("video/"))
        .map((file) => URL.createObjectURL(file));
      if (newUrls.length) {
        onChange({ images, videos: [...videos, ...newUrls] });
      }
      e.target.value = "";
    },
    [images, videos, onChange],
  );

  const addImageUrl = () => {
    if (!imageUrl.trim()) return;
    onChange({ images: [...images, imageUrl.trim()], videos });
    setImageUrl("");
  };

  const addVideoUrl = () => {
    if (!videoUrl.trim()) return;
    onChange({ images, videos: [...videos, videoUrl.trim()] });
    setVideoUrl("");
  };

  const removeImage = (url: string) => {
    onChange({ images: images.filter((img) => img !== url), videos });
  };

  const removeVideo = (url: string) => {
    onChange({ images, videos: videos.filter((vid) => vid !== url) });
  };

  return (
    <div className="elevated-card space-y-6">
      <div>
        <Label className="text-base font-medium mb-1 block">
          Photos & video for this chapter
        </Label>
        <p className="text-xs text-muted-foreground">
          Add visuals that capture this phase — screenshots, photos, or short
          clips. You can pick any image here to be the capsule cover.
        </p>
      </div>

      {/* Images */}
      <div className="space-y-3">
        <Label className="text-xs font-medium flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          Images
        </Label>
        <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageFiles}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => imageInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Upload images
            </Button>
            <span className="text-xs text-muted-foreground">or paste URL</span>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImageUrl();
                }
              }}
              placeholder="https://…"
              className="max-w-xs h-8 text-xs"
            />
            <Button type="button" size="sm" variant="outline" onClick={addImageUrl}>
              Add
            </Button>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {images.map((src, idx) => {
                const isCover = coverUrl === src;
                return (
                  <div
                    key={`${idx}-${src}`}
                    className="relative rounded-lg overflow-hidden border border-white/10 group"
                  >
                    <button
                      type="button"
                      onClick={() => onCoverChange?.(src)}
                      className="block w-full h-full"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-20 object-cover group-hover:opacity-90"
                      />
                    </button>
                    <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 text-[9px]">
                      <span
                        className={`px-1.5 py-0.5 rounded-full ${
                          isCover
                            ? "bg-primary text-primary-foreground"
                            : "bg-black/60 text-white/80"
                        }`}
                      >
                        {isCover ? "Cover" : "Set as cover"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImage(src)}
                        className="px-1.5 py-0.5 rounded-full bg-black/60 text-white/80 hover:bg-black/80"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Videos */}
      <div className="space-y-3">
        <Label className="text-xs font-medium flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          Videos
        </Label>
        <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={handleVideoFiles}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => videoInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Upload videos
            </Button>
            <span className="text-xs text-muted-foreground">or paste URL</span>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addVideoUrl();
                }
              }}
              placeholder="https://…"
              className="max-w-xs h-8 text-xs"
            />
            <Button type="button" size="sm" variant="outline" onClick={addVideoUrl}>
              Add
            </Button>
          </div>

          {videos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {videos.map((src, idx) => {
                const isCover = coverUrl === src;
                return (
                  <div
                    key={`${idx}-${src}`}
                    className="relative group rounded-lg overflow-hidden border border-white/10 h-20 flex items-center justify-center bg-black/40"
                  >
                    <button
                      type="button"
                      onClick={() => onCoverChange?.(src)}
                      className="flex-1 h-full flex items-center justify-center"
                    >
                      <Film className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                    <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 text-[9px] px-1">
                      <span
                        className={`px-1.5 py-0.5 rounded-full ${
                          isCover
                            ? "bg-primary text-primary-foreground"
                            : "bg-black/60 text-white/80"
                        }`}
                      >
                        {isCover ? "Cover" : "Set as cover"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVideo(src)}
                        className="px-1.5 py-0.5 rounded-full bg-black/60 text-white/80 hover:bg-black/80"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

