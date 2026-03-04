"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, ImageIcon, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadCapsuleMedia } from "@/features/capsules/api";
import { toast } from "sonner";

interface CapsuleMediaUploaderProps {
  images: string[];
  videos: string[];
  /** Current poster image URL for the capsule, if any */
  coverUrl?: string | null;
  /** Current banner image URL for the capsule, if any */
  bannerUrl?: string | null;
  onChange: (next: { images: string[]; videos: string[] }) => void;
  /** Called when user selects media to be the poster */
  onCoverChange?: (url: string) => void;
  /** Called when user selects media to be the banner */
  onBannerChange?: (url: string) => void;
}

export function CapsuleMediaUploader({
  images,
  videos,
  coverUrl,
  bannerUrl,
  onChange,
  onCoverChange,
  onBannerChange,
}: CapsuleMediaUploaderProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleImageFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (!files.length) return;
      setUploading(true);
      try {
        const uploaded: string[] = [];
        for (const file of files) {
          try {
            const url = await uploadCapsuleMedia(file);
            uploaded.push(url);
          } catch {
            toast.error("Failed to upload image");
          }
        }
        if (uploaded.length) {
          onChange({ images: [...images, ...uploaded], videos });
        }
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [images, videos, onChange],
  );

  const handleVideoFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((file) =>
        file.type.startsWith("video/"),
      );
      if (!files.length) return;
      setUploading(true);
      try {
        const uploaded: string[] = [];
        for (const file of files) {
          try {
            const url = await uploadCapsuleMedia(file);
            uploaded.push(url);
          } catch {
            toast.error("Failed to upload video");
          }
        }
        if (uploaded.length) {
          onChange({ images, videos: [...videos, ...uploaded] });
        }
      } finally {
        setUploading(false);
        e.target.value = "";
      }
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
          clips. You can pick any media here to be the capsule poster and banner.
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
            {uploading && (
              <span className="text-[10px] text-muted-foreground">
                Uploading…
              </span>
            )}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {images.map((src, idx) => {
                const isPoster = coverUrl === src;
                const isBanner = bannerUrl === src;
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
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onCoverChange?.(src)}
                          className={`px-1.5 py-0.5 rounded-full ${
                            isPoster
                              ? "bg-primary text-primary-foreground"
                              : "bg-black/60 text-white/80 hover:bg-black/80"
                          }`}
                        >
                          {isPoster ? "Poster" : "Set poster"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onBannerChange?.(src)}
                          className={`px-1.5 py-0.5 rounded-full ${
                            isBanner
                              ? "bg-primary/80 text-primary-foreground"
                              : "bg-black/60 text-white/80 hover:bg-black/80"
                          }`}
                        >
                          {isBanner ? "Banner" : "Set banner"}
                        </button>
                      </div>
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
            {uploading && (
              <span className="text-[10px] text-muted-foreground">
                Uploading…
              </span>
            )}
          </div>

          {videos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {videos.map((src, idx) => {
                const isPoster = coverUrl === src;
                const isBanner = bannerUrl === src;
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
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onCoverChange?.(src)}
                          className={`px-1.5 py-0.5 rounded-full ${
                            isPoster
                              ? "bg-primary text-primary-foreground"
                              : "bg-black/60 text-white/80 hover:bg-black/80"
                          }`}
                        >
                          {isPoster ? "Poster" : "Set poster"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onBannerChange?.(src)}
                          className={`px-1.5 py-0.5 rounded-full ${
                            isBanner
                              ? "bg-primary/80 text-primary-foreground"
                              : "bg-black/60 text-white/80 hover:bg-black/80"
                          }`}
                        >
                          {isBanner ? "Banner" : "Set banner"}
                        </button>
                      </div>
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

