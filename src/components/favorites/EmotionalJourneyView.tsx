"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EmotionalCurvePoint, EmotionalSegment } from "@/types/wishbook";
import { EMOTION_COLOR_PRESETS, getEmotionFill } from "@/data/emotionColors";
import { VideoPlayer } from "@/components/common/VideoPlayer";
import { TrendingUp, MapPin, Video, Play, Maximize2, Zap, ChevronLeft, ChevronRight as ChevronRightIcon, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GRAPH_HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };
const Y_MAX = 10;
const Y_MIN = 0;

function formatTime(seconds: number, useSeconds: boolean): string {
  const totalSec = Math.max(0, Math.round(seconds));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (!useSeconds) {
    return `${m} min`;
  }
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  const finalResult = `${m}min${s}s`;
  return finalResult;
}

function buildPathNew(
  points: EmotionalCurvePoint[],
  totalSeconds: number,
  width: number,
  height: number,
): string {
  if (points.length < 2 || totalSeconds <= 0) return "";
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;
  const scaleX = chartW / totalSeconds;
  const scaleY = chartH / (Y_MAX - Y_MIN);
  const toSvg = (p: EmotionalCurvePoint) => ({
    x: PADDING.left + p.x * scaleX,
    y: PADDING.top + (Y_MAX - p.y) * scaleY,
  });
  const pts = points.map(toSvg);
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  return d;
}

interface EmotionalJourneyViewProps {
  categoryId?: string;
  totalDurationSeconds?: number;
  /** For series: duration in seconds per episode. When set with episodeSegments, shows episode tabs. */
  episodeDurations?: number[];
  /** For series: segments per episode. When set with episodeDurations, shows episode tabs. */
  episodeSegments?: EmotionalSegment[][];
  /** For series: episodes per season, e.g. [3, 4]. When length > 1, tabs are grouped by season (S1 E1, S2 E1, …). */
  seasonEpisodeCounts?: number[];
  /** Legacy: points on a curve (x in seconds, y 0-10) */
  curvePoints?: EmotionalCurvePoint[];
  /** New: time-range segments (video-editor style bars). When set, drawn as bars. */
  emotionalSegments?: EmotionalSegment[];
  momentPins?: {
    id: string;
    positionPercent: number;
    note: string;
    image?: string;
  }[];
  className?: string;
  xAxisInSeconds?: boolean;
}

