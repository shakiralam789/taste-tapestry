"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { EmotionalCurvePoint, EmotionalSegment } from "@/types/wishbook";
import { EMOTION_COLOR_PRESETS, getEmotionFill } from "@/data/emotionColors";
import { VideoPlayer } from "@/components/common/VideoPlayer";
import { TrendingUp, MapPin, Video, Play, Maximize2, Zap, ChevronLeft, ChevronRight as ChevronRightIcon, X, ZoomIn, ZoomOut, RotateCcw, HelpCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

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
  /** For series: segments per episode. When set with episodeSegments, shows episode tabs. */
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

/** Isolated graph + scrollbar so only this subtree re-renders during scroll (fixes lag). */
const EmotionalJourneyGraphWithScroll = React.memo(function EmotionalJourneyGraphWithScroll({
  totalSec,
  sortedSegments,
  useSegments,
  graphWidth,
  selectedSegmentId,
  setSelectedSegmentId,
  sortedPoints,
  isNewFormat,
  momentPins,
  xAxisInSeconds,
}: {
  totalSec: number;
  sortedSegments: EmotionalSegment[];
  useSegments: boolean;
  graphWidth: number;
  selectedSegmentId: string | "all";
  setSelectedSegmentId: (id: string | "all") => void;
  sortedPoints: EmotionalCurvePoint[];
  isNewFormat: boolean;
  momentPins: { id: string; positionPercent: number; note: string; image?: string }[];
  xAxisInSeconds: boolean;
}) {
  const [visibleWindowStart, setVisibleWindowStart] = useState(0);
  const [visibleWindowEnd, setVisibleWindowEnd] = useState(0);
  const scrollbarTrackRef = useRef<HTMLDivElement>(null);
  const scrollbarThumbRef = useRef<HTMLDivElement>(null);
  const graphPanRef = useRef<HTMLDivElement>(null);
  const scrollbarDragRef = useRef<{ startClientX: number; startVisibleWindowStart: number } | null>(null);
  const scrollPendingRef = useRef<{ start: number; end: number } | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const formatAxisTime = useCallback((t: number) => formatTime(t, xAxisInSeconds), [xAxisInSeconds]);

  const width = graphWidth;
  const height = GRAPH_HEIGHT;
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;
  const yMax = Y_MAX;

  useEffect(() => {
    setVisibleWindowStart(0);
    setVisibleWindowEnd(totalSec);
  }, [totalSec]);

  const windowSpan = useSegments
    ? visibleWindowEnd > visibleWindowStart
      ? Math.max(1, visibleWindowEnd - visibleWindowStart)
      : totalSec
    : totalSec;
  const scaleX = chartW / (useSegments ? windowSpan : (isNewFormat ? totalSec : 100));
  const scaleY = chartH / (Y_MAX - Y_MIN);
  // Include left padding so rightmost point (PADDING.left + totalSec * scaleX) is inside the SVG
  const fullTimelineWidth = useSegments ? PADDING.left + chartW * totalSec / windowSpan : width;

  const pathD = useMemo(() => {
    const svgXSeg = (x: number) => PADDING.left + x * scaleX;
    const svgXCurve = (x: number) => PADDING.left + (x - visibleWindowStart) * scaleX;
    const svgY = (y: number) => PADDING.top + (yMax - y) * scaleY;
    if (useSegments) {
      if (sortedSegments.length === 0) return "";
      let d = `M ${svgXSeg(sortedSegments[0].startSeconds)} ${svgY(sortedSegments[0].intensity)}`;
      for (const s of sortedSegments) {
        d += ` L ${svgXSeg(s.endSeconds)} ${svgY(s.intensity)}`;
      }
      return d;
    }
    if (isNewFormat) return buildPathNew(sortedPoints, totalSec, width, height);
    if (sortedPoints.length < 2) return "";
    let d = `M ${svgXCurve(sortedPoints[0].x)} ${svgY(sortedPoints[0].y)}`;
    for (let i = 1; i < sortedPoints.length; i++)
      d += ` L ${svgXCurve(sortedPoints[i].x)} ${svgY(sortedPoints[i].y)}`;
    return d;
  }, [useSegments, sortedSegments, sortedPoints, isNewFormat, scaleX, scaleY, visibleWindowStart, totalSec, width, height, yMax]);

  const svgX = useCallback((xOrTime: number) =>
    useSegments
      ? PADDING.left + xOrTime * scaleX
      : PADDING.left + (xOrTime - visibleWindowStart) * scaleX,
  [useSegments, scaleX, visibleWindowStart]);
  const svgY = useCallback((y: number) => PADDING.top + (yMax - y) * scaleY, [scaleY, yMax]);

  const zoomIn = useCallback(() => {
    if (!useSegments || totalSec <= 0) return;
    const center = (visibleWindowStart + visibleWindowEnd) / 2;
    const newSpan = Math.max(5, windowSpan * 0.55);
    const start = Math.max(0, center - newSpan / 2);
    const end = Math.min(totalSec, center + newSpan / 2);
    setVisibleWindowStart(start);
    setVisibleWindowEnd(end);
  }, [useSegments, totalSec, visibleWindowStart, visibleWindowEnd, windowSpan]);

  const zoomOut = useCallback(() => {
    if (!useSegments || totalSec <= 0) return;
    const center = (visibleWindowStart + visibleWindowEnd) / 2;
    const newSpan = Math.min(totalSec, windowSpan * 1.5);
    let start = Math.max(0, center - newSpan / 2);
    let end = Math.min(totalSec, center + newSpan / 2);
    if (end - start < newSpan) {
      if (start === 0) end = Math.min(totalSec, newSpan);
      else if (end === totalSec) start = Math.max(0, totalSec - newSpan);
    }
    setVisibleWindowStart(start);
    setVisibleWindowEnd(end);
  }, [useSegments, totalSec, visibleWindowStart, visibleWindowEnd, windowSpan]);

  const zoomReset = useCallback(() => {
    setVisibleWindowStart(0);
    setVisibleWindowEnd(totalSec);
  }, [totalSec]);

  const handleScrollbarTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== scrollbarTrackRef.current || !useSegments) return;
      const track = scrollbarTrackRef.current;
      if (!track || windowSpan >= totalSec - 0.5) return;
      const rect = track.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const centerTime = fraction * totalSec;
      let start = centerTime - windowSpan / 2;
      let end = centerTime + windowSpan / 2;
      if (start < 0) {
        start = 0;
        end = windowSpan;
      }
      if (end > totalSec) {
        end = totalSec;
        start = totalSec - windowSpan;
      }
      setVisibleWindowStart(start);
      setVisibleWindowEnd(end);
    },
    [useSegments, windowSpan, totalSec],
  );

  const handleScrollbarThumbPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (!useSegments || windowSpan >= totalSec - 0.5) return;
      scrollbarDragRef.current = {
        startClientX: e.clientX,
        startVisibleWindowStart: visibleWindowStart,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [useSegments, windowSpan, totalSec, visibleWindowStart],
  );

  const handleScrollbarPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!scrollbarDragRef.current || !scrollbarTrackRef.current) return;
      const rect = scrollbarTrackRef.current.getBoundingClientRect();
      const deltaX = e.clientX - scrollbarDragRef.current.startClientX;
      const deltaTime = (deltaX / rect.width) * totalSec;
      let start = scrollbarDragRef.current.startVisibleWindowStart + deltaTime;
      let end = start + windowSpan;
      if (start < 0) {
        start = 0;
        end = windowSpan;
      }
      if (end > totalSec) {
        end = totalSec;
        start = totalSec - windowSpan;
      }
      scrollPendingRef.current = { start, end };
      if (scrollRafRef.current === null) {
        scrollRafRef.current = requestAnimationFrame(() => {
          scrollRafRef.current = null;
          const pending = scrollPendingRef.current;
          if (!pending) return;
          const thumb = scrollbarThumbRef.current;
          if (thumb) {
            thumb.style.left = `${(pending.start / totalSec) * 100}%`;
            thumb.style.width = `${((pending.end - pending.start) / totalSec) * 100}%`;
          }
          if (graphPanRef.current) {
            const pxPerSec = chartW / windowSpan;
            graphPanRef.current.style.transform = `translateX(${-pending.start * pxPerSec}px)`;
          }
        });
      }
    },
    [windowSpan, totalSec, chartW],
  );

  const handleScrollbarPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
    const pending = scrollPendingRef.current;
    if (pending) {
      setVisibleWindowStart(pending.start);
      setVisibleWindowEnd(pending.end);
      scrollPendingRef.current = null;
    }
    scrollbarDragRef.current = null;
  }, []);


  return (
    <>
      {useSegments && totalSec > 15 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">Zoom:</span>
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1" onClick={zoomIn} title="Zoom in">
            <ZoomIn className="w-3.5 h-3.5" /> In
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1" onClick={zoomOut} title="Zoom out">
            <ZoomOut className="w-3.5 h-3.5" /> Out
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 border" onClick={zoomReset} title="Reset view">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>
      )}
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-[#08090d]/80 border border-white/5 backdrop-blur-xl shadow-2xl p-6"
        style={{ height: GRAPH_HEIGHT }}
      >
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/10" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/10" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/10" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/10" />
        <div
          ref={graphPanRef}
          className="absolute inset-0 overflow-hidden"
          style={useSegments ? { width: fullTimelineWidth, maxWidth: fullTimelineWidth, transform: `translateX(${-visibleWindowStart * scaleX}px)` } : undefined}
        >
        <svg width={useSegments ? fullTimelineWidth : "100%"} height={height} viewBox={`0 0 ${useSegments ? fullTimelineWidth : width} ${height}`} preserveAspectRatio="none" className={useSegments ? "absolute top-0 left-0" : "absolute inset-0 w-full"}>
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
            <linearGradient id="curveGradientView" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a5568" stopOpacity={1} />
              <stop offset="100%" stopColor="#1a202c" stopOpacity={1} />
            </linearGradient>
            {EMOTION_COLOR_PRESETS.map((preset) => (
              <linearGradient key={`grad-view-${preset.id}`} id={`grad-view-${preset.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={preset.color} stopOpacity={1} />
                <stop offset="100%" stopColor={preset.colorSecondary || preset.color} stopOpacity={1} />
              </linearGradient>
            ))}
          </defs>
          {(useSegments || isNewFormat ? [0, 2, 4, 6, 8, 10] : [0, 25, 50, 75, 100]).map((v) => (
            <line key={`h-${v}`} x1={PADDING.left} y1={svgY(v)} x2={(useSegments ? fullTimelineWidth : width) - PADDING.right} y2={svgY(v)} stroke="hsl(var(--border))" strokeDasharray="4 4" strokeOpacity={0.4} />
          ))}
          {useSegments &&
            [...sortedSegments]
              .sort((a, b) => (a.id === selectedSegmentId ? 1 : b.id === selectedSegmentId ? -1 : 0))
              .map((seg) => {
                const x1 = svgX(seg.startSeconds);
                const x2 = svgX(seg.endSeconds);
                const yTop = svgY(seg.intensity);
                const yBottom = height - PADDING.bottom;
                const fillColor = seg.emotionColor ? `url(#grad-view-${seg.emotionColor})` : "url(#curveGradientView)";
                const isSelected = selectedSegmentId === seg.id;
                const radius = Math.min(8, (x2 - x1) / 2);
                const path = `M ${x1},${yBottom} V ${yTop + radius} Q ${x1},${yTop} ${x1 + radius},${yTop} H ${x2 - radius} Q ${x2},${yTop} ${x2},${yTop + radius} V ${yBottom} Z`.replace(/\s+/g, " ").trim();
                const strokeColor = isSelected ? "#ffffff9a" : (seg.emotionColor ? (EMOTION_COLOR_PRESETS.find(p => p.id === seg.emotionColor)?.colorSecondary || "hsl(var(--primary))") : "#1a202c");
                const hasContent = !!(seg.note || seg.image || seg.video);
                return (
                  <g key={seg.id}>
                    <path d={path} fill={fillColor} fillOpacity={1.0} stroke={strokeColor} strokeWidth={3} strokeOpacity={isSelected ? 1.0 : 0.7} className="cursor-pointer transition-all" onClick={() => setSelectedSegmentId(seg.id)} />
                    {hasContent && (
                      <g transform={`translate(${x1 + (x2 - x1) / 2}, ${yTop + (yBottom - yTop) / 2})`} pointerEvents="none">
                        <title>Moment with note or media</title>
                        <circle r={9} fill="hsl(var(--secondary))" fillOpacity={0.95} stroke="hsl(var(--background))" strokeWidth={1.5} />
                        <text textAnchor="middle" dominantBaseline="central" fill="hsl(var(--background))" fontSize={10} fontWeight="bold" fontFamily="system-ui, sans-serif">i</text>
                      </g>
                    )}
                  </g>
                );
              })}
          {pathD && !useSegments && (
            <>
              <path d={`${pathD} L ${svgX(isNewFormat ? totalSec : 100)} ${height - PADDING.bottom} L ${svgX(0)} ${height - PADDING.bottom} Z`} fill="url(#curveGradientView)" fillOpacity={0.2} />
              <path d={pathD} fill="none" stroke="url(#curveGradientView)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {!useSegments && sortedPoints.map((pt, i) => (
            <circle key={pt.id ?? i} cx={svgX(pt.x)} cy={svgY(pt.y)} r={6} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth={1.5} />
          ))}
          {!useSegments && !isNewFormat && momentPins.map((pin) => (
            <g key={pin.id}>
              <line x1={svgX(pin.positionPercent)} y1={svgY(yMax)} x2={svgX(pin.positionPercent)} y2={height - PADDING.bottom} stroke="hsl(var(--secondary))" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.7} />
              <circle cx={svgX(pin.positionPercent)} cy={PADDING.top - 3} r={4} fill="hsl(var(--secondary))" />
            </g>
          ))}
        </svg>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground flex justify-between px-1 mt-1" style={{ paddingLeft: PADDING.left + 4, paddingRight: PADDING.right + 4 }}>
        {useSegments ? (
          <>
            <span>{formatAxisTime(visibleWindowStart)}</span>
            {[1, 2, 3, 4, 5].map((i) => <span key={i}>{formatAxisTime(visibleWindowStart + (windowSpan * i) / 6)}</span>)}
            <span>{formatAxisTime(visibleWindowEnd)}</span>
          </>
        ) : isNewFormat ? (
          <>
            <span>0</span>
            {[1, 2, 3, 4, 5].map((i) => <span key={i}>{formatAxisTime((totalSec * i) / 6)}</span>)}
            <span>{formatAxisTime(totalSec)}</span>
          </>
        ) : (
          <>
            <span>Start</span>
            <span>End</span>
          </>
        )}
      </div>
      {useSegments && windowSpan < totalSec - 0.5 && (
        <div className="mt-2 flex items-center gap-2" onPointerMove={handleScrollbarPointerMove} onPointerUp={handleScrollbarPointerUp} onPointerLeave={handleScrollbarPointerUp} onPointerCancel={handleScrollbarPointerUp}>
          <div ref={scrollbarTrackRef} role="scrollbar" aria-label="Timeline position" className="relative h-5 flex-1 rounded-full bg-muted/80 border border-white/10 cursor-pointer touch-none" onClick={handleScrollbarTrackClick}>
            <div
              ref={scrollbarThumbRef}
              className="absolute top-0.5 bottom-0.5 rounded-full bg-primary/80 border border-primary hover:bg-primary transition-colors cursor-grab active:cursor-grabbing touch-none"
              style={{ left: `${(visibleWindowStart / totalSec) * 100}%`, width: `${(windowSpan / totalSec) * 100}%`, minWidth: 24 }}
              onPointerDown={handleScrollbarThumbPointerDown}
              onPointerMove={handleScrollbarPointerMove}
              onPointerUp={handleScrollbarPointerUp}
            />
          </div>
        </div>
      )}
    </>
  );
});

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
  // List filter: "all" = show all moments; segment id = show only that segment. Clicking a moment only updates graph highlight, not this.
  const [listSegmentFilter, setListSegmentFilter] = useState<string | "all">(
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

  // Prevent body scroll when fullscreen media is open
  useEffect(() => {
    if (fullscreenMedia) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreenMedia]);

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

  const sortedPoints = useMemo(
    () => [...curvePoints].sort((a, b) => a.x - b.x),
    [curvePoints],
  );
  const sortedSegments = useMemo(
    () => [...segmentsSingle].sort((a, b) => a.startSeconds - b.startSeconds),
    [segmentsSingle],
  );

  // On load / when segments change: default to first segment if available; keep list showing all
  useEffect(() => {
    if (!useSegments || sortedSegments.length === 0) {
      setSelectedSegmentId("all");
      setListSegmentFilter("all");
      return;
    }
    setSelectedSegmentId((current) =>
      current && current !== "all"
        ? current
        : sortedSegments[0]?.id ?? "all",
    );
    setListSegmentFilter("all");
  }, [useSegments, sortedSegments]);

  const pointsWithNotes = sortedPoints.filter((p) => p.note || p.image);
  const segmentsWithNotes = sortedSegments.filter(
    (s) => s.note || s.image || s.video,
  );

  return (
    <div className={className} ref={containerRef}>
      {/* Glassy Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Zap className="w-6 h-6 text-blue-400 fill-blue-400/20" />
          </div>
          <h2 className="text-xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 uppercase font-display text-left">
            Emotional Journey
          </h2>
        </div>
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

      <EmotionalJourneyGraphWithScroll
        totalSec={totalSec}
        sortedSegments={sortedSegments}
        useSegments={useSegments}
        graphWidth={graphWidth}
        selectedSegmentId={selectedSegmentId}
        setSelectedSegmentId={(id) => {
          setSelectedSegmentId(id);
          if (id !== "all") setListSegmentFilter(id);
        }}
        sortedPoints={sortedPoints}
        isNewFormat={isNewFormat}
        momentPins={momentPins}
        xAxisInSeconds={xAxisInSeconds}
      />

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
                  onClick={() => {
                    setSelectedSegmentId("all");
                    setListSegmentFilter("all");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${listSegmentFilter === "all"
                    ? "bg-secondary/20 border-secondary/50 text-secondary"
                    : "bg-[#1a1c26] border-white/5 text-gray-500 hover:text-gray-300"
                    }`}
                >
                  Show All
                </button>
              )}
            </div>

            <ul className="space-y-2">
              {useSegments
                ? (() => {
                  const visibleSegments =
                    listSegmentFilter === "all"
                      ? segmentsWithNotes
                      : segmentsWithNotes.filter(
                        (s) => s.id === listSegmentFilter,
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
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedSegmentId(s.id)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedSegmentId(s.id)}
                      className={`group border border-transparent flex flex-col md:flex-row items-center gap-4 p-3 rounded-2xl shadow-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 ${selectedSegmentId === s.id
                        ? "bg-[#0d0e14] border-blue-500/50 hover:border-blue-500/70"
                        : "bg-[#0d0e14] border-white/5 hover:border-blue-500/30"
                        }`}
                    >
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        {s.image && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenMedia({ type: "image", url: s.image! });
                            }}
                            className="relative w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5 group-hover:scale-[1.02] transition-transform cursor-pointer"
                          >
                            <img
                              src={s.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-black text-blue-400">
                              {formatAxisTime(s.startSeconds)} - {formatAxisTime(s.endSeconds)}
                            </div>
                          </div>
                        )}
                        {s.video && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenMedia({ type: "video", url: s.video! });
                            }}
                            className="relative w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5 group-hover:scale-[1.02] transition-transform cursor-pointer"
                          >
                            <div className="w-full h-full flex items-center justify-center bg-blue-500/10">
                              <Video className="w-8 h-8 text-blue-400/60" />
                            </div>
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-black text-blue-400">
                              {formatAxisTime(s.startSeconds)} - {formatAxisTime(s.endSeconds)}
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
                              {formatAxisTime(s.startSeconds)} - {formatAxisTime(s.endSeconds)}
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
      {fullscreenMedia && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setFullscreenMedia(null);
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenMedia(null);
            }}
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
        </div>,
        document.body
      )}
    </div >
  );
}
