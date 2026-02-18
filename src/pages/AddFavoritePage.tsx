import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CategoryChip } from "@/components/categories/CategoryChip";
import { useWishbook } from "@/contexts/WishbookContext";
import { moodOptions } from "@/data/mockData";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Star,
  Sparkles,
  Clock,
  Tag,
  X,
  Plus,
  Check,
  Film,
  Heart,
  TrendingUp,
  Palette,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { EmotionalJourneyEditor } from "@/components/favorites/EmotionalJourneyEditor";
import { Favorite, Mood, EmotionalSegment } from "@/types/wishbook";
import { getEmotionFill } from "@/data/emotionColors";

const TOTAL_STEPS = 4;
/** Categories that show the "Your emotional journey" section (movie, series, anime, song). */
const EMOTIONAL_JOURNEY_CATEGORIES = ["movies", "series", "anime", "songs"];
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
// Set VITE_TMDB_API_KEY in .env to enable movie/series search and auto-fill (get key at https://www.themoviedb.org/settings/api)

type TmdbSearchResult = {
  id: number;
  title: string;
  year?: string;
  poster_path?: string | null;
};

const timeOptions = [
  { id: "night", label: "🌙 Night" },
  { id: "morning", label: "☀️ Morning" },
  { id: "rainy-day", label: "🌧️ Rainy Day" },
  { id: "alone", label: "🧘 Alone" },
  { id: "with-friends", label: "👥 With Friends" },
  { id: "weekend", label: "📅 Weekend" },
];

