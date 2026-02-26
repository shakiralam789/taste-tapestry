"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { getFavorite } from "@/features/favorites/api";
import type { Favorite } from "@/types/wishbook";
import { EmotionalJourneyView } from "@/components/favorites/EmotionalJourneyView";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

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
    queryFn: async (): Promise<Favorite> => getFavorite(id),
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

  return (
    <Layout className="md:px-0 px-0 pt-0 md:pt-0">
      <div className="min-h-screen pb-12">
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 mix-blend-overlay" />
          {favorite.image && (
            <img
              src={favorite.image}
              alt={favorite.title}
              className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Button>
            <Button
              variant="gradient"
              size="sm"
              className="rounded-full"
              onClick={() => router.push(`/favorites/${id}/edit`)}
            >
              <PencilIcon className="w-4 h-4" />
              Edit favorite
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-card/60 border border-white/10 shadow-xl overflow-hidden">
                <div className="aspect-[3/4] bg-muted">
                  {favorite.image ? (
                    <img
                      src={favorite.image}
                      alt={favorite.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {favorite.title}
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="rounded-full px-3 py-1 text-xs">
                      {favorite.categoryId}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {favorite.fields?.releaseYear}
                    </span>
                  </div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold">
                    {favorite.title}
                  </h1>
                  {favorite.fields?.genre &&
                    Array.isArray(favorite.fields.genre) && (
                      <p className="text-xs text-muted-foreground">
                        {(favorite.fields.genre as string[]).join(" • ")}
                      </p>
                    )}
                  {favorite.fields?.plotSummary && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {favorite.fields.plotSummary as string}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl bg-card/60 border border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Rating
                  </p>
                  <p className="font-display text-2xl">
                    {favorite.rating.toFixed(1)}/10
                  </p>
                </div>
                {favorite.timePeriod && (
                  <p className="text-xs text-muted-foreground">
                    Time in your life:{" "}
                    <span className="font-medium text-foreground">
                      {favorite.timePeriod}
                    </span>
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-card/60 border border-white/10 p-5 space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Why this matters
                </p>
                <p className="text-sm leading-relaxed">
                  {favorite.whyILike}
                </p>
              </div>

              {(favorite.mood?.length || 0) > 0 ||
              (favorite.recommendedTime?.length || 0) > 0 ||
              (favorite.tags?.length || 0) > 0 ? (
                <div className="rounded-2xl bg-card/60 border border-white/10 p-5 space-y-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Mood & tags
                  </p>
                  {favorite.mood && favorite.mood.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {favorite.mood.map((m) => (
                        <span
                          key={m}
                          className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                  {favorite.recommendedTime &&
                    favorite.recommendedTime.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {favorite.recommendedTime.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full border border-border"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  {favorite.tags && favorite.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {favorite.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-muted">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {(((favorite.fields?.emotionalSegments?.length ?? 0) > 0 &&
                favorite.categoryId !== "series" &&
                favorite.categoryId !== "anime") ||
                (favorite.fields?.totalDurationSeconds &&
                  (favorite.fields as any)?.emotionalCurve?.length >= 2) ||
                ((favorite.categoryId === "series" ||
                  favorite.categoryId === "anime") &&
                  Array.isArray((favorite.fields as any)?.episodeSegments) &&
                  (favorite.fields as any).episodeSegments.some(
                    (arr: unknown) => Array.isArray(arr) && arr.length > 0,
                  )) ||
                ((favorite.fields as any)?.emotionalCurve?.length ?? 0) >= 5 ||
                ((favorite.fields as any)?.momentPins?.length ?? 0) > 0) && (
                <div className="rounded-2xl bg-card/60 border border-white/10 p-5">
                  <EmotionalJourneyView
                    categoryId={favorite.categoryId}
                    totalDurationSeconds={
                      (favorite.fields as any)?.totalDurationSeconds
                    }
                    episodeDurations={
                      Array.isArray((favorite.fields as any)?.episodeDurations)
                        ? (favorite.fields as any).episodeDurations
                        : undefined
                    }
                    episodeSegments={
                      Array.isArray((favorite.fields as any)?.episodeSegments)
                        ? (favorite.fields as any).episodeSegments
                        : undefined
                    }
                    seasonEpisodeCounts={
                      Array.isArray(
                        (favorite.fields as any)?.seasonEpisodeCounts,
                      )
                        ? (favorite.fields as any).seasonEpisodeCounts
                        : undefined
                    }
                    curvePoints={
                      Array.isArray((favorite.fields as any)?.emotionalCurve)
                        ? (favorite.fields as any).emotionalCurve
                        : []
                    }
                    emotionalSegments={
                      Array.isArray(
                        (favorite.fields as any)?.emotionalSegments,
                      )
                        ? (favorite.fields as any).emotionalSegments
                        : []
                    }
                    momentPins={
                      Array.isArray((favorite.fields as any)?.momentPins)
                        ? (favorite.fields as any).momentPins
                        : []
                    }
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