export function EmotionalJourneyView({
  totalDurationSeconds = 0,
  episodeDurations = [],
  episodeSegments = [],
  seasonEpisodeCounts = [],
  curvePoints = [],
  emotionalSegments = [],
  momentPins = [],
  className = "",
  xAxisInSeconds = true,
}: EmotionalJourneyViewProps) {
  const [graphWidth, setGraphWidth] = useState(400);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | "all">(
    "all",
  );
  const [fullscreenMedia, setFullscreenMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isSeriesMode =
    episodeDurations.length > 0 &&
    episodeSegments.length === episodeDurations.length &&
    episodeSegments.some((arr) => arr.length > 0);

  const episodeIndex = isSeriesMode
    ? Math.min(selectedEpisodeIndex, Math.max(0, episodeDurations.length - 1))
    : 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === "number" && w > 0) setGraphWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Per-episode: use selected episode's duration and segments
  const totalSecForSeries =
    isSeriesMode && episodeDurations[episodeIndex] != null
      ? episodeDurations[episodeIndex] || 1
      : 0;
  const segmentsForSeries = isSeriesMode
    ? (episodeSegments[episodeIndex] ?? [])
    : [];

  const totalDuration = isSeriesMode ? totalSecForSeries : totalDurationSeconds;
  const segmentsSingle = isSeriesMode ? segmentsForSeries : emotionalSegments;

  const useSegments = isSeriesMode
    ? segmentsSingle.length > 0 && totalDuration > 0
    : emotionalSegments.length > 0 && totalDurationSeconds > 0;
  const formatAxisTime = (t: number) => formatTime(t, xAxisInSeconds);
  const isNewFormat =
    !isSeriesMode &&
    !useSegments &&
    totalDurationSeconds > 0 &&
    curvePoints.length >= 2 &&
    curvePoints.every((p) => "id" in p);
  const totalSec = totalDuration || 1;
  const width = graphWidth;
  const height = GRAPH_HEIGHT;
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;
  const scaleX = chartW / (useSegments || isNewFormat ? totalSec : 100);
  const scaleY = chartH / (Y_MAX - Y_MIN);
  const yMax = Y_MAX;
  const yMin = Y_MIN;

  const sortedPoints = useMemo(
    () => [...curvePoints].sort((a, b) => a.x - b.x),
    [curvePoints],
  );
  const sortedSegments = useMemo(
    () => [...segmentsSingle].sort((a, b) => a.startSeconds - b.startSeconds),
    [segmentsSingle],
  );

  // On load / when segments change: default to first segment if available
  useEffect(() => {
    if (!useSegments || sortedSegments.length === 0) {
      setSelectedSegmentId("all");
      return;
    }
    setSelectedSegmentId((current) =>
      current && current !== "all"
        ? current
        : sortedSegments[0]?.id ?? "all",
    );
  }, [useSegments, sortedSegments]);

  const svgX = (x: number) => PADDING.left + x * scaleX;
  const svgY = (y: number) => PADDING.top + (yMax - y) * scaleY;

  const pathD = useSegments
    ? (() => {
      if (sortedSegments.length === 0) return "";
      let d = `M ${svgX(sortedSegments[0].startSeconds)} ${svgY(sortedSegments[0].intensity)}`;
      for (const s of sortedSegments) {
        d += ` L ${svgX(s.endSeconds)} ${svgY(s.intensity)}`;
      }
      return d;
    })()
    : isNewFormat
      ? buildPathNew(sortedPoints, totalSec, width, height)
      : sortedPoints.length >= 2
        ? (() => {
          let d = `M ${svgX(sortedPoints[0].x)} ${svgY(sortedPoints[0].y)}`;
          for (let i = 1; i < sortedPoints.length; i++)
            d += ` L ${svgX(sortedPoints[i].x)} ${svgY(sortedPoints[i].y)}`;
          return d;
        })()
        : "";

  const pointsWithNotes = sortedPoints.filter((p) => p.note || p.image);
  const segmentsWithNotes = sortedSegments.filter(
    (s) => s.note || s.image || s.video,
  );

  return (
    <div className={className} ref={containerRef}>
      {/* Glassy Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <Zap className="w-6 h-6 text-blue-400 fill-blue-400/20" />
        </div>
        <h2 className="text-xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 uppercase font-display text-left">
          Emotional Journey
        </h2>
      </div>

      {isSeriesMode && (
        <div className="space-y-4 mb-6">
          {seasonEpisodeCounts.length > 1 ? (
            <Tabs
              value={(() => {
                let currentSeason = 0;
                let episodesSum = 0;
                for (let i = 0; i < seasonEpisodeCounts.length; i++) {
                  episodesSum += seasonEpisodeCounts[i];
                  if (selectedEpisodeIndex < episodesSum) {
                    currentSeason = i;
                    break;
                  }
                }
                return currentSeason.toString();
              })()}
              className="w-full"
              onValueChange={(val) => {
                const seasonIdx = parseInt(val, 10);
                let startIdx = 0;
                for (let i = 0; i < seasonIdx; i++) {
                  startIdx += seasonEpisodeCounts[i];
                }
                setSelectedEpisodeIndex(startIdx);
              }}
            >
              <TabsList className="bg-[#12141c]/60 border border-white/5 p-1 h-auto flex-wrap justify-start gap-1 mb-4">
                {seasonEpisodeCounts.map((count, s) => {
                  if (count <= 0) return null;
                  return (
                    <TabsTrigger
                      key={s}
                      value={s.toString()}
                      className="px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/50 border border-transparent"
                    >
                      Season {s + 1}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {seasonEpisodeCounts.map((count, s) => {
                let startIdx = 0;
                for (let i = 0; i < s; i++) startIdx += seasonEpisodeCounts[i];
                const isSelectedSeason = (() => {
                  let episodesSum = 0;
                  for (let i = 0; i < seasonEpisodeCounts.length; i++) {
                    episodesSum += seasonEpisodeCounts[i];
                    if (selectedEpisodeIndex < episodesSum) return i === s;
                  }
                  return false;
                })();

                if (!isSelectedSeason) return null;

                return (
                  <div key={s} className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: count }, (_, e) => {
                        const i = startIdx + e;
                        if (i >= episodeDurations.length) return null;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedEpisodeIndex(i)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border ${episodeIndex === i
                              ? "bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                              : "bg-[#1a1c26] border-white/5 text-gray-500 hover:text-gray-300"
                              }`}
                          >
                            Ep {e + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </Tabs>
          ) : (
            <div className="flex flex-wrap gap-2">
              {episodeDurations.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedEpisodeIndex(i)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border ${episodeIndex === i
                    ? "bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                    : "bg-[#1a1c26] border-white/5 text-gray-500 hover:text-gray-300"
                    }`}
                >
                  Ep {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className="relative w-full overflow-hidden rounded-2xl bg-[#08090d]/80 border border-white/5 backdrop-blur-xl shadow-2xl p-6"
        style={{ height: GRAPH_HEIGHT }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/10" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/10" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/10" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/10" />

        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full"
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="60%" stopColor="currentColor" stopOpacity="0.4" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
            <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient
              id="curveGradientView"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#4a5568"
                stopOpacity={1}
              />
              <stop
                offset="100%"
                stopColor="#1a202c"
                stopOpacity={1}
              />
            </linearGradient>

            {EMOTION_COLOR_PRESETS.map((preset) => (
              <linearGradient
                key={`grad-view-${preset.id}`}
                id={`grad-view-${preset.id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={preset.color} stopOpacity={1} />
                <stop
                  offset="100%"
                  stopColor={preset.colorSecondary || preset.color}
                  stopOpacity={1}
                />
              </linearGradient>
            ))}
          </defs>
          {/* Y grid */}
          {(useSegments || isNewFormat
            ? [0, 2, 4, 6, 8, 10]
            : [0, 25, 50, 75, 100]
          ).map((v) => (
            <line
              key={`h-${v}`}
              x1={PADDING.left}
              y1={svgY(v)}
              x2={width - PADDING.right}
              y2={svgY(v)}
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
          ))}
          {useSegments &&
            [...sortedSegments]
              .sort((a, b) => (a.id === selectedSegmentId ? 1 : b.id === selectedSegmentId ? -1 : 0))
              .map((seg) => {
                const x1 = svgX(seg.startSeconds);
                const x2 = svgX(seg.endSeconds);
                const yTop = svgY(seg.intensity);
                const yBottom = height - PADDING.bottom;
                const fillColor = seg.emotionColor
                  ? `url(#grad-view-${seg.emotionColor})`
                  : "url(#curveGradientView)";
                const isSelected = selectedSegmentId === seg.id;
                const radius = Math.min(8, (x2 - x1) / 2);
                const path = `
                  M ${x1},${yBottom}
                  V ${yTop + radius}
                  Q ${x1},${yTop} ${x1 + radius},${yTop}
                  H ${x2 - radius}
                  Q ${x2},${yTop} ${x2},${yTop + radius}
                  V ${yBottom}
                  Z
                `.replace(/\s+/g, " ").trim();

                const strokeColor = isSelected
                  ? "#ffffff9a"
                  : (seg.emotionColor
                    ? (EMOTION_COLOR_PRESETS.find(p => p.id === seg.emotionColor)?.colorSecondary || "hsl(var(--primary))")
                    : "#1a202c");

                return (
                  <path
                    key={seg.id}
                    d={path}
                    fill={fillColor}
                    fillOpacity={1.0}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3.0 : 3.0}
                    strokeOpacity={isSelected ? 1.0 : 0.7}
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedSegmentId(seg.id)}
                  />
                );
              })}
          {pathD && !useSegments && (
            <>
              <path
                d={`${pathD} L ${svgX(isNewFormat ? totalSec : 100)} ${height - PADDING.bottom
                  } L ${svgX(0)} ${height - PADDING.bottom} Z`}
                fill="url(#curveGradientView)"
                fillOpacity={0.2}
              />
              <path
                d={pathD}
                fill="none"
                stroke="url(#curveGradientView)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
          {!useSegments &&
            sortedPoints.map((pt, i) => (
              <circle
                key={pt.id ?? i}
                cx={svgX(pt.x)}
                cy={svgY(pt.y)}
                r={6}
                fill="hsl(var(--background))"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
              />
            ))}
          {!useSegments &&
            !isNewFormat &&
            momentPins.map((pin) => (
              <g key={pin.id}>
                <line
                  x1={svgX(pin.positionPercent)}
                  y1={svgY(yMax)}
                  x2={svgX(pin.positionPercent)}
                  y2={height - PADDING.bottom}
                  stroke="hsl(var(--secondary))"
                  strokeWidth={1.2}
                  strokeDasharray="4 3"
                  opacity={0.7}
                />
                <circle
                  cx={svgX(pin.positionPercent)}
                  cy={PADDING.top - 3}
                  r={4}
                  fill="hsl(var(--secondary))"
                />
              </g>
            ))}
        </svg>

        {/* Emotion Legend matching image */}

      </div>

      <div
        className="text-[10px] text-muted-foreground flex justify-between px-1 mt-1"
        style={{
          paddingLeft: PADDING.left + 4,
          paddingRight: PADDING.right + 4,
        }}
      >
        <span>0</span>
        {useSegments || isNewFormat ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i}>{formatAxisTime((totalSec * i) / 6)}</span>
            ))}
            <span>{formatAxisTime(totalSec)}</span>
          </>
        ) : (
          <>
            <span>Start</span>
            <span>End</span>
          </>
        )}
      </div>

      <div className="flex flex-wrap justify-center items-center gap-4 px-6 mt-6">
        {EMOTION_COLOR_PRESETS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <span
              className="w-3 h-3 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
              style={{
                background: `linear-gradient(to bottom, ${item.color}, ${item.colorSecondary || item.color})`,
              }}
            />
            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
      {
        (segmentsWithNotes.length > 0 ||
          pointsWithNotes.length > 0 ||
          momentPins.length > 0) && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-t border-white/5 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  Moments
                </h3>
              </div>
              {useSegments && segmentsWithNotes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedSegmentId("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${selectedSegmentId === "all"
                    ? "bg-secondary/20 border-secondary/50 text-secondary"
                    : "bg-[#1a1c26] border-white/5 text-gray-500 hover:text-gray-300"
                    }`}
                >
                  Show All
                </button>
              )}
            </div>

            <ul className="">
              {useSegments
                ? (() => {
                  const visibleSegments =
                    selectedSegmentId === "all"
                      ? segmentsWithNotes
                      : segmentsWithNotes.filter(
                        (s) => s.id === selectedSegmentId,
                      );

                  if (visibleSegments.length === 0) {
                    return (
                      <li className="col-span-full py-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                        <p className="text-sm text-muted-foreground italic">
                          No notes or media found for this segment.
                        </p>
                      </li>
                    );
                  }

                  return visibleSegments.map((s) => (
                    <li
                      key={s.id}
                      className="group flex flex-col md:flex-row items-center gap-4 p-3 rounded-2xl bg-[#0d0e14] border border-white/5 hover:border-blue-500/30 transition-all duration-300 shadow-lg"
                    >
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        {s.image && (
                          <div
                            onClick={() => setFullscreenMedia({ type: "image", url: s.image! })}
                            className="relative w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5 group-hover:scale-[1.02] transition-transform cursor-pointer"
                          >
                            <img
                              src={s.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-black text-blue-400">
                              {formatAxisTime(s.startSeconds)}
                            </div>
                          </div>
                        )}
                        {s.video && (
                          <div
                            onClick={() => setFullscreenMedia({ type: "video", url: s.video! })}
                            className="relative w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5 group-hover:scale-[1.02] transition-transform cursor-pointer"
                          >
                            <div className="w-full h-full flex items-center justify-center bg-blue-500/10">
                              <Video className="w-8 h-8 text-blue-400/60" />
                            </div>
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-black text-blue-400">
                              {formatAxisTime(s.startSeconds)}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center group-hover:bg-blue-600/10 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-blue-600/80 flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                <Play className="w-5 h-5 fill-current" />
                              </div>
                            </div>
                          </div>
                        )}
                        {!s.image && !s.video && (
                          <div className="relative w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5 flex flex-shrink-0 items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-gray-800" />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-black text-blue-400">
                              {formatAxisTime(s.startSeconds)}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: getEmotionFill(s.emotionColor),
                            }}
                          />
                          <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                            {s.emotionColor} Intensity {s.intensity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 font-medium leading-relaxed line-clamp-2">
                          {s.note || "No description provided."}
                        </p>
                      </div>
                    </li>
                  ));
                })()
                : sortedPoints
                  .filter((p) => p.note || p.image)
                  .map((p, i) => (
                    <li
                      key={p.id ?? i}
                      className="group flex flex-col md:flex-row items-center gap-4 p-3 rounded-2xl bg-[#0d0e14] border border-white/5 hover:border-blue-500/30 transition-all duration-300 shadow-lg"
                    >
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        {p.image && (
                          <div
                            onClick={() => setFullscreenMedia({ type: "image", url: p.image! })}
                            className="relative w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5 cursor-pointer hover:scale-[1.02] transition-transform"
                          >
                            <img
                              src={p.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-black text-blue-400">
                              {formatTime(p.x, xAxisInSeconds)}
                            </div>
                          </div>
                        )}
                        {!p.image && (
                          <div className="relative w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-gray-800" />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-black text-blue-400">
                              {formatTime(p.x, xAxisInSeconds)}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1 text-center md:text-left">
                        <p className="text-xs text-gray-300 font-medium leading-relaxed line-clamp-2">
                          {p.note || "Point observation."}
                        </p>
                      </div>
                    </li>
                  ))}
            </ul>
          </div>
        )
      }
      {fullscreenMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setFullscreenMedia(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenMedia(null)}
            className="absolute top-6 right-6 z-10 rounded-full p-2 bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreenMedia.type === "image" ? (
              <img
                src={fullscreenMedia.url}
                alt=""
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
              />
            ) : (
              <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <VideoPlayer
                  src={fullscreenMedia.url}
                  autoPlayInView={true}
                  mutedByDefault={false}
                  loop={false}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div >
  );
}