export default function AddFavoritePage() {
  const navigate = useNavigate();
  const { categories, addFavorite } = useWishbook();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("movies");
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    rating: 8,
    whyILike: "",
    timePeriod: "",
    genre: "",
    releaseYear: "",
    plotSummary: "",
  });
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [recommendedTimes, setRecommendedTimes] = useState<string[]>([]);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  /** For series/anime: episodes per season, e.g. [3, 4, 2] = S1 has 3, S2 has 4, S3 has 2. */
  const [seasonEpisodeCounts, setSeasonEpisodeCounts] = useState<number[]>([]);
  const [emotionalSegments, setEmotionalSegments] = useState<
    EmotionalSegment[]
  >([]);
  /** For series: duration in seconds per episode (index = episode - 1). */
  const [episodeDurations, setEpisodeDurations] = useState<number[]>([]);
  /** For series: segments per episode (index = episode - 1). */
  const [episodeSegments, setEpisodeSegments] = useState<EmotionalSegment[][]>(
    [],
  );
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);

  const [dropdownClosed, setDropdownClosed] = useState(false);
  const [tmdbTvId, setTmdbTvId] = useState<number | null>(null);
  const [debouncedSearchTitle, setDebouncedSearchTitle] = useState("");
  const titleDropdownRef = useRef<HTMLDivElement>(null);
  /** When true, next debounce effect must not reopen dropdown (title was set by TMDb selection). */
  const skipDropdownOpenRef = useRef(false);
  /** When set by TMDb TV details, used to fill episodeDurations in the sync effect. */
  const tmdbEpisodeRuntimeSecondsRef = useRef<number | null>(null);

  const isSeries = selectedCategory === "series";
  const isSeriesOrAnime = isSeries || selectedCategory === "anime";
  const hasEmotionalJourney =
    EMOTIONAL_JOURNEY_CATEGORIES.includes(selectedCategory);
  const totalSteps = hasEmotionalJourney ? TOTAL_STEPS : TOTAL_STEPS - 1;

  // For series/anime: total episodes = sum of season counts (or legacy totalEpisodes if single season with no counts)
  const totalEpisodesDerived =
    isSeriesOrAnime && seasonEpisodeCounts.length > 0
      ? seasonEpisodeCounts.reduce((a, b) => a + b, 0) || totalEpisodes
      : totalEpisodes;

  // Keep episode arrays in sync with totalEpisodesDerived
  useEffect(() => {
    if (!isSeriesOrAnime || totalEpisodesDerived <= 0) return;
    const defaultRuntime = tmdbEpisodeRuntimeSecondsRef.current ?? 0;
    setEpisodeDurations((prev) => {
      const next = prev.slice(0, totalEpisodesDerived);
      while (next.length < totalEpisodesDerived) next.push(defaultRuntime);
      return next;
    });
    tmdbEpisodeRuntimeSecondsRef.current = null;
    setEpisodeSegments((prev) => {
      const next = prev.slice(0, totalEpisodesDerived);
      while (next.length < totalEpisodesDerived) next.push([]);
      return next;
    });
    setSelectedEpisodeIndex((i) => Math.min(i, totalEpisodesDerived - 1));
  }, [isSeriesOrAnime, totalEpisodesDerived]);

  const toggleMood = (mood: Mood) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood],
    );
  };

  const toggleTime = (time: string) => {
    setRecommendedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    const newFavorite: Favorite = {
      id: Date.now().toString(),
      userId: "1",
      categoryId: selectedCategory,
      title: formData.title,
      image: formData.image || DEFAULT_IMAGE,
      rating: formData.rating,
      mood: selectedMoods,
      whyILike: formData.whyILike,
      timePeriod: formData.timePeriod,
      recommendedTime: recommendedTimes,
      tags,
      createdAt: new Date(),
      fields: {
        genre: formData.genre.split(",").map((g) => g.trim()),
        releaseYear: parseInt(formData.releaseYear) || new Date().getFullYear(),
        plotSummary: formData.plotSummary,
        totalDurationSeconds: isSeries
          ? undefined
          : totalDurationSeconds || undefined,
        totalEpisodes: isSeriesOrAnime
          ? totalEpisodesDerived || undefined
          : undefined,
        seasonEpisodeCounts:
          isSeriesOrAnime && seasonEpisodeCounts.length > 0
            ? seasonEpisodeCounts
            : undefined,
        emotionalSegments:
          !isSeries && emotionalSegments.length > 0
            ? emotionalSegments
            : undefined,
        episodeDurations:
          isSeriesOrAnime && episodeDurations.length > 0
            ? episodeDurations
            : undefined,
        episodeSegments:
          isSeriesOrAnime && episodeSegments.some((arr) => arr.length > 0)
            ? episodeSegments
            : undefined,
      },
    };
    addFavorite(newFavorite);
    navigate("/profile");
  };

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const isInitialMount = useRef(true);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
  const tmdbEnabled =
    Boolean(tmdbApiKey) &&
    (selectedCategory === "movies" || selectedCategory === "series" || selectedCategory === "anime");

  // Debounce title for TMDb search; reopen dropdown only when user typed (not when title came from TMDb selection)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchTitle(formData.title.trim());
      if (!skipDropdownOpenRef.current) {
        setDropdownClosed(false);
      } else {
        skipDropdownOpenRef.current = false;
      }
    }, 400);
    return () => clearTimeout(t);
  }, [formData.title]);

  // TMDb search (movies or TV) — react-query with caching and deduping
  const searchQuery = useQuery({
    queryKey: ["tmdb-search", debouncedSearchTitle, selectedCategory],
    queryFn: async (): Promise<TmdbSearchResult[]> => {
      if (!tmdbApiKey || !debouncedSearchTitle) return [];
      const isMovie = selectedCategory === "movies";
      const endpoint = isMovie
        ? `${TMDB_API_BASE}/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(debouncedSearchTitle)}`
        : `${TMDB_API_BASE}/search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(debouncedSearchTitle)}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      const results = (data.results || []).slice(0, 8).map(
        (r: {
          id: number;
          title?: string;
          name?: string;
          release_date?: string;
          first_air_date?: string;
          poster_path?: string | null;
        }) => ({
          id: r.id,
          title: isMovie ? (r.title ?? "") : (r.name ?? ""),
          year: (r.release_date || r.first_air_date || "").slice(0, 4) || undefined,
          poster_path: r.poster_path ?? null,
        })
      );
      return results;
    },
    enabled: tmdbEnabled && debouncedSearchTitle.length > 0,
    staleTime: 60_000,
  });

  const tmdbResults = searchQuery.data ?? [];

  // Fetch movie/TV details when user selects a result (react-query mutation)
  const fetchDetailsMutation = useMutation({
    mutationFn: async (result: TmdbSearchResult) => {
      if (!tmdbApiKey) throw new Error("No API key");
      const isMovie = selectedCategory === "movies";
      const endpoint = isMovie
        ? `${TMDB_API_BASE}/movie/${result.id}?api_key=${tmdbApiKey}`
        : `${TMDB_API_BASE}/tv/${result.id}?api_key=${tmdbApiKey}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (!res.ok) throw new Error("Details fetch failed");
      let episodeRuntimeMinutes: number | null = null;
      if (!isMovie && (selectedCategory === "series" || selectedCategory === "anime")) {
        const runTimes = data.episode_run_time;
        episodeRuntimeMinutes =
          Array.isArray(runTimes) && runTimes.length > 0
            ? runTimes.reduce((a: number, b: number) => a + b, 0) / runTimes.length
            : null;
        if ((episodeRuntimeMinutes == null || episodeRuntimeMinutes <= 0) && result.id) {
          const epRes = await fetch(
            `${TMDB_API_BASE}/tv/${result.id}/season/1/episode/1?api_key=${tmdbApiKey}`
          );
          const epData = await epRes.json();
          if (typeof epData.runtime === "number" && epData.runtime > 0) {
            episodeRuntimeMinutes = epData.runtime;
          }
        }
      }
      return {
        data,
        result,
        isMovie,
        episodeRuntimeMinutes,
      };
    },
    onSuccess: (payload) => {
      const { data, result, isMovie, episodeRuntimeMinutes } = payload;
      skipDropdownOpenRef.current = true; // prevent debounce effect from reopening dropdown when title updates
      setDropdownClosed(true);
      const genreStr = (data.genres || []).map((g: { name: string }) => g.name).join(", ");
      const year = isMovie
        ? (data.release_date || "").slice(0, 4)
        : (data.first_air_date || "").slice(0, 4);
      const overview = data.overview || "";
      const posterPath = data.poster_path
        ? `${TMDB_IMAGE_BASE}${data.poster_path}`
        : "";
      setFormData((prev) => ({
        ...prev,
        title: isMovie ? (data.title ?? prev.title) : (data.name ?? prev.title),
        genre: genreStr || prev.genre,
        releaseYear: year || prev.releaseYear,
        plotSummary: overview || prev.plotSummary,
        image: posterPath || prev.image,
      }));
      if (isMovie) {
        setTmdbTvId(null);
        if (typeof data.runtime === "number" && data.runtime > 0) {
          setTotalDurationSeconds(data.runtime * 60);
        }
      } else if (selectedCategory === "series" || selectedCategory === "anime") {
        setTmdbTvId(result.id);
        if (episodeRuntimeMinutes != null && episodeRuntimeMinutes > 0) {
          tmdbEpisodeRuntimeSecondsRef.current = Math.round(episodeRuntimeMinutes * 60);
        }
        const numEpisodes = data.number_of_episodes;
        const numSeasons = Math.max(1, data.number_of_seasons || 1);
        if (numEpisodes > 0) {
          setTotalEpisodes(numEpisodes);
          if (numSeasons === 1) {
            setSeasonEpisodeCounts([numEpisodes]);
          } else {
            const base = Math.floor(numEpisodes / numSeasons);
            const remainder = numEpisodes % numSeasons;
            setSeasonEpisodeCounts([
              ...Array(remainder).fill(base + 1),
              ...Array(numSeasons - remainder).fill(base),
            ]);
          }
        }
      }
    },
  });

  const selectTmdbResult = useCallback(
    (result: TmdbSearchResult) => {
      if (!tmdbApiKey) return;
      fetchDetailsMutation.mutate(result);
    },
    [tmdbApiKey, fetchDetailsMutation]
  );

  const tmdbLoading = searchQuery.isFetching || fetchDetailsMutation.isPending;
  const showTmdbDropdown = !dropdownClosed && tmdbResults.length > 0 && !tmdbLoading;

  // (season, episode) 1-based for the currently selected episode
  const { season: episodeSeason, episode: episodeNumber } = useMemo(() => {
    let start = 0;
    for (let s = 0; s < seasonEpisodeCounts.length; s++) {
      const count = seasonEpisodeCounts[s];
      if (selectedEpisodeIndex < start + count) {
        return { season: s + 1, episode: selectedEpisodeIndex - start + 1 };
      }
      start += count;
    }
    return { season: 0, episode: 0 };
  }, [selectedEpisodeIndex, seasonEpisodeCounts]);

  // Per-episode runtime from TMDb when user selects an episode (react-query)
  const episodeRuntimeQuery = useQuery({
    queryKey: ["tmdb-episode", tmdbTvId, episodeSeason, episodeNumber],
    queryFn: async () => {
      if (!tmdbApiKey || tmdbTvId == null || episodeSeason < 1 || episodeNumber < 1) return null;
      const res = await fetch(
        `${TMDB_API_BASE}/tv/${tmdbTvId}/season/${episodeSeason}/episode/${episodeNumber}?api_key=${tmdbApiKey}`
      );
      const data = await res.json();
      const runtimeMinutes = data.runtime;
      if (typeof runtimeMinutes === "number" && runtimeMinutes > 0) {
        return runtimeMinutes * 60;
      }
      return null;
    },
    enabled:
      Boolean(tmdbApiKey) &&
      tmdbTvId != null &&
      episodeSeason >= 1 &&
      episodeNumber >= 1 &&
      isSeriesOrAnime &&
      selectedEpisodeIndex >= 0 &&
      selectedEpisodeIndex < totalEpisodesDerived,
    staleTime: 5 * 60_000,
  });

  // Sync episode runtime from query into episodeDurations
  useEffect(() => {
    const sec = episodeRuntimeQuery.data;
    if (sec == null || episodeRuntimeQuery.isPlaceholderData) return;
    const idx = selectedEpisodeIndex;
    setEpisodeDurations((prev) => {
      const next = [...prev];
      if (idx >= 0 && idx < next.length) next[idx] = sec;
      return next;
    });
  }, [episodeRuntimeQuery.data, episodeRuntimeQuery.isPlaceholderData, selectedEpisodeIndex]);

  // Close TMDb dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(e.target as Node)) {
        setDropdownClosed(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCoverImageFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setFormData((prev) => ({ ...prev, image: dataUrl }));
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    []
  );

  const goNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // When category changes and emotional journey is hidden, clamp step to valid range
  useEffect(() => {
    if (step > totalSteps) setStep(totalSteps);
  }, [totalSteps, step]);

  // When step changes (Next or Back), scroll so the current section is at the top (smooth). Skip on first load.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const el = sectionRefs.current[step - 1];
    if (el) {
      const timer = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [step]);

  const sectionBlur = (sectionIndex: number) =>
    step > sectionIndex + 1
      ? "blur-[2px] opacity-50 pointer-events-none select-none"
      : "";

  const sectionTransitionClass =
    "transition-[filter,opacity] duration-500 ease-out";

  return (
    <Layout>
      <div className="min-h-screen py-0 pb-16">
        <div className="container mx-auto px-0">
          {/* Header + progress */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">
                  Add New <span className="gradient-text">Favorite</span>
                </h1>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Left: Form sections — only show sections up to current step */}
            <div className="lg:col-span-7 space-y-6">
              {/* Section 1: Category + Cover + Basic info (visible from step 1) */}
              {step > 0 && (
                <motion.section
                  ref={(el) => {
                    sectionRefs.current[0] = el;
                  }}
                  layout
                  transition={{ type: "spring", damping: 25 }}
                  className={`elevated-card p-4 md:p-6 border-2 border-primary/5 rounded-2xl ${sectionTransitionClass} ${sectionBlur(0)}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Film className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-lg font-semibold">
                      Basics
                    </h2>
                    {step > 1 && (
                      <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Category</Label>
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {categories.map((cat) => (
                          <CategoryChip
                            key={cat.id}
                            category={cat}
                            isSelected={selectedCategory === cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                          />
                        ))}
                      </div>
                    </div>
                    <div ref={titleDropdownRef} className="relative">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder={
                          selectedCategory === "movies"
                            ? "e.g., Eternal Sunshine of the Spotless Mind"
                            : selectedCategory === "series" || selectedCategory === "anime"
                              ? "e.g., Breaking Bad"
                              : "Enter title..."
                        }
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        onFocus={() => tmdbEnabled && tmdbResults.length > 0 && setDropdownClosed(false)}
                        className="mt-1"
                      />
                      {tmdbEnabled && (
                        <>
                          {tmdbLoading && (
                            <p className="text-xs text-muted-foreground mt-1">Searching TMDb...</p>
                          )}
                          {showTmdbDropdown && !tmdbLoading && tmdbResults.length > 0 && (
                            <ul className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-border bg-card shadow-lg py-1">
                              {tmdbResults.map((r) => (
                                <li key={r.id}>
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/80 transition-colors"
                                    onClick={() => selectTmdbResult(r)}
                                  >
                                    {r.poster_path ? (
                                      <img
                                        src={`${TMDB_IMAGE_BASE}${r.poster_path}`}
                                        alt=""
                                        className="w-10 h-14 rounded object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-10 h-14 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                                        <Film className="w-5 h-5 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span className="font-medium truncate flex-1">{r.title}</span>
                                    {r.year && (
                                      <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {r.year}
                                      </span>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      <Label className="mb-2 block">Cover Image</Label>
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors space-y-3">
                        <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Upload a file or paste an image URL
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <input
                            ref={coverImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverImageFile}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              coverImageInputRef.current?.click()
                            }
                            className="gap-1.5"
                          >
                            <Upload className="w-4 h-4" />
                            Upload
                          </Button>
                          <span className="text-muted-foreground text-sm">
                            or
                          </span>
                          <Input
                            placeholder="Paste image URL"
                            value={
                              formData.image.startsWith("data:")
                                ? ""
                                : formData.image
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                image: e.target.value.trim(),
                              }))
                            }
                            className="w-64 bg-transparent"
                          />
                        </div>
                        {formData.image.startsWith("data:") && (
                          <p className="text-xs text-muted-foreground">
                            Image set from upload
                          </p>
                        )}
                      </div>
                    </div>
                   
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="genre">Genre</Label>
                        <Input
                          id="genre"
                          placeholder="Romance, Drama"
                          value={formData.genre}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              genre: e.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="year">Release Year</Label>
                        <Input
                          id="year"
                          type="number"
                          placeholder="2004"
                          value={formData.releaseYear}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              releaseYear: e.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="plot">Plot Summary</Label>
                      <Textarea
                        id="plot"
                        placeholder="Brief description..."
                        value={formData.plotSummary}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            plotSummary: e.target.value,
                          }))
                        }
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                    {isSeriesOrAnime && (
                      <div className="space-y-3">
                        <div>
                          <Label>Number of seasons</Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            placeholder="1"
                            value={
                              seasonEpisodeCounts.length === 0
                                ? ""
                                : String(seasonEpisodeCounts.length)
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                setSeasonEpisodeCounts([]);
                                return;
                              }
                              const n = parseInt(raw, 10);
                              if (!Number.isNaN(n) && n >= 1 && n <= 20) {
                                setSeasonEpisodeCounts((prev) => {
                                  const next = prev.slice(0, n);
                                  while (next.length < n)
                                    next.push(next.length === 0 ? 0 : 1);
                                  return next;
                                });
                              }
                            }}
                            className="mt-1 w-24"
                          />
                        </div>
                        {seasonEpisodeCounts.length === 0 ||
                        seasonEpisodeCounts.length === 1 ? (
                          <div>
                            <Label htmlFor="episodes">
                              Number of episodes *
                            </Label>
                            <Input
                              id="episodes"
                              type="number"
                              min={1}
                              placeholder="e.g. 10"
                              value={
                                (seasonEpisodeCounts[0] ?? totalEpisodes) || ""
                              }
                              onChange={(e) => {
                                const v = Math.max(
                                  0,
                                  parseInt(e.target.value, 10) || 0,
                                );
                                setSeasonEpisodeCounts([v]);
                                setTotalEpisodes(v);
                              }}
                              className="mt-1 w-32"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Used for the emotional journey (Ep 1, Ep 2, …).
                            </p>
                          </div>
                        ) : (
                          <div className="">
                            <Label>Episodes per season *</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 mt-3">
                              {seasonEpisodeCounts.map((count, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2"
                                >
                                  <span className="text-sm text-muted-foreground w-20">
                                    Season {i + 1}:
                                  </span>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={count || ""}
                                    onChange={(e) => {
                                      const v = Math.max(
                                        0,
                                        parseInt(e.target.value, 10) || 0,
                                      );
                                      setSeasonEpisodeCounts((prev) => {
                                        const next = [...prev];
                                        next[i] = v;
                                        return next;
                                      });
                                    }}
                                    className="w-20"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    episodes
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground ">
                              Total: {totalEpisodesDerived} episodes.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {step === 1 && (
                    <div className="mt-6 flex justify-end">
                      <Button onClick={goNext} className="gap-2">
                        Next <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </motion.section>
              )}

              {/* Section 2: Rating + Why + Time period (appears after step 1 complete) */}
              {step > 1 && (
                <motion.section
                  ref={(el) => {
                    sectionRefs.current[1] = el;
                  }}
                  layout
                  transition={{ type: "spring", damping: 25 }}
                  className={`elevated-card p-4 md:p-6 border-2 border-primary/5 rounded-2xl ${sectionTransitionClass} ${sectionBlur(1)}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-lg font-semibold">
                      Why you love it
                    </h2>
                    {step > 2 && (
                      <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Your Rating</Label>
                        <span className="text-xl font-display font-bold gradient-text">
                          {formData.rating}/10
                        </span>
                      </div>
                      <Slider
                        value={[formData.rating]}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, rating: v[0] }))
                        }
                        max={10}
                        min={1}
                        step={0.5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="why">Why I Love This *</Label>
                      <Textarea
                        id="why"
                        placeholder="What makes this special to you?"
                        value={formData.whyILike}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            whyILike: e.target.value,
                          }))
                        }
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="period">Time Period of Your Life</Label>
                      <Input
                        id="period"
                        placeholder="e.g., College Years, Summer 2023"
                        value={formData.timePeriod}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            timePeriod: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {step === 2 && (
                    <div className="mt-6 flex justify-between">
                      <Button variant="outline" onClick={goBack}>
                        Back
                      </Button>
                      <Button onClick={goNext} className="gap-2">
                        Next <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </motion.section>
              )}

              {/* Section 3: Emotional journey (only for movies, series, anime, songs) */}
              {step > 2 && hasEmotionalJourney && (
                <motion.section
                  ref={(el) => {
                    sectionRefs.current[2] = el;
                  }}
                  layout
                  transition={{ type: "spring", damping: 25 }}
                  className={`elevated-card p-4 md:p-6 border-2 border-primary/5 rounded-2xl ${sectionTransitionClass} ${sectionBlur(2)}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    {step > 3 && (
                      <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                  </div>
                  {isSeriesOrAnime ? (
                    <>
                      {totalEpisodesDerived > 0 ? (
                        <EmotionalJourneyEditor
                          categoryId={selectedCategory}
                          totalDurationSeconds={
                            episodeDurations[selectedEpisodeIndex] ?? 0
                          }
                          onTotalDurationSecondsChange={(sec) => {
                            setEpisodeDurations((prev) => {
                              const next = [...prev];
                              next[selectedEpisodeIndex] = sec;
                              return next;
                            });
                          }}
                          segments={
                            episodeSegments[selectedEpisodeIndex] ?? []
                          }
                          onSegmentsChange={(seg) => {
                            setEpisodeSegments((prev) => {
                              const next = prev.map((a, j) =>
                                j === selectedEpisodeIndex ? seg : a,
                              );
                              return next;
                            });
                          }}
                        >
                          <p className="text-sm text-muted-foreground mb-3">
                            Select an episode, set its duration (min/sec), then
                            build the emotional journey for that episode like
                            you would for a movie.
                          </p>
                          <div className="space-y-3 mb-4">
                            {seasonEpisodeCounts.length <= 1 ? (
                              <div className="flex flex-wrap gap-2">
                                {Array.from(
                                  { length: totalEpisodesDerived },
                                  (_, i) => (
                                    <Button
                                      key={i}
                                      type="button"
                                      variant={
                                        selectedEpisodeIndex === i
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() => setSelectedEpisodeIndex(i)}
                                    >
                                      Ep {i + 1}
                                    </Button>
                                  ),
                                )}
                              </div>
                            ) : (
                              (() => {
                                let flatIndex = 0;
                                return seasonEpisodeCounts.map((count, s) => {
                                  const start = flatIndex;
                                  flatIndex += count;
                                  if (count <= 0) return null;
                                  return (
                                    <div key={s}>
                                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                                        Season {s + 1}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {Array.from(
                                          { length: count },
                                          (_, e) => {
                                            const i = start + e;
                                            return (
                                              <Button
                                                key={i}
                                                type="button"
                                                variant={
                                                  selectedEpisodeIndex === i
                                                    ? "default"
                                                    : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                  setSelectedEpisodeIndex(i)
                                                }
                                              >
                                                E{e + 1}
                                              </Button>
                                            );
                                          },
                                        )}
                                      </div>
                                    </div>
                                  );
                                });
                              })()
                            )}
                          </div>
                        </EmotionalJourneyEditor>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Enter the number of seasons and episodes in the Basics
                          section first, then you can add an emotional journey
                          per episode here.
                        </p>
                      )}
                    </>
                  ) : (
                    <EmotionalJourneyEditor
                      categoryId={selectedCategory}
                      totalDurationSeconds={totalDurationSeconds}
                      onTotalDurationSecondsChange={setTotalDurationSeconds}
                      segments={emotionalSegments}
                      onSegmentsChange={setEmotionalSegments}
                    />
                  )}
                  {step === 3 && (
                    <div className="mt-6 flex justify-between">
                      <Button variant="outline" onClick={goBack}>
                        Back
                      </Button>
                      <Button onClick={goNext} className="gap-2">
                        Next <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </motion.section>
              )}

              {/* Section 4: Moods + Times + Tags + Submit */}
              {step > (hasEmotionalJourney ? 3 : 2) && (
                <motion.section
                  ref={(el) => {
                    sectionRefs.current[hasEmotionalJourney ? 3 : 2] = el;
                  }}
                  layout
                  transition={{ type: "spring", damping: 25 }}
                  className={`elevated-card p-4 md:p-6 border-2 border-primary/5 rounded-2xl ${sectionTransitionClass} ${sectionBlur(hasEmotionalJourney ? 3 : 2)}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-lg font-semibold">
                      Moods & tags
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Mood Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {moodOptions.map((mood) => (
                          <Button
                            key={mood.id}
                            variant={
                              selectedMoods.includes(mood.id)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => toggleMood(mood.id)}
                            className="gap-1"
                          >
                            {mood.emoji} {mood.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block">
                        Best Time to Experience
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {timeOptions.map((time) => (
                          <Button
                            key={time.id}
                            variant={
                              recommendedTimes.includes(time.id)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => toggleTime(time.id)}
                          >
                            {time.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Custom Tags
                      </Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add a tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addTag())
                          }
                        />
                        <Button onClick={addTag} variant="outline" size="icon">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-sm"
                            >
                              {t}
                              <button
                                type="button"
                                onClick={() => removeTag(t)}
                                className="hover:opacity-80"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {step === (hasEmotionalJourney ? 4 : 3) && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
                      <Button variant="outline" onClick={goBack}>
                        Back
                      </Button>
                      <Button
                        variant="gradient"
                        className="gap-2"
                        onClick={handleSubmit}
                        disabled={!formData.title || !formData.whyILike}
                      >
                        <Sparkles className="w-5 h-5" />
                        Add to Favorites
                      </Button>
                    </div>
                  )}
                </motion.section>
              )}
            </div>

            {/* Right: Sticky preview */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-4">
                <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-sm overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 border-b border-white/5">
                    <p>Live preview</p>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalSteps }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setStep(i + 1)}
                          className={`h-4 rounded-full transition-all duration-300 ${
                            i + 1 === step
                              ? "w-8 bg-primary"
                              : i + 1 < step
                                ? "w-4 bg-primary/60"
                                : "w-4 bg-gray-500"
                          }`}
                          aria-label={`Go to step ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted border border-white/5 mb-4">
                      {formData.image ? (
                        <img
                          src={formData.image}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <Upload className="w-12 h-12 mb-2 opacity-50" />
                          <span className="text-sm">Cover image</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-lg truncate">
                      {formData.title || "Your title"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 text-secondary fill-secondary/50" />
                      <span className="font-medium text-foreground">
                        {formData.rating}/10
                      </span>
                      {formData.genre && (
                        <span>· {formData.genre.split(",")[0]}</span>
                      )}
                    </div>
                    {formData.whyILike && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {formData.whyILike}
                      </p>
                    )}
                    {(selectedMoods.length > 0 || tags.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {selectedMoods.slice(0, 3).map((m) => {
                          const opt = moodOptions.find((o) => o.id === m);
                          return (
                            <span
                              key={m}
                              className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                            >
                              {opt?.emoji} {opt?.name}
                            </span>
                          );
                        })}
                        {tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    {(() => {
                      const segs = isSeriesOrAnime
                        ? (episodeSegments[selectedEpisodeIndex] ?? [])
                        : emotionalSegments;
                      const totalSec = isSeriesOrAnime
                        ? (episodeDurations[selectedEpisodeIndex] ?? 0) ||
                          Math.max(1, ...(segs.map((s) => s.endSeconds) || [0]))
                        : totalDurationSeconds ||
                          Math.max(
                            1,
                            ...emotionalSegments.map((s) => s.endSeconds),
                          );
                      if (segs.length < 1) return null;
                      const sorted = [...segs].sort(
                        (a, b) => a.startSeconds - b.startSeconds,
                      );
                      const episodeLabel =
                        isSeriesOrAnime && totalEpisodesDerived > 0
                          ? seasonEpisodeCounts.length > 1
                            ? (() => {
                                let idx = 0;
                                for (
                                  let s = 0;
                                  s < seasonEpisodeCounts.length;
                                  s++
                                ) {
                                  if (
                                    selectedEpisodeIndex <
                                    idx + seasonEpisodeCounts[s]
                                  )
                                    return `S${s + 1} E${selectedEpisodeIndex - idx + 1}`;
                                  idx += seasonEpisodeCounts[s];
                                }
                                return `Ep ${selectedEpisodeIndex + 1}`;
                              })()
                            : `Ep ${selectedEpisodeIndex + 1}`
                          : null;
                      return (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-xs text-muted-foreground mb-1">
                            Emotional journey
                            {episodeLabel && (
                              <span className="ml-1">({episodeLabel})</span>
                            )}
                          </p>
                          <div className="h-12 rounded-lg bg-muted/50 flex items-end overflow-hidden">
                            {sorted.map((s) => {
                              const widthPct =
                                totalSec > 0
                                  ? ((s.endSeconds - s.startSeconds) /
                                      totalSec) *
                                    100
                                  : 0;
                              const fill =
                                getEmotionFill(s.emotionColor) ||
                                "hsl(var(--primary))";
                              return (
                                <div
                                  key={s.id}
                                  className="rounded-t min-w-[2px] shrink-0"
                                  style={{
                                    width: `${widthPct}%`,
                                    height: `${(s.intensity / 10) * 100}%`,
                                    backgroundColor: fill,
                                    opacity: 0.8,
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
