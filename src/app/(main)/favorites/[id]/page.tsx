"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { getFavorite } from "@/features/favorites/api";
import type { Favorite, EmotionalSegment } from "@/types/wishbook";
import { EmotionalJourneyView } from "@/components/favorites/EmotionalJourneyView";
import {
  ArrowLeft,
  Pencil,
  Star,
  Heart,
  Clock,
  Tag,
  Sparkles,
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
  momentPins?: { id: string; positionPercent: number; note: string; image?: string }[];
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

  const fields = (favorite.fields ?? {}) as FavoriteFields;
  const genreStr =
    Array.isArray(fields.genre) && fields.genre.length > 0
      ? fields.genre.join(" · ")
      : null;
  const showMoodTags =
    (favorite.mood?.length ?? 0) > 0 ||
    (favorite.recommendedTime?.length ?? 0) > 0 ||
    (favorite.tags?.length ?? 0) > 0;
  const showJourney = hasEmotionalJourney(favorite);

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
          <Button
            variant="default"
            size="sm"
            className="rounded-full gap-1.5 shrink-0"
            onClick={() => router.push(`/favorites/${id}/edit`)}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
          {/* Cover + title block — compact single row on larger screens */}
          <section className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 2xl:mb-8">
            <div className="shrink-0 w-full sm:w-48 aspect-[3/4] rounded-2xl overflow-hidden bg-muted border border-white/5 ring-1 ring-black/5">
              {favorite.image ? (
                <img
                  src={favorite.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  <Sparkles className="w-8 h-8 opacity-50" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-4">
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
              <div className="flex items-center gap-3 mt-3 mb-4">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {favorite.rating.toFixed(1)}/10
                </span>
                {favorite.timePeriod && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {favorite.timePeriod}
                  </span>
                )}
              </div>
              {fields.plotSummary && (
            <p className="text-sm text-muted-foreground 2xl:mb-6 mb-4 leading-relaxed">
              {fields.plotSummary}
            </p>
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
                          "id" in p && typeof (p as { id?: string }).id === "string"
                            ? (p as { id: string; x: number; y: number })
                            : { id: `curve-${i}`, x: p.x, y: p.y },
                      )
                    : []
                }
                emotionalSegments={Array.isArray(fields.emotionalSegments) ? fields.emotionalSegments : []}
                momentPins={Array.isArray(fields.momentPins) ? fields.momentPins : []}
                className="mt-1"
              />
            </section>
          )}
        </main>
      </div>
    </Layout>
  );
}
