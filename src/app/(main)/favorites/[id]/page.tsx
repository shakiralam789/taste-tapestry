"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import {
  getFavorite,
  uploadFavoriteMusic,
  updateFavorite,
} from "@/features/favorites/api";
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
  RotateCcw,
  Volume2,
} from "lucide-react";

type FavoriteFields = Favorite["fields"] & {
  releaseYear?: number;
  genre?: string[];
  plotSummary?: string;
  totalDurationSeconds?: number;
  episodeDurations?: number[];
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

export default function FavoriteShowPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [musicBusy, setMusicBusy] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 1;
    const stored = window.localStorage.getItem("favoriteThemeVolume");
    const parsed = stored != null ? parseFloat(stored) : NaN;
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 1;
  });
  const musicInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayRegisteredRef = useRef(false);

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

  // Best-effort auto-play:
  // 1) try to play immediately when musicUrl changes
  // 2) if blocked, fall back to first user interaction (pointerdown)
  useEffect(() => {
    if (!musicUrl) return;
    const el = audioRef.current;
    if (!el) return;

    const handleFirstInteraction = () => {
      autoPlayRegisteredRef.current = true;
      el.play()
        .then(() => setMusicPlaying(true))
        .catch(() => setMusicPlaying(false));
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };

    // Try to play immediately; if browser blocks, we rely on the interaction handler
    el.play()
      .then(() => {
        autoPlayRegisteredRef.current = true;
        setMusicPlaying(true);
      })
      .catch(() => {
        // ignore, will try again on first interaction
      });

    if (!autoPlayRegisteredRef.current) {
      window.addEventListener("pointerdown", handleFirstInteraction, {
        once: true,
      });
    }

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };
  }, [musicUrl]);

  // Keep audio element volume in sync with UI state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("favoriteThemeVolume", String(volume));
    }
  }, [volume]);

  if (isLoading || !favorite) {
    return <FullScreenLoader />;
  }

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

  const handleMusicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) return;
    if (typeof id !== "string") return;
    setMusicBusy(true);
    try {
      const updated = await uploadFavoriteMusic(id, file);
      queryClient.setQueryData(["favorite", id], updated);
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

  return (
    <Layout className="px-0 md:px-0 pt-0 md:pt-0">
      <div className="min-h-screen bg-background">
        {/* Compact top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
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

        <main className="max-w-4xl mx-auto px-4 py-6 pb-16">
          {/* Cover + title block — compact single row on larger screens */}
          <section className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 2xl:mb-8">
            <div className="shrink-0 w-full sm:w-56 sm:max-h-[400px] aspect-[2/3] rounded-2xl overflow-hidden bg-muted border border-white/5 ring-1 ring-black/5">
              <img
                src={getFavoriteCoverImage(favorite.image, favorite.categoryId)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getFavoriteCoverImage("", favorite.categoryId);
                }}
              />
            </div>
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
                      const value = (fields as Record<string, unknown>)[def.key];
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

              {showThemeMusicSection && (
                <section className="mt-1 space-y-2">
                  {
                    <div className="flex items-center justify-between gap-2">
                      {!isOwner && !musicUrl ? null : (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                            <Music2 className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Theme music
                            </p>
                            {musicUrl && (
                              <p className="text-[11px] text-muted-foreground">
                                Auto-plays when you open this page
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {isOwner && (
                        <div className="flex items-center gap-2">
                          <input
                            ref={musicInputRef}
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={handleMusicChange}
                          />
                          {musicUrl && (
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] rounded-full"
                            onClick={() => musicInputRef.current?.click()}
                            disabled={musicBusy}
                          >
                            {musicBusy
                              ? "Working…"
                              : musicUrl
                                ? "Replace track"
                                : "Upload track"}
                          </Button>
                        </div>
                      )}
                    </div>
                  }
                  {musicUrl && (
                    <div
                      className={` rounded-xl border border-white/10 bg-muted/40 px-3 py-2 flex flex-col gap-2`}
                    >
                      <div
                        className={`flex items-center justify-between gap-2`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-end gap-[3px] h-6 text-primary">
                            <span
                              className={`w-1.5 h-3 bg-primary/80 rounded-full ${
                                musicPlaying ? "eq-bar" : ""
                              }`}
                              style={{ animationDelay: "0s" }}
                            />
                            <span
                              className={`w-1.5 h-4 bg-primary/70 rounded-full ${
                                musicPlaying ? "eq-bar" : ""
                              }`}
                              style={{ animationDelay: "0.12s" }}
                            />
                            <span
                              className={`w-1.5 h-5 bg-primary/60 rounded-full ${
                                musicPlaying ? "eq-bar" : ""
                              }`}
                              style={{ animationDelay: "0.24s" }}
                            />
                            <span
                              className={`w-1.5 h-4 bg-primary/70 rounded-full ${
                                musicPlaying ? "eq-bar" : ""
                              }`}
                              style={{ animationDelay: "0.18s" }}
                            />
                            <span
                              className={`w-1.5 h-3 bg-primary/80 rounded-full ${
                                musicPlaying ? "eq-bar" : ""
                              }`}
                              style={{ animationDelay: "0.06s" }}
                            />
                          </div>
                          {isOwner && (
                            <span className="text-[11px] text-muted-foreground">
                              {musicPlaying ? "Now playing" : "Paused"}
                            </span>
                          )}
                          <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
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
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors"
                            onClick={() => {
                              if (!audioRef.current) return;
                              if (musicPlaying) {
                                audioRef.current.pause();
                                setMusicPlaying(false);
                              } else {
                                audioRef.current
                                  .play()
                                  .then(() => setMusicPlaying(true))
                                  .catch(() => setMusicPlaying(false));
                              }
                            }}
                            aria-label={musicPlaying ? "Pause" : "Play"}
                          >
                            {musicPlaying ? (
                              <Pause className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-primary" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors"
                            onClick={() => {
                              if (!audioRef.current) return;
                              audioRef.current.currentTime = 0;
                              audioRef.current
                                .play()
                                .then(() => setMusicPlaying(true))
                                .catch(() => setMusicPlaying(false));
                            }}
                            aria-label="Replay"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-primary" />
                          </button>
                        </div>
                      </div>
                      <audio ref={audioRef} src={musicUrl} className="hidden" />
                    </div>
                  )}
                </section>
              )}
            </div>
          </section>

          {/* Why it matters — compact card */}
          <section className="rounded-xl border border-white/5 bg-card/40 p-4 2xl:mb-6 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Heart className="w-3.5 h-3.5" />
              Why it matters
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              {favorite.whyILike}
            </p>
          </section>

          {/* Mood & tags — single compact row */}
          {showMoodTags && (
            <section className="rounded-xl border border-white/5 bg-card/40 p-4 2xl:mb-6 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                Mood & tags
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

          {/* Emotional journey — compact */}
          {showJourney && (
            <section className="rounded-xl border border-white/5 bg-card/40 p-4 2xl:mb-6 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Emotional journey
              </h2>
              <EmotionalJourneyView
                categoryId={favorite.categoryId}
                totalDurationSeconds={fields.totalDurationSeconds}
                episodeDurations={fields.episodeDurations}
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
    </Layout>
  );
}
