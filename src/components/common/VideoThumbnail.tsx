import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface VideoThumbnailProps {
  src: string;
  className?: string;
}

export function VideoThumbnail({ src, className }: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const handleLoadedMetadata = () => {
      try {
        const duration = video.duration;
        let targetTime = 1;

        if (Number.isFinite(duration) && duration > 0) {
          if (duration <= 1.2) {
            targetTime = Math.max(duration * 0.5, 0.1);
          } else {
            targetTime = 1;
          }
        }

        video.currentTime = targetTime;
      } catch {
        // Ignore seeking errors
      }
    };

    const handleSeeked = () => {
      if (cancelled) return;
      // Pause on the target frame so it acts like a thumbnail
      video.pause();
      setReady(true);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [src]);

  return (
    <div className={cn("relative aspect-video w-full bg-black/70 overflow-hidden", className)}>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
          Loading…
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        muted
        playsInline
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          ready ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

