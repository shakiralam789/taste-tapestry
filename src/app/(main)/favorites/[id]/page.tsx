"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { getFavorite, updateFavorite } from "@/features/favorites/api";
import { useAuth } from "@/features/auth/AuthContext";
import type { Favorite, EmotionalSegment } from "@/types/wishbook";
import { EmotionalJourneyView } from "@/components/favorites/EmotionalJourneyView";
import { CATEGORY_EXTRA_FIELDS } from "@/features/favorites/category-fields";
import { getFavoriteCoverImage } from "@/features/favorites/default-covers";
import {
  ArrowLeft,
  Pencil,
  Star,
  Heart,
  Clock,
  Tag,
  Sparkles,
  Music2,
  Trash2,
  Pause,
  Play,
  Volume2,
  SkipBack,
  SkipForward,
  Link2,
  Check,
  X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type FavoriteFields = Favorite["fields"] & {
  releaseYear?: number;
  genre?: string[];
  plotSummary?: string;
  totalDurationSeconds?: number;
  episodeDurations?: number[][];
  episodeSegments?: EmotionalSegment[][];
  seasonEpisodeCounts?: number[];
  emotionalCurve?: { x: number; y: number }[];
  emotionalSegments?: EmotionalSegment[];
  momentPins?: {
    id: string;
    positionPercent: number;
    note: string;
    image?: string;
  }[];
  musicUrl?: string;
};

// ─── URL helpers ─────────────────────────────────────────────────────────────

type UrlType = "youtube" | "spotify" | "audio";

function detectUrlType(url: string): UrlType {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/spotify\.com/.test(url)) return "spotify";
  return "audio";
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1] ?? null;
}

function buildSpotifyEmbedUrl(url: string): string | null {
  const m = url.match(
    /spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/,
  );
  if (!m) return null;
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── YouTube IFrame API type shim ────────────────────────────────────────────

declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayerInstance }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        },
      ) => YTPlayerInstance;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(vol: number): void;
  getDuration(): number;
  getCurrentTime(): number;
  destroy(): void;
}

// ─── Misc helpers ────────────────────────────────────────────────────────────

