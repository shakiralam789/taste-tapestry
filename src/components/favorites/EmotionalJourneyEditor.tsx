"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { EmotionalSegment } from "@/types/wishbook";
import { EMOTION_COLOR_PRESETS, getEmotionFill } from "@/data/emotionColors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  X,
  ImageIcon,
  Video,
  ZoomIn,
  ZoomOut,
  Split,
  Merge,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

const GRAPH_HEIGHT = 220;
const PADDING = { top: 20, right: 20, bottom: 36, left: 44 };
const Y_MIN = 0;
const Y_MAX = 10;
const Y_MID = 5;
const MIN_SEGMENT_SECONDS = 1;
const EDGE_HIT_PX = 8;
const CLICK_THRESHOLD_PX = 6;
const DOUBLE_CLICK_MS = 400;

function formatTime(seconds: number, useSeconds: boolean): string {
  if (useSeconds) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

/** Hover playhead: always show minutes and seconds, e.g. 4m30s */
function formatTimeMinutesSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function generateId() {
  return `seg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface EmotionalJourneyEditorProps {
  categoryId: string;
  totalDurationSeconds: number;
  onTotalDurationSecondsChange: (seconds: number) => void;
  segments: EmotionalSegment[];
  onSegmentsChange: (segments: EmotionalSegment[]) => void;
  /** Rendered after "How it works" and before duration/timeline (e.g. episode selector for series). */
  children?: React.ReactNode;
  className?: string;
}

/** Normalize segments to cover [0, totalSec] with no gaps. Ensures at least one segment when totalSec > 0. */
function normalizeSegments(
  segments: EmotionalSegment[],
  totalSec: number,
  minSegment: number = MIN_SEGMENT_SECONDS,
): EmotionalSegment[] {
  if (totalSec <= 0) return [];
  const sorted = [...segments]
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .filter((s) => s.endSeconds > s.startSeconds);
  if (sorted.length === 0) {
    return [
      {
        id: generateId(),
        startSeconds: 0,
        endSeconds: totalSec,
        intensity: Y_MID,
      },
    ];
  }
  const out: EmotionalSegment[] = [];
  let lastEnd = 0;
  for (const s of sorted) {
    const start = Math.max(
      lastEnd,
      Math.min(s.startSeconds, totalSec - minSegment),
    );
    let end = Math.max(start + minSegment, Math.min(s.endSeconds, totalSec));
    if (end > totalSec) end = totalSec;
    if (start < end) {
      out.push({ ...s, startSeconds: start, endSeconds: end });
      lastEnd = end;
    }
  }
  if (lastEnd < totalSec && out.length > 0) {
    out[out.length - 1] = { ...out[out.length - 1], endSeconds: totalSec };
  }
  if (out.length > 0 && out[0].startSeconds > 0) {
    out[0] = { ...out[0], startSeconds: 0 };
  }
  if (out.length === 0) {
    return [
      {
        id: generateId(),
        startSeconds: 0,
        endSeconds: totalSec,
        intensity: Y_MID,
      },
    ];
  }
  return out;
}

export function EmotionalJourneyEditor({
  categoryId: _categoryId,
  totalDurationSeconds,
  onTotalDurationSecondsChange,
  segments,
  onSegmentsChange,
  children,
  className = "",
}: EmotionalJourneyEditorProps) {
  const [graphWidth, setGraphWidth] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphAreaRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingSegmentId, setDraggingSegmentId] = useState<string | null>(
    null,
  );
  const [resizingSegmentId, setResizingSegmentId] = useState<
    "left" | "right" | null
  >(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    null,
  );
  const pointerDownAtRef = useRef<{
    x: number;
    y: number;
    segmentId: string;
  } | null>(null);
  const didDragRef = useRef(false);
  const lastClickRef = useRef<{ segmentId: string; timestamp: number } | null>(
    null,
  );
  const dragEndedRef = useRef(false);
  const panStartRef = useRef<{
    clientX: number;
    windowStart: number;
    windowEnd: number;
  } | null>(null);
  const scrollbarTrackRef = useRef<HTMLDivElement>(null);
  const scrollbarDragRef = useRef<{
    startClientX: number;
    startVisibleWindowStart: number;
  } | null>(null);
  const [xAxisInSeconds, setXAxisInSeconds] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(
    totalDurationSeconds ? Math.floor(totalDurationSeconds / 60) : 0,
  );
  const [durationSeconds, setDurationSeconds] = useState(
    totalDurationSeconds ? totalDurationSeconds % 60 : 0,
  );
  const [splitAtSeconds, setSplitAtSeconds] = useState<string>("");
  const [hoverTimeSeconds, setHoverTimeSeconds] = useState<number | null>(null);
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(false);
  const [hoverEdge, setHoverEdge] = useState<"left" | "right" | null>(null);
  const segmentImageInputRef = useRef<HTMLInputElement>(null);
  const segmentVideoInputRef = useRef<HTMLInputElement>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [visibleWindowStart, setVisibleWindowStart] = useState(0);
  const [visibleWindowEnd, setVisibleWindowEnd] = useState(
    totalDurationSeconds || 1,
  );

  const canEdit = totalDurationSeconds > 0;
  const totalSec = totalDurationSeconds || 1;
  const windowSpan = Math.max(1, visibleWindowEnd - visibleWindowStart);
  const minSegment = MIN_SEGMENT_SECONDS;

  // Sync duration inputs and visible window when prop changes (e.g. switching episode in series)
  useEffect(() => {
    const sec = totalDurationSeconds || 0;
    setDurationMinutes(sec ? Math.floor(sec / 60) : 0);
    setDurationSeconds(sec ? sec % 60 : 0);
    setVisibleWindowStart(0);
    setVisibleWindowEnd(sec || 1);
  }, [totalDurationSeconds]);

  const normalizedSegments = useMemo(
    () => normalizeSegments(segments, totalSec, minSegment),
    [segments, totalSec, minSegment],
  );

  useEffect(() => {
    if (!canEdit || segments.length > 0) return;
    onSegmentsChange([
      {
        id: generateId(),
        startSeconds: 0,
        endSeconds: totalSec,
        intensity: Y_MID,
      },
    ]);
  }, [canEdit, totalSec, segments.length, onSegmentsChange]);

  useEffect(() => {
    const el = graphAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === "number" && w > 0) setGraphWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [canEdit]);

  useEffect(() => {
    if (!fullscreenMedia) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreenMedia(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreenMedia]);

  const width = graphWidth;
  const height = GRAPH_HEIGHT;
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;
  const scaleX = chartW / windowSpan;
  const scaleY = chartH / (Y_MAX - Y_MIN);

  const svgX = (t: number) => PADDING.left + (t - visibleWindowStart) * scaleX;
  const svgY = (y: number) => PADDING.top + (Y_MAX - y) * scaleY;

  const zoomIn = useCallback(() => {
    const center = (visibleWindowStart + visibleWindowEnd) / 2;
    const newSpan = Math.max(5, windowSpan * 0.55);
    const start = Math.max(0, center - newSpan / 2);
    const end = Math.min(totalSec, center + newSpan / 2);
    setVisibleWindowStart(start);
    setVisibleWindowEnd(end);
  }, [visibleWindowStart, visibleWindowEnd, windowSpan, totalSec]);

  const zoomOut = useCallback(() => {
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
  }, [visibleWindowStart, visibleWindowEnd, windowSpan, totalSec]);

  const zoomReset = useCallback(() => {
    setVisibleWindowStart(0);
    setVisibleWindowEnd(totalSec);
  }, [totalSec]);

  const handleScrollbarTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== scrollbarTrackRef.current) return;
      const track = scrollbarTrackRef.current;
      if (!track || windowSpan >= totalSec - 0.5) return;
      const rect = track.getBoundingClientRect();
      const fraction = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
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
    [windowSpan, totalSec],
  );

  const handleScrollbarThumbPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (windowSpan >= totalSec - 0.5) return;
      scrollbarDragRef.current = {
        startClientX: e.clientX,
        startVisibleWindowStart: visibleWindowStart,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [windowSpan, totalSec, visibleWindowStart],
  );

  const handleScrollbarPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!scrollbarDragRef.current) return;
      const track = scrollbarTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
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
      setVisibleWindowStart(start);
      setVisibleWindowEnd(end);
    },
    [totalSec, windowSpan],
  );

  const handleScrollbarPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    scrollbarDragRef.current = null;
  }, []);

  const applyDuration = useCallback(() => {
    const sec = durationMinutes * 60 + durationSeconds;
    if (sec > 0) {
      onTotalDurationSecondsChange(sec);
      if (segments.length === 0) {
        onSegmentsChange([
          {
            id: generateId(),
            startSeconds: 0,
            endSeconds: sec,
            intensity: Y_MID,
          },
        ]);
      } else {
        onSegmentsChange(normalizeSegments(segments, sec, minSegment));
      }
    }
  }, [
    durationMinutes,
    durationSeconds,
    onTotalDurationSecondsChange,
    segments,
    onSegmentsChange,
    minSegment,
  ]);

  const screenToData = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const rect = graphAreaRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return null;
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const viewBoxX = (localX / rect.width) * width;
      const viewBoxY = (localY / rect.height) * height;
      const x = visibleWindowStart + (viewBoxX - PADDING.left) / scaleX;
      const y = Y_MAX - (viewBoxY - PADDING.top) / scaleY;
      return {
        x: Math.max(0, Math.min(totalSec, x)),
        y: Math.max(Y_MIN, Math.min(Y_MAX, y)),
      };
    },
    [scaleX, scaleY, visibleWindowStart, totalSec, width, height],
  );

  const getSegmentAtTime = useCallback(
    (t: number) =>
      normalizedSegments.find((s) => s.startSeconds <= t && t < s.endSeconds),
    [normalizedSegments],
  );

  const getSegmentAtScreen = useCallback(
    (
      clientX: number,
      clientY: number,
    ): { segment: EmotionalSegment; edge: "left" | "right" | null } | null => {
      const pos = screenToData(clientX, clientY);
      if (!pos) return null;
      const seg = getSegmentAtTime(pos.x);
      if (!seg) return null;
      const rect = graphAreaRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const localX = ((clientX - rect.left) / rect.width) * width;
      const segLeft =
        PADDING.left + (seg.startSeconds - visibleWindowStart) * scaleX;
      const segRight =
        PADDING.left + (seg.endSeconds - visibleWindowStart) * scaleX;
      if (localX - segLeft <= EDGE_HIT_PX)
        return { segment: seg, edge: "left" };
      if (segRight - localX <= EDGE_HIT_PX)
        return { segment: seg, edge: "right" };
      return { segment: seg, edge: null };
    },
    [screenToData, getSegmentAtTime, width, scaleX, visibleWindowStart],
  );

  const updateSegment = useCallback(
    (id: string, patch: Partial<EmotionalSegment>) => {
      const next = normalizedSegments.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      );
      onSegmentsChange(next);
    },
    [normalizedSegments, onSegmentsChange],
  );

  const splitSegment = useCallback(
    (segmentId: string, atSeconds: number) => {
      const seg = normalizedSegments.find((s) => s.id === segmentId);
      if (!seg || atSeconds <= seg.startSeconds || atSeconds >= seg.endSeconds)
        return;
      const idx = normalizedSegments.findIndex((s) => s.id === segmentId);
      const left: EmotionalSegment = { ...seg, endSeconds: atSeconds };
      const right: EmotionalSegment = {
        ...seg,
        id: generateId(),
        startSeconds: atSeconds,
        endSeconds: seg.endSeconds,
      };
      const next = [
        ...normalizedSegments.slice(0, idx),
        left,
        right,
        ...normalizedSegments.slice(idx + 1),
      ];
      onSegmentsChange(next);
      setSelectedSegmentId(right.id);
      setSplitAtSeconds("");
    },
    [normalizedSegments, onSegmentsChange],
  );

  const joinWithNext = useCallback(
    (segmentId: string) => {
      const idx = normalizedSegments.findIndex((s) => s.id === segmentId);
      if (idx < 0 || idx >= normalizedSegments.length - 1) return;
      const current = normalizedSegments[idx];
      const next = normalizedSegments[idx + 1];
      const merged: EmotionalSegment = {
        ...current,
        endSeconds: next.endSeconds,
      };
      const nextList = [
        ...normalizedSegments.slice(0, idx),
        merged,
        ...normalizedSegments.slice(idx + 2),
      ];
      onSegmentsChange(nextList);
      setSelectedSegmentId(merged.id);
    },
    [normalizedSegments, onSegmentsChange],
  );

  const joinWithPrevious = useCallback(
    (segmentId: string) => {
      const idx = normalizedSegments.findIndex((s) => s.id === segmentId);
      if (idx <= 0 || idx >= normalizedSegments.length) return;
      const prev = normalizedSegments[idx - 1];
      const current = normalizedSegments[idx];
      const merged: EmotionalSegment = {
        ...prev,
        endSeconds: current.endSeconds,
      };
      const nextList = [
        ...normalizedSegments.slice(0, idx - 1),
        merged,
        ...normalizedSegments.slice(idx + 1),
      ];
      onSegmentsChange(nextList);
      setSelectedSegmentId(merged.id);
    },
    [normalizedSegments, onSegmentsChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragEndedRef.current = false;
      const hit = getSegmentAtScreen(e.clientX, e.clientY);
      if (!hit) {
        setSelectedSegmentId(null);
        pointerDownAtRef.current = null;
        if (windowSpan < totalSec - 0.5) {
          panStartRef.current = {
            clientX: e.clientX,
            windowStart: visibleWindowStart,
            windowEnd: visibleWindowEnd,
          };
          setIsPanning(true);
          (e.target as SVGElement).setPointerCapture?.(e.pointerId);
        }
        return;
      }
      panStartRef.current = null;
      (e.target as SVGElement).setPointerCapture?.(e.pointerId);
      if (hit.edge) {
        setResizingSegmentId(hit.edge);
        setDraggingSegmentId(hit.segment.id);
        pointerDownAtRef.current = null;
      } else {
        pointerDownAtRef.current = {
          x: e.clientX,
          y: e.clientY,
          segmentId: hit.segment.id,
        };
        didDragRef.current = false;
      }
    },
    [
      getSegmentAtScreen,
      windowSpan,
      totalSec,
      visibleWindowStart,
      visibleWindowEnd,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragEndedRef.current) return;

      if (panStartRef.current) {
        const rect = graphAreaRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        const deltaX = e.clientX - panStartRef.current.clientX;
        const viewBoxPerPx = width / rect.width;
        const deltaTime = ((deltaX * viewBoxPerPx) / chartW) * windowSpan;
        const span =
          panStartRef.current.windowEnd - panStartRef.current.windowStart;
        let start = panStartRef.current.windowStart - deltaTime;
        let end = panStartRef.current.windowEnd - deltaTime;
        if (start < 0) {
          start = 0;
          end = Math.min(totalSec, span);
        }
        if (end > totalSec) {
          end = totalSec;
          start = Math.max(0, totalSec - span);
        }
        setVisibleWindowStart(start);
        setVisibleWindowEnd(end);
        setHoverTimeSeconds(null);
        return;
      }

      if (
        pointerDownAtRef.current &&
        !resizingSegmentId &&
        !draggingSegmentId
      ) {
        const dx = e.clientX - pointerDownAtRef.current.x;
        const dy = e.clientY - pointerDownAtRef.current.y;
        if (
          Math.abs(dx) > CLICK_THRESHOLD_PX ||
          Math.abs(dy) > CLICK_THRESHOLD_PX
        ) {
          didDragRef.current = true;
          setDraggingSegmentId(pointerDownAtRef.current.segmentId);
        }
      }

      const pos = screenToData(e.clientX, e.clientY);
      if (!pos) return;

      if (resizingSegmentId === "left" || resizingSegmentId === "right") {
        const id = draggingSegmentId;
        if (!id) return;
        const seg = normalizedSegments.find((s) => s.id === id);
        if (!seg) return;
        const idx = normalizedSegments.findIndex((s) => s.id === id);
        const prev = normalizedSegments[idx - 1];
        const next = normalizedSegments[idx + 1];
        const minW = minSegment;

        if (resizingSegmentId === "left") {
          const newStart = Math.max(
            prev ? prev.startSeconds + minW : 0,
            Math.min(pos.x, seg.endSeconds - minW),
          );
          const nextList = normalizedSegments.map((s) => {
            if (s.id === id) return { ...s, startSeconds: newStart };
            if (prev && s.id === prev.id) return { ...s, endSeconds: newStart };
            return s;
          });
          onSegmentsChange(nextList);
        } else {
          const newEnd = Math.min(
            next ? next.startSeconds : totalSec,
            Math.max(pos.x, seg.startSeconds + minW),
          );
          const nextList = normalizedSegments.map((s) => {
            if (s.id === id) return { ...s, endSeconds: newEnd };
            if (next && s.id === next.id) return { ...s, startSeconds: newEnd };
            return s;
          });
          onSegmentsChange(nextList);
        }
        return;
      }

      if (draggingSegmentId) {
        const y = Math.max(Y_MIN, Math.min(Y_MAX, Math.round(pos.y * 10) / 10));
        updateSegment(draggingSegmentId, { intensity: y });
      }

      if (
        !draggingSegmentId &&
        !resizingSegmentId &&
        !pointerDownAtRef.current
      ) {
        setHoverTimeSeconds(
          pos ? Math.max(0, Math.min(totalSec, pos.x)) : null,
        );
        const hit = getSegmentAtScreen(e.clientX, e.clientY);
        setHoverEdge(hit?.edge ?? null);
      } else {
        setHoverTimeSeconds(null);
        setHoverEdge(null);
      }
    },
    [
      screenToData,
      getSegmentAtScreen,
      resizingSegmentId,
      draggingSegmentId,
      normalizedSegments,
      updateSegment,
      onSegmentsChange,
      totalSec,
      chartW,
      windowSpan,
      width,
      minSegment,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.target as SVGElement).releasePointerCapture?.(e.pointerId);

      if (draggingSegmentId && !resizingSegmentId) {
        const pos = screenToData(e.clientX, e.clientY);
        if (pos) {
          const y = Math.max(Y_MIN, Math.min(Y_MAX, Math.round(pos.y * 10) / 10));
          updateSegment(draggingSegmentId, { intensity: y });
        }
        dragEndedRef.current = true;
      }

      if (
        !didDragRef.current &&
        !resizingSegmentId &&
        pointerDownAtRef.current
      ) {
        const pos = screenToData(e.clientX, e.clientY);
        const seg = pos ? getSegmentAtTime(pos.x) : null;
        let didSplit = false;
        if (seg && pos && normalizedSegments.length < 20) {
          const splitTime = Math.max(
            seg.startSeconds + minSegment,
            Math.min(seg.endSeconds - minSegment, pos.x),
          );
          const isDoubleClick =
            lastClickRef.current?.segmentId === seg.id &&
            Date.now() - lastClickRef.current.timestamp < DOUBLE_CLICK_MS;
          if (
            isDoubleClick &&
            splitTime > seg.startSeconds &&
            splitTime < seg.endSeconds
          ) {
            splitSegment(seg.id, splitTime);
            lastClickRef.current = null;
            didSplit = true;
          } else {
            lastClickRef.current = { segmentId: seg.id, timestamp: Date.now() };
          }
        }
        if (seg && !didSplit) {
          setSelectedSegmentId(seg.id);
        }
        pointerDownAtRef.current = null;
      }

      didDragRef.current = false;
      setDraggingSegmentId(null);
      setResizingSegmentId(null);
      setHoverTimeSeconds(null);
      panStartRef.current = null;
      setIsPanning(false);
    },
    [
      screenToData,
      getSegmentAtTime,
      normalizedSegments.length,
      splitSegment,
      resizingSegmentId,
      draggingSegmentId,
      updateSegment,
      minSegment,
    ],
  );

  const selectedSegment = selectedSegmentId
    ? normalizedSegments.find((s) => s.id === selectedSegmentId)
    : null;
  const selectedIndex = selectedSegment
    ? normalizedSegments.findIndex((s) => s.id === selectedSegment.id)
    : -1;
  const canJoinWithNext =
    selectedSegment &&
    selectedIndex >= 0 &&
    selectedIndex < normalizedSegments.length - 1;
  const canJoinWithPrevious =
    selectedSegment &&
    selectedIndex > 0 &&
    selectedIndex < normalizedSegments.length;

  return (
    <div className={className} ref={containerRef}>
      <div className="mb-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-primary" />
          Your emotional journey
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Map how your mood changes over time. Set the total duration, then
          split the timeline into segments and set intensity (0–10) for each
          part.
        </p>
        <div className="rounded-xl border border-white/10 bg-card/20 overflow-hidden">
          <button
            type="button"
            onClick={() => setHowItWorksExpanded((v) => !v)}
            className="w-full flex items-center gap-2 text-sm font-medium text-foreground p-4 text-left hover:bg-white/5 transition-colors"
            aria-expanded={howItWorksExpanded}
          >
            <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
            How it works
            {howItWorksExpanded ? (
              <ChevronDown className="w-4 h-4 ml-auto flex-shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0 text-muted-foreground" />
            )}
          </button>
          {howItWorksExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10"
            >
              <ul className="text-sm text-muted-foreground space-y-2 list-none p-4 pt-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium flex-shrink-0">
                    1.
                  </span>
                  <span>
                    <strong className="text-foreground">Split</strong> —
                    Double-click a bar to split it at the cursor, or enter a
                    time (seconds) and click Split below. You can have multiple
                    segments (e.g. 0–50s, 50–60s, 60–120s).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium flex-shrink-0">
                    2.
                  </span>
                  <span>
                    <strong className="text-foreground">Intensity</strong> —
                    Drag a bar up or down to set how strong the feeling is (0 =
                    low, 10 = high). The bar follows your cursor and stays where
                    you release.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium flex-shrink-0">
                    3.
                  </span>
                  <span>
                    <strong className="text-foreground">Resize</strong> — Drag
                    the left or right edge of a bar to change its start or end
                    time. You can extend a segment left or right (the neighbor
                    segment shrinks or grows).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium flex-shrink-0">
                    4.
                  </span>
                  <span>
                    <strong className="text-foreground">Moment</strong> — Click
                    a bar to select it, then add an optional image URL and
                    comment. Segments with a note or image show an{" "}
                    <strong className="text-foreground">i</strong> badge.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium flex-shrink-0">
                    5.
                  </span>
                  <span>
                    <strong className="text-foreground">Join</strong> — Select a
                    segment and click &quot;Join with previous&quot; or
                    &quot;Join with next&quot; to merge it with the adjacent
                    one.
                  </span>
                </li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {children}

      <div className="mb-4 p-4 rounded-xl bg-card/30 border border-white/10 space-y-3">
        <Label>Duration (for timeline)</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="number"
            min={0}
            placeholder="Minutes"
            value={durationMinutes || ""}
            onChange={(e) =>
              setDurationMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))
            }
            className="w-24"
          />
          <span className="text-muted-foreground">min</span>
          <Input
            type="number"
            min={0}
            max={59}
            placeholder="Sec"
            value={durationSeconds || ""}
            onChange={(e) =>
              setDurationSeconds(
                Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)),
              )
            }
            className="w-20"
          />
          <span className="text-muted-foreground">sec</span>
          <Button type="button" size="sm" onClick={applyDuration}>
            Apply
          </Button>
        </div>
        {totalDurationSeconds > 0 && (
          <p className="text-xs text-muted-foreground">
            Total: {Math.floor(totalDurationSeconds / 60)} min{" "}
            {totalDurationSeconds % 60} sec
          </p>
        )}
      </div>

      {!canEdit && (
        <div className="rounded-xl border border-dashed border-white/20 p-6 text-center text-muted-foreground text-sm">
          Set duration and click Apply to edit your emotional journey.
        </div>
      )}

      {canEdit && (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">
                Split at (seconds):
              </Label>
              <Input
                type="number"
                min={minSegment}
                max={Math.max(minSegment, totalSec - minSegment)}
                step={1}
                placeholder={`0–${Math.round(totalSec)}`}
                value={splitAtSeconds}
                onChange={(e) => setSplitAtSeconds(e.target.value)}
                className="w-24 h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-1"
                onClick={() => {
                  const t = parseFloat(splitAtSeconds);
                  if (Number.isNaN(t)) return;
                  const seg = getSegmentAtTime(t);
                  if (
                    seg &&
                    t > seg.startSeconds + minSegment &&
                    t < seg.endSeconds - minSegment
                  ) {
                    splitSegment(seg.id, t);
                    setSplitAtSeconds("");
                  }
                }}
                disabled={!splitAtSeconds || normalizedSegments.length >= 20}
              >
                <Split className="w-3.5 h-3.5" />
                Split
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Zoom:</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1"
                onClick={zoomIn}
                title="Zoom in timeline"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                In
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1"
                onClick={zoomOut}
                title="Zoom out timeline"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                Out
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 border"
                onClick={zoomReset}
                title="Reset view to full timeline"
              >
                Reset
              </Button>
            </div>
          </div>

          <div
            ref={graphAreaRef}
            className="relative w-full overflow-hidden rounded-xl bg-card/30 border border-white/10"
            style={{ height: GRAPH_HEIGHT + 28 }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={(e) => {
              setHoverTimeSeconds(null);
              setHoverEdge(null);
              handlePointerUp(e);
            }}
            onPointerCancel={handlePointerUp}
          >
            <svg
              ref={svgRef}
              width="100%"
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full select-none"
              style={{
                cursor: resizingSegmentId
                  ? "ew-resize"
                  : hoverEdge
                    ? "ew-resize"
                    : draggingSegmentId
                      ? "ns-resize"
                      : isPanning
                        ? "grabbing"
                        : windowSpan < totalSec - 0.5
                          ? "grab"
                          : "default",
              }}
              onPointerDown={handlePointerDown}
            >
              <defs>
                <linearGradient
                  id="segmentGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--secondary))"
                    stopOpacity={0.9}
                  />
                </linearGradient>
              </defs>
              {/* Y grid */}
              {[0, 2, 4, 6, 8, 10].map((v) => (
                <line
                  key={`h-${v}`}
                  x1={PADDING.left}
                  y1={svgY(v)}
                  x2={width - PADDING.right}
                  y2={svgY(v)}
                  stroke="hsl(var(--border))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
              ))}
              {/* X grid (visible window) */}
              {(() => {
                const step = xAxisInSeconds
                  ? Math.max(1, Math.floor(windowSpan / 6))
                  : Math.max(60, Math.floor(windowSpan / 6 / 60) * 60);
                const ticks: number[] = [];
                const t0 = Math.floor(visibleWindowStart / step) * step;
                for (let t = t0; t <= visibleWindowEnd; t += step)
                  ticks.push(t);
                if (
                  ticks.length > 0 &&
                  ticks[ticks.length - 1] !== visibleWindowEnd
                )
                  ticks.push(visibleWindowEnd);
                return ticks.map((t) => (
                  <line
                    key={`v-${t}`}
                    x1={svgX(t)}
                    y1={PADDING.top}
                    x2={svgX(t)}
                    y2={height - PADDING.bottom}
                    stroke="hsl(var(--border))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                ));
              })()}
              <line
                x1={PADDING.left}
                y1={svgY(Y_MID)}
                x2={width - PADDING.right}
                y2={svgY(Y_MID)}
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.3}
                strokeDasharray="8 4"
              />
              {/* Segments as bars (clipped to visible window) */}
              {normalizedSegments
                .filter(
                  (seg) =>
                    seg.endSeconds > visibleWindowStart &&
                    seg.startSeconds < visibleWindowEnd,
                )
                .map((seg) => {
                  const drawStart = Math.max(
                    seg.startSeconds,
                    visibleWindowStart,
                  );
                  const drawEnd = Math.min(seg.endSeconds, visibleWindowEnd);
                  const x1 = svgX(drawStart);
                  const x2 = svgX(drawEnd);
                  const yTop = svgY(seg.intensity);
                  const yBottom = height - PADDING.bottom;
                  const isSelected = selectedSegmentId === seg.id;
                  const isDragging = draggingSegmentId === seg.id;
                  const fillColor =
                    getEmotionFill(seg.emotionColor) || "url(#segmentGradient)";
                  return (
                    <g
                      key={seg.id}
                      style={{ cursor: isDragging ? "grabbing" : "grab" }}
                      className="touch-none"
                    >
                      <motion.rect
                        x={x1}
                        y={yTop}
                        width={x2 - x1}
                        height={yBottom - yTop}
                        fill={fillColor}
                        fillOpacity={isSelected ? 0.6 : 0.45}
                        stroke="hsl(var(--primary))"
                        strokeWidth={isSelected ? 2.5 : 1}
                        strokeOpacity={0.9}
                        rx={2}
                      />
                      {(seg.note || seg.image) && (
                        <g
                          transform={`translate(${x1 + (x2 - x1) / 2}, ${yTop + (yBottom - yTop) / 2})`}
                          pointerEvents="none"
                        >
                          <title>Moment with note or image</title>
                          <circle
                            r={9}
                            fill="hsl(var(--secondary))"
                            fillOpacity={0.95}
                            stroke="hsl(var(--background))"
                            strokeWidth={1.5}
                          />
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="hsl(var(--background))"
                            fontSize={10}
                            fontWeight="bold"
                            fontFamily="system-ui, sans-serif"
                          >
                            i
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              {/* Hover playhead: vertical line + time */}
              {hoverTimeSeconds != null && (
                <g pointerEvents="none">
                  <line
                    x1={svgX(hoverTimeSeconds)}
                    y1={PADDING.top}
                    x2={svgX(hoverTimeSeconds)}
                    y2={height - PADDING.bottom}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeOpacity={0.9}
                    strokeDasharray="4 4"
                  />
                  <rect
                    x={svgX(hoverTimeSeconds) - 28}
                    y={PADDING.top - 14}
                    width={56}
                    height={14}
                    rx={4}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.95}
                  />
                  <text
                    x={svgX(hoverTimeSeconds)}
                    y={PADDING.top - 5}
                    textAnchor="middle"
                    fill="hsl(var(--background))"
                    fontSize={10}
                    fontWeight="600"
                    fontFamily="system-ui, sans-serif"
                  >
                    {formatTimeMinutesSeconds(hoverTimeSeconds)}
                  </text>
                </g>
              )}
            </svg>
            <div
              className="absolute bottom-1 left-0 right-0 flex justify-between text-[10px] text-muted-foreground"
              style={{
                paddingLeft: PADDING.left + 4,
                paddingRight: PADDING.right + 4,
              }}
            >
              <span>{formatTimeMinutesSeconds(visibleWindowStart)}</span>
              {xAxisInSeconds
                ? [...Array(4)].map((_, i) => {
                    const t = visibleWindowStart + (windowSpan * (i + 1)) / 5;
                    return <span key={i}>{formatTimeMinutesSeconds(t)}</span>;
                  })
                : [...Array(4)].map((_, i) => {
                    const t = visibleWindowStart + (windowSpan * (i + 1)) / 5;
                    return <span key={i}>{formatTimeMinutesSeconds(t)}</span>;
                  })}
              <span>{formatTimeMinutesSeconds(visibleWindowEnd)}</span>
            </div>
            <div className="absolute left-1 top-4 text-[10px] text-muted-foreground">
              10
            </div>
            <div className="absolute left-1 bottom-10 text-[10px] text-muted-foreground">
              0
            </div>
          </div>

          {canEdit && windowSpan < totalSec - 0.5 && (
            <div
              className="mt-2 flex items-center gap-2"
              onPointerMove={handleScrollbarPointerMove}
              onPointerUp={handleScrollbarPointerUp}
              onPointerLeave={handleScrollbarPointerUp}
            >
              <span className="text-[10px] text-muted-foreground w-10 flex-shrink-0">
                Scroll
              </span>
              <div
                ref={scrollbarTrackRef}
                role="scrollbar"
                aria-label="Timeline position"
                aria-valuemin={0}
                aria-valuemax={totalSec}
                aria-valuenow={visibleWindowStart}
                className="relative h-5 flex-1 rounded-full bg-muted/80 border border-white/10 cursor-pointer touch-none"
                onClick={handleScrollbarTrackClick}
              >
                <div
                  className="absolute top-0.5 bottom-0.5 rounded-full bg-primary/80 border border-primary hover:bg-primary transition-colors cursor-grab active:cursor-grabbing touch-none"
                  style={{
                    left: `${(visibleWindowStart / totalSec) * 100}%`,
                    width: `${(windowSpan / totalSec) * 100}%`,
                    minWidth: 24,
                  }}
                  onPointerDown={handleScrollbarThumbPointerDown}
                  onPointerMove={handleScrollbarPointerMove}
                  onPointerUp={handleScrollbarPointerUp}
                />
              </div>
            </div>
          )}

          {selectedSegment && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium">
                  {formatTimeMinutesSeconds(selectedSegment.startSeconds)} –{" "}
                  {formatTimeMinutesSeconds(selectedSegment.endSeconds)} ·
                  intensity {selectedSegment.intensity}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedSegmentId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs mb-2 block">Mood color</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateSegment(selectedSegment.id, {
                        emotionColor: undefined,
                      })
                    }
                    className={`h-8 rounded-lg border-2 px-2 transition-all flex items-center justify-center gap-1 text-xs ${
                      selectedSegment.emotionColor == null
                        ? "border-foreground ring-2 ring-primary/30 bg-muted"
                        : "border-transparent hover:border-white/30 bg-muted/80"
                    }`}
                    title="Default gradient"
                  >
                    Default
                  </button>
                  {EMOTION_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        updateSegment(selectedSegment.id, {
                          emotionColor: preset.id,
                        })
                      }
                      className={`h-8 min-w-[2.5rem] rounded-lg border-2 transition-all flex items-center justify-center gap-1 px-2 ${
                        selectedSegment.emotionColor === preset.id
                          ? "border-foreground ring-2 ring-primary/30"
                          : "border-transparent hover:border-white/30"
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.label}
                    >
                      <span className="text-sm" title={preset.label}>
                        {preset.emoji}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                <div>
                  <Label className="flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    Image (optional)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Upload a file or paste an image URL
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={segmentImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file || !file.type.startsWith("image/")) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          updateSegment(selectedSegment.id, {
                            image: reader.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => segmentImageInputRef.current?.click()}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Upload
                    </Button>
                    <Input
                      placeholder="Or paste image URL"
                      value={
                        (selectedSegment.image ?? "").startsWith("data:")
                          ? ""
                          : (selectedSegment.image ?? "")
                      }
                      onChange={(e) =>
                        updateSegment(selectedSegment.id, {
                          image: e.target.value.trim() || undefined,
                        })
                      }
                      className="text-xs md:text-sm flex-1 min-w-[140px]"
                    />
                  </div>
                  {(selectedSegment.image ?? "").startsWith("data:") && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Image set from upload
                    </p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    Video (optional)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Upload a file or paste a video URL
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={segmentVideoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file || !file.type.startsWith("video/")) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          updateSegment(selectedSegment.id, {
                            video: reader.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => segmentVideoInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Upload
                    </Button>
                    <Input
                      placeholder="Or paste video URL"
                      value={
                        (selectedSegment.video ?? "").startsWith("data:")
                          ? ""
                          : (selectedSegment.video ?? "")
                      }
                      onChange={(e) =>
                        updateSegment(selectedSegment.id, {
                          video: e.target.value.trim() || undefined,
                        })
                      }
                      className="text-xs md:text-sm flex-1 min-w-[140px]"
                    />
                  </div>
                  {(selectedSegment.video ?? "").startsWith("data:") && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Video set from upload
                    </p>
                  )}
                </div>
                <div className="md:col-span-2 col-span-1">
                  <Label>Comment (optional)</Label>
                  <Textarea
                    placeholder="e.g., The twist / Best part / Made me cry"
                    value={selectedSegment.note ?? ""}
                    onChange={(e) =>
                      updateSegment(selectedSegment.id, {
                        note: e.target.value || undefined,
                      })
                    }
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2 pt-2 border-t border-white/10">
                {canJoinWithPrevious && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => joinWithPrevious(selectedSegment.id)}
                  >
                    <Merge className="w-3.5 h-3.5" />
                    Join with previous
                  </Button>
                )}
                {canJoinWithNext && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => joinWithNext(selectedSegment.id)}
                  >
                    <Merge className="w-3.5 h-3.5" />
                    Join with next
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {normalizedSegments.some((s) => s.note || s.image || s.video) && (
            <div className="mt-4 space-y-2">
              <Label className="text-xs text-muted-foreground">
                Moments with notes / media
              </Label>
              <ul className="space-y-2">
                {normalizedSegments
                  .filter((s) => s.note || s.image || s.video)
                  .map((s) => (
                    <li
                      key={s.id}
                      className="md:flex items-center gap-3 p-2 rounded-lg bg-card/30 border border-white/5 text-sm"
                    >
                      <span className="mb-1 block text-xs md:text-sm text-primary font-medium flex-shrink-0">
                        {formatTimeMinutesSeconds(s.startSeconds)} –{" "}
                        {formatTimeMinutesSeconds(s.endSeconds)}
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        {s.image && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenMedia({
                                type: "image",
                                url: s.image!,
                              });
                            }}
                            className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <img
                              src={s.image}
                              alt=""
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          </button>
                        )}
                        {s.video && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenMedia({
                                type: "video",
                                url: s.video!,
                              });
                            }}
                            className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <Video className="w-6 h-6 text-muted-foreground pointer-events-none" />
                          </button>
                        )}
                        <span className="text-muted-foreground line-clamp-1 flex-1">
                          {s.note || "—"}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSegmentId(s.id)}
                            className="border"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              updateSegment(s.id, {
                                note: undefined,
                                image: undefined,
                                video: undefined,
                              });
                              if (selectedSegmentId === s.id)
                                setSelectedSegmentId(null);
                            }}
                            title="Reset note, image and video"
                            className="text-muted-foreground hover:text-white border"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}

      {fullscreenMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullscreenMedia(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Media fullscreen"
        >
          <button
            type="button"
            onClick={() => setFullscreenMedia(null)}
            className="absolute top-4 right-4 z-10 rounded-full p-2 bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreenMedia.type === "image" ? (
              <img
                src={fullscreenMedia.url}
                alt=""
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
              />
            ) : (
              <video
                src={fullscreenMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] w-auto rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
