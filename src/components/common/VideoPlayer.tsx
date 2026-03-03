import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  containerClassName?: string;
  videoClassName?: string;
  autoPlayInView?: boolean;
  loop?: boolean;
  mutedByDefault?: boolean;
}

export function VideoPlayer({
  src,
  containerClassName,
  videoClassName,
  autoPlayInView = true,
  loop = true,
  mutedByDefault = true,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(mutedByDefault);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(mutedByDefault ? 0 : 1);
  const [lastNonZeroVolume, setLastNonZeroVolume] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredRecently, setHoveredRecently] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const showControls = !isPlaying || isHovered || hoveredRecently;

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement || null;
      const container = containerRef.current;
      setIsFullscreen(!!container && fsElement === container);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    (document as Document & {
      webkitFullscreenChange?: (this: Document, ev: Event) => unknown;
      addEventListener(
        type: "webkitfullscreenchange",
        listener: (this: Document, ev: Event) => unknown,
      ): void;
    }).addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      (document as Document & {
        removeEventListener(
          type: "webkitfullscreenchange",
          listener: (this: Document, ev: Event) => unknown,
        ): void;
      }).removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video || !autoPlayInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          void video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Autoplay might be blocked – ignore safely
            });
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      {
        threshold: 0.6,
      },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [autoPlayInView]);

  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Ignore play error
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleToggleMute = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const video = videoRef.current;
      if (!video) return;
      const nextMuted = !video.muted;
      video.muted = nextMuted;
      if (nextMuted) {
        setLastNonZeroVolume(video.volume || 1);
        video.volume = 0;
        setVolume(0);
      } else {
        const v = lastNonZeroVolume || 1;
        video.volume = v;
        setVolume(v);
      }
      setIsMuted(nextMuted);
    },
    [lastNonZeroVolume],
  );

  const handleTimeChange = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video || Number.isNaN(value)) return;
    video.currentTime = value;
    setCurrentTime(value);
  }, []);

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const next = Math.min(
        Math.max(video.currentTime + deltaSeconds, 0),
        duration,
      );
      video.currentTime = next;
      setCurrentTime(next);
    },
    [duration],
  );

  const handleVolumeChange = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const normalized = Math.min(Math.max(value, 0), 1);
    video.volume = normalized;
    setVolume(normalized);
    if (normalized === 0) {
      video.muted = true;
      setIsMuted(true);
    } else {
      video.muted = false;
      setIsMuted(false);
      setLastNonZeroVolume(normalized);
    }
  }, []);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleToggleFullscreen = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const container = containerRef.current;
      if (!container) return;

      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        webkitExitFullscreen?: () => Promise<void>;
      };
      const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement || null;

      if (!fsElement) {
        const el = container as HTMLDivElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        };
        const request = el.requestFullscreen || el.webkitRequestFullscreen;
        if (request) void request.call(container);
      } else {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
        if (exit) void exit.call(doc);
      }
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full cursor-pointer group bg-black",
        containerClassName,
      )}
      onClick={(e) => {
        e.stopPropagation();
        handleTogglePlay();
      }}
      onMouseEnter={() => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        setIsHovered(true);
        setHoveredRecently(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
          setHoveredRecently(false);
        }, 3000);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className={cn(
          "w-full h-full object-contain",
          isFullscreen ? "max-h-none" : videoClassName,
        )}
        muted={isMuted}
        playsInline
        loop={loop}
        preload="metadata"
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (!video) return;
          setDuration(video.duration || 0);
          setCurrentTime(video.currentTime || 0);
          if (mutedByDefault) {
            video.muted = true;
            video.volume = 0;
            setVolume(0);
            setIsMuted(true);
          } else {
            video.muted = false;
            video.volume = volume || 1;
            setIsMuted(false);
          }
        }}
        onTimeUpdate={() => {
          const video = videoRef.current;
          if (!video) return;
          setCurrentTime(video.currentTime || 0);
        }}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity",
          showControls ? "opacity-100" : "opacity-0 md:group-hover:opacity-100",
        )}
      />

      {/* Center play indicator */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition-opacity",
            isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100",
          )}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 pl-0.5" />
          )}
        </div>
      </div>

      {/* Bottom control panel */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-2 px-2">
        <div
          className={cn(
            "pointer-events-auto rounded-xl bg-black/70 backdrop-blur-sm px-3 py-2 flex flex-col gap-1 border border-white/10 transform transition-all duration-200",
            showControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={() => handleTogglePlay()}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 pl-[1px]" />
              )}
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-7 w-9 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/15 transition-colors text-[11px]"
                onClick={() => seekBy(-5)}
              >
                <SkipBack className="w-3 h-3 mr-0.5" />
                5
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-9 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/15 transition-colors text-[11px]"
                onClick={() => seekBy(5)}
              >
                5
                <SkipForward className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={handleToggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(volume * 100)}
                onChange={(e) =>
                  handleVolumeChange(Number.parseInt(e.target.value, 10) / 100)
                }
                className="h-1.5 w-20 cursor-pointer accent-primary bg-white/20 rounded-full"
              />
              <button
                type="button"
                className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={handleToggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] tabular-nums text-white/80 min-w-[3ch]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={duration ? currentTime : 0}
              onChange={(e) => handleTimeChange(Number.parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-primary bg-white/25 rounded-full"
            />
            <span className="text-[11px] tabular-nums text-white/60 min-w-[3ch] text-right">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