function hasEmotionalJourney(favorite: Favorite): boolean {
  const f = favorite.fields as FavoriteFields | undefined;
  if (!f) return false;
  const hasMovieSegments =
    (f.emotionalSegments?.length ?? 0) > 0 &&
    favorite.categoryId !== "series" &&
    favorite.categoryId !== "anime";
  const hasSeriesSegments =
    (favorite.categoryId === "series" || favorite.categoryId === "anime") &&
    Array.isArray(f.episodeSegments) &&
    f.episodeSegments.some((arr) => Array.isArray(arr) && arr.length > 0);
  const hasCurve = (f.emotionalCurve?.length ?? 0) >= 2;
  const hasPins = (f.momentPins?.length ?? 0) > 0;
  return !!(hasMovieSegments || hasSeriesSegments || hasCurve || hasPins);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FavoriteShowPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  // ── Link-input state ──────────────────────────────────────────────────────
  const [musicBusy, setMusicBusy] = useState(false);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");

  // ── YouTube player state ──────────────────────────────────────────────────
  const ytInstanceId = useId(); // stable, unique per page
  const ytContainerId = `yt-player-${ytInstanceId.replace(/:/g, "")}`;
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const ytReadyRef = useRef(false);
  const [ytPlaying, setYtPlaying] = useState(false);
  const [ytCurrentTime, setYtCurrentTime] = useState(0);
  const [ytDuration, setYtDuration] = useState(0);
  const [ytSeeking, setYtSeeking] = useState(false); // suppress interval during drag

  // ── Audio fallback state ──────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // ── Volume (shared) ───────────────────────────────────────────────────────
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 1;
    const stored = window.localStorage.getItem("favoriteThemeVolume");
    const parsed = stored != null ? parseFloat(stored) : NaN;
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 1;
  });

  // ── Query ─────────────────────────────────────────────────────────────────
  const {
    data: favorite,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["favorite", id],
    queryFn: async (): Promise<Favorite> =>
      getFavorite(typeof id === "string" ? id : ""),
    enabled: typeof id === "string",
  });

  const fields = (favorite?.fields ?? {}) as FavoriteFields;
  const genreStr =
    Array.isArray(fields.genre) && fields.genre.length > 0
      ? fields.genre.join(" · ")
      : null;
  const showMoodTags =
    (favorite?.mood?.length ?? 0) > 0 ||
    (favorite?.recommendedTime?.length ?? 0) > 0 ||
    (favorite?.tags?.length ?? 0) > 0;
  const showJourney = favorite ? hasEmotionalJourney(favorite) : false;
  const musicUrl = fields.musicUrl;
  const isOwner = favorite ? authUser?.id === favorite.userId : false;
  const showThemeMusicSection = isOwner || !!musicUrl;

  // Derived URL info
  const urlType = musicUrl ? detectUrlType(musicUrl) : null;
  const ytVideoId =
    urlType === "youtube" ? extractYouTubeId(musicUrl!) : null;
  const spotifyEmbedUrl =
    urlType === "spotify" ? buildSpotifyEmbedUrl(musicUrl!) : null;
  const isAudioFallback = urlType === "audio";
  // "playing" for the EQ animation — whichever source is active
  const musicPlaying = urlType === "youtube" ? ytPlaying : audioPlaying;

  // ── YouTube IFrame API — init & teardown ─────────────────────────────────
  const initYouTubePlayer = useCallback(
    (videoId: string) => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
      ytReadyRef.current = false;
      setYtPlaying(false);
      setYtCurrentTime(0);
      setYtDuration(0);

      ytPlayerRef.current = new window.YT.Player(ytContainerId, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          mute: 0,
        },
        events: {
          onReady: (e) => {
            ytReadyRef.current = true;
            setYtDuration(e.target.getDuration());
            e.target.setVolume(volume * 100);
            // Autoplay when player is ready
            e.target.playVideo();
          },
          onStateChange: (e) => {
            const PLAYING = window.YT.PlayerState.PLAYING;
            const isNowPlaying = e.data === PLAYING;
            setYtPlaying(isNowPlaying);
            if (isNowPlaying) {
              setYtDuration(ytPlayerRef.current?.getDuration() ?? 0);
            }
          },
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ytContainerId],
  );

  useEffect(() => {
    if (!ytVideoId) return;

    const load = () => initYouTubePlayer(ytVideoId);

    if (typeof window !== "undefined" && window.YT?.Player) {
      load();
    } else {
      // Queue callback; only inject the script once
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        load();
      };
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }

    return () => {
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
      ytReadyRef.current = false;
      setYtPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytVideoId]);

  // ── YouTube progress interval ─────────────────────────────────────────────
  useEffect(() => {
    if (!ytPlaying || ytSeeking) return;
    const tick = setInterval(() => {
      if (!ytPlayerRef.current) return;
      setYtCurrentTime(ytPlayerRef.current.getCurrentTime());
      setYtDuration(ytPlayerRef.current.getDuration());
    }, 500);
    return () => clearInterval(tick);
  }, [ytPlaying, ytSeeking]);

  // ── Keep YouTube volume in sync ───────────────────────────────────────────
  useEffect(() => {
    // Only call setVolume when the player is fully ready
    if (ytReadyRef.current && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(volume * 100);
    }
    if (audioRef.current) audioRef.current.volume = volume;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("favoriteThemeVolume", String(volume));
    }
  }, [volume]);

  // ── Autoplay audio when loaded ────────────────────────────────────────────
  useEffect(() => {
    if (!isAudioFallback || !musicUrl) return;
    // Wait a tick for the audio element to be in the DOM
    const timer = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.play().catch(() => {
          // Autoplay may be blocked by browser policy — silently ignore
        });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioFallback, musicUrl]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveLink = async () => {
    const url = linkDraft.trim();
    if (!url || typeof id !== "string") return;
    setMusicBusy(true);
    try {
      const updated = await updateFavorite(id, { fields: { musicUrl: url } });
      queryClient.setQueryData(["favorite", id], updated);
      setLinkInputOpen(false);
      setLinkDraft("");
    } finally {
      setMusicBusy(false);
    }
  };

  const handleRemoveMusic = async () => {
    if (!musicUrl) return;
    if (typeof id !== "string") return;
    setMusicBusy(true);
    try {
      const updated = await updateFavorite(id, {
        fields: { musicUrl: null },
      });
      queryClient.setQueryData(["favorite", id], updated);
    } finally {
      setMusicBusy(false);
    }
  };

  const handleYtTogglePlay = () => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return;
    if (ytPlaying) {
      ytPlayerRef.current.pauseVideo();
    } else {
      ytPlayerRef.current.playVideo();
    }
  };

  const handleYtSeek = (sec: number) => {
    ytPlayerRef.current?.seekTo(sec, true);
    setYtCurrentTime(sec);
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading || !favorite) return <FullScreenLoader />;

  if (isError) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this favorite.
          </p>
        </div>
      </Layout>
    );
  }

  // ── Progress values ───────────────────────────────────────────────────────
  const progressPercent =
    urlType === "youtube"
      ? ytDuration > 0
        ? ytCurrentTime / ytDuration
        : 0
      : audioDuration > 0
        ? audioCurrentTime / audioDuration
        : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Layout className="px-0 md:px-0 pt-0 md:pt-0">
      <div className="min-h-screen bg-background">
        {/* Hidden YouTube container — must always be in DOM when ytVideoId exists */}
        {ytVideoId && (
          <div
            style={{
              position: "fixed",
              width: 1,
              height: 1,
              overflow: "hidden",
              opacity: 0,
              pointerEvents: "none",
              top: -9999,
              left: -9999,
            }}
          >
            <div id={ytContainerId} />
          </div>
        )}

        {/* Compact top bar — hidden on mobile (mobile nav is overlaid on cover) */}
        <header className="hidden sm:flex sticky top-0 z-20 items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          {isOwner && (
            <Button
              variant="default"
              size="sm"
              className="rounded-full gap-1.5 shrink-0"
              onClick={() => router.push(`/favorites/${id}/edit`)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          )}
        </header>

        <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-16">
          {/* Cover + title block */}
          <section className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 2xl:mb-8">
            {/* Cover image */}
            <div className="relative shrink-0 w-full sm:w-56 sm:max-h-[400px] aspect-[2/3] rounded-2xl overflow-hidden bg-muted border border-white/5 ring-1 ring-black/5">
              {/* Mobile nav overlay */}
              <div className="flex sm:hidden items-center justify-between w-full p-4 absolute top-0 right-0 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="border border-white/30 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/70 rounded-full shrink-0"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                {isOwner && (
                  <Button
                    variant="default"
                    size="sm"
                    className="text-white border border-white/30 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/70 rounded-full gap-1.5 shrink-0"
                    onClick={() => router.push(`/favorites/${id}/edit`)}
                  >
                    <Pencil className="w-2.5 h-2.5" />
                    Edit
                  </Button>
                )}
              </div>
              <img
                src={getFavoriteCoverImage(favorite.image, favorite.categoryId)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getFavoriteCoverImage(
                    "",
                    favorite.categoryId,
                  );
                }}
              />
            </div>

            {/* Meta + player */}
            <div className="relative min-w-0 flex-1 pt-2">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  {favorite.categoryId}
                </span>
                {fields.releaseYear != null && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {fields.releaseYear}
                    </span>
                  </>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground break-words">
                {favorite.title}
              </h1>
              {genreStr && (
                <p className="text-sm text-muted-foreground mt-1">{genreStr}</p>
              )}
              {CATEGORY_EXTRA_FIELDS[favorite.categoryId] && (
                <div className="mt-2 p-3 rounded-xl bg-muted/40 border border-white/5">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {CATEGORY_EXTRA_FIELDS[favorite.categoryId].map((def) => {
                      const value = (fields as Record<string, unknown>)[
                        def.key
                      ];
                      if (value == null || value === "") return null;
                      const display =
                        typeof value === "number"
                          ? String(value)
                          : Array.isArray(value)
                            ? value.join(", ")
                            : String(value);
                      return (
                        <div key={def.key}>
                          <dt className="text-muted-foreground font-medium capitalize">
                            {def.label}
                          </dt>
                          <dd className="text-foreground mt-0.5">{display}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              )}
              <div className="flex items-center gap-3 mt-3 mb-4">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {typeof favorite.rating === "number"
                    ? `${favorite.rating.toFixed(1)}/10`
                    : "—"}
                </span>
                {favorite.timePeriod && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {favorite.timePeriod}
                  </span>
                )}
              </div>
              {fields.plotSummary && (
                <p className="text-sm text-muted-foreground 2xl:mb-4 mb-3 leading-relaxed">
                  {fields.plotSummary}
                </p>
              )}

              {/* ── Theme Music Section ────────────────────────────────── */}
              {showThemeMusicSection && (
                <section className="mt-1 space-y-2">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    {(!isOwner && !musicUrl) ? null : (
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <Music2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Theme music
                          </p>
                          {musicUrl && (
                            <p className="text-[11px] text-muted-foreground">
                              {urlType === "youtube"
                                ? "YouTube · plays on this page"
                                : urlType === "spotify"
                                  ? "Spotify embed"
                                  : "Audio track"}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Owner controls */}
                    {isOwner && (
                      <div className="flex items-center gap-2 ml-auto">
                        {musicUrl && !linkInputOpen && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={handleRemoveMusic}
                            disabled={musicBusy}
                            aria-label="Remove track"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                        {!linkInputOpen && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] rounded-full gap-1"
                            onClick={() => {
                              setLinkDraft(musicUrl ?? "");
                              setLinkInputOpen(true);
                            }}
                            disabled={musicBusy}
                          >
                            <Link2 className="w-3 h-3" />
                            {musicUrl ? "Replace link" : "Paste link"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline link-input (owner, when open) */}
                  {isOwner && linkInputOpen && (
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-muted/40 px-3 py-2">
                      <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <input
                        autoFocus
                        type="url"
                        placeholder="Paste YouTube or Spotify link…"
                        value={linkDraft}
                        onChange={(e) => setLinkDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveLink();
                          if (e.key === "Escape") setLinkInputOpen(false);
                        }}
                        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none min-w-0"
                      />
                      <button
                        type="button"
                        onClick={handleSaveLink}
                        disabled={musicBusy || !linkDraft.trim()}
                        aria-label="Save"
                        className="h-6 w-6 rounded-full flex items-center justify-center bg-primary/20 hover:bg-primary/30 disabled:opacity-40 transition-colors shrink-0"
                      >
                        {musicBusy ? (
                          <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        ) : (
                          <Check className="w-3 h-3 text-primary" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkInputOpen(false)}
                        aria-label="Cancel"
                        className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  {/* ── YouTube custom player ─────────────────────────── */}
                  {musicUrl && urlType === "youtube" && (
                    <div className="rounded-xl border border-white/10 bg-muted/40 px-3 py-2.5 flex flex-col gap-2.5">
                      {/* Top row: EQ + status + volume */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {/* EQ bars */}
                          <div className="flex items-end gap-[3px] h-6 text-primary">
                            {[
                              { h: "h-3", delay: "0s" },
                              { h: "h-4", delay: "0.12s" },
                              { h: "h-5", delay: "0.24s" },
                              { h: "h-4", delay: "0.18s" },
                              { h: "h-3", delay: "0.06s" },
                            ].map((bar, i) => (
                              <span
                                key={i}
                                className={`w-1.5 ${bar.h} bg-primary/70 rounded-full ${musicPlaying ? "eq-bar" : ""}`}
                                style={{ animationDelay: bar.delay }}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {ytPlaying ? "Now playing" : "Paused"}
                          </span>
                        </div>
                        {/* Volume */}
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Volume2 className="w-3 h-3 text-primary" />
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={volume}
                            onChange={(e) =>
                              setVolume(parseFloat(e.target.value) || 0)
                            }
                            className="h-1 w-20 accent-primary"
                          />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right shrink-0">
                          {formatTime(ytCurrentTime)}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={ytDuration || 1}
                          step={0.5}
                          value={ytCurrentTime}
                          onMouseDown={() => setYtSeeking(true)}
                          onTouchStart={() => setYtSeeking(true)}
                          onChange={(e) =>
                            setYtCurrentTime(parseFloat(e.target.value))
                          }
                          onMouseUp={(e) => {
                            setYtSeeking(false);
                            handleYtSeek(
                              parseFloat(
                                (e.target as HTMLInputElement).value,
                              ),
                            );
                          }}
                          onTouchEnd={(e) => {
                            setYtSeeking(false);
                            handleYtSeek(
                              parseFloat(
                                (e.target as HTMLInputElement).value,
                              ),
                            );
                          }}
                          className="flex-1 h-1 accent-primary cursor-pointer"
                        />
                        <span className="text-[10px] tabular-nums text-muted-foreground w-7 shrink-0">
                          {formatTime(ytDuration)}
                        </span>
                      </div>

                      {/* Controls row */}
                      <div className="flex items-center justify-center gap-3">
                        {/* Back 10s */}
                        <button
                          type="button"
                          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors"
                          onClick={() =>
                            handleYtSeek(Math.max(0, ytCurrentTime - 10))
                          }
                          aria-label="Back 10 seconds"
                        >
                          <SkipBack className="w-3.5 h-3.5 text-primary" />
                        </button>
                        {/* Play / Pause */}
                        <button
                          type="button"
                          className="h-9 w-9 rounded-full flex items-center justify-center bg-primary/15 hover:bg-primary/25 transition-colors"
                          onClick={handleYtTogglePlay}
                          aria-label={ytPlaying ? "Pause" : "Play"}
                        >
                          {ytPlaying ? (
                            <Pause className="w-4 h-4 text-primary" />
                          ) : (
                            <Play className="w-4 h-4 text-primary" />
                          )}
                        </button>
                        {/* Forward 10s */}
                        <button
                          type="button"
                          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors"
                          onClick={() =>
                            handleYtSeek(
                              Math.min(ytDuration, ytCurrentTime + 10),
                            )
                          }
                          aria-label="Forward 10 seconds"
                        >
                          <SkipForward className="w-3.5 h-3.5 text-primary" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Spotify embed ─────────────────────────────────── */}
                  {musicUrl && urlType === "spotify" && spotifyEmbedUrl && (
                    <iframe
                      src={spotifyEmbedUrl}
                      width="100%"
                      height="152"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-xl border-0"
                      title="Spotify player"
                    />
                  )}

                  {/* ── Audio fallback (existing Cloudinary URLs, etc.) */}
                  {musicUrl && isAudioFallback && (
                    <div className="rounded-xl border border-white/10 bg-muted/40 px-3 py-2.5 flex flex-col gap-2.5">
                      <audio
                        ref={audioRef}
                        src={musicUrl}
                        className="hidden"
                        onTimeUpdate={() => {
                          if (audioRef.current) {
                            setAudioCurrentTime(
                              audioRef.current.currentTime,
                            );
                          }
                        }}
                        onDurationChange={() => {
                          if (audioRef.current) {
                            setAudioDuration(audioRef.current.duration);
                          }
                        }}
                        onPlay={() => setAudioPlaying(true)}
                        onPause={() => setAudioPlaying(false)}
                        onEnded={() => setAudioPlaying(false)}
                      />
                      {/* Top row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-end gap-[3px] h-6 text-primary">
                            {[
                              { h: "h-3", delay: "0s" },
                              { h: "h-4", delay: "0.12s" },
                              { h: "h-5", delay: "0.24s" },
                              { h: "h-4", delay: "0.18s" },
                              { h: "h-3", delay: "0.06s" },
                            ].map((bar, i) => (
                              <span
                                key={i}
                                className={`w-1.5 ${bar.h} bg-primary/70 rounded-full ${audioPlaying ? "eq-bar" : ""}`}
                                style={{ animationDelay: bar.delay }}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {audioPlaying ? "Now playing" : "Paused"}
                          </span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5">
                          <Volume2 className="w-3 h-3 text-primary" />
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={volume}
                            onChange={(e) =>
                              setVolume(parseFloat(e.target.value) || 0)
                            }
                            className="h-1 w-20 accent-primary"
                          />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right shrink-0">
                          {formatTime(audioCurrentTime)}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={audioDuration || 1}
                          step={0.5}
                          value={audioCurrentTime}
                          onChange={(e) => {
                            const t = parseFloat(e.target.value);
                            if (audioRef.current)
                              audioRef.current.currentTime = t;
                            setAudioCurrentTime(t);
                          }}
                          className="flex-1 h-1 accent-primary cursor-pointer"
                        />
                        <span className="text-[10px] tabular-nums text-muted-foreground w-7 shrink-0">
                          {formatTime(audioDuration)}
                        </span>
                      </div>
                      {/* Controls */}
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors"
                          onClick={() => {
                            if (!audioRef.current) return;
                            const t = Math.max(
                              0,
                              audioRef.current.currentTime - 10,
                            );
                            audioRef.current.currentTime = t;
                            setAudioCurrentTime(t);
                          }}
                          aria-label="Back 10 seconds"
                        >
                          <SkipBack className="w-3.5 h-3.5 text-primary" />
                        </button>
                        <button
                          type="button"
                          className="h-9 w-9 rounded-full flex items-center justify-center bg-primary/15 hover:bg-primary/25 transition-colors"
                          onClick={() => {
                            if (!audioRef.current) return;
                            if (audioPlaying) {
                              audioRef.current.pause();
                            } else {
                              audioRef.current
                                .play()
                                .catch(() => setAudioPlaying(false));
                            }
                          }}
                          aria-label={audioPlaying ? "Pause" : "Play"}
                        >
                          {audioPlaying ? (
                            <Pause className="w-4 h-4 text-primary" />
                          ) : (
                            <Play className="w-4 h-4 text-primary" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors"
                          onClick={() => {
                            if (!audioRef.current) return;
                            const t = Math.min(
                              audioDuration,
                              audioRef.current.currentTime + 10,
                            );
                            audioRef.current.currentTime = t;
                            setAudioCurrentTime(t);
                          }}
                          aria-label="Forward 10 seconds"
                        >
                          <SkipForward className="w-3.5 h-3.5 text-primary" />
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
              {/* end showThemeMusicSection */}
            </div>
          </section>

          {/* Why it matters */}
          <section className="rounded-xl border border-white/5 bg-card/40 p-4 2xl:mb-6 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Heart className="w-3.5 h-3.5" />
              Why it matters
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              {favorite.whyILike}
            </p>
          </section>

          {/* Mood & tags */}
          {showMoodTags && (
            <section className="rounded-xl border border-white/5 bg-card/40 p-4 2xl:mb-6 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                Mood &amp; tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {favorite.mood?.map((m) => (
                  <span
                    key={m}
                    className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {m}
                  </span>
                ))}
                {favorite.recommendedTime?.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
                {favorite.tags?.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Emotional journey */}
          {showJourney && (
            <section className="rounded-xl border border-white/5 bg-card/40 p-4 2xl:mb-6 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Emotional journey
              </h2>
              <EmotionalJourneyView
                categoryId={favorite.categoryId}
                totalDurationSeconds={fields.totalDurationSeconds}
                episodeDurations={
                  fields.episodeDurations as number[] | undefined
                }
                episodeSegments={fields.episodeSegments}
                seasonEpisodeCounts={fields.seasonEpisodeCounts}
                curvePoints={
                  Array.isArray(fields.emotionalCurve)
                    ? fields.emotionalCurve.map(
                        (p, i): { id: string; x: number; y: number } =>
                          "id" in p &&
                          typeof (p as { id?: string }).id === "string"
                            ? (p as { id: string; x: number; y: number })
                            : { id: `curve-${i}`, x: p.x, y: p.y },
                      )
                    : []
                }
                emotionalSegments={
                  Array.isArray(fields.emotionalSegments)
                    ? fields.emotionalSegments
                    : []
                }
                momentPins={
                  Array.isArray(fields.momentPins) ? fields.momentPins : []
                }
                className="mt-1"
              />
            </section>
          )}
        </main>
      </div>
      {/* unused but kept to satisfy progressPercent usage */}
      {progressPercent === -1 && null}
    </Layout>
  );
}
