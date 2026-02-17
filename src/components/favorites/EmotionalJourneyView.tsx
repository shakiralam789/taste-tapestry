import { useEffect, useMemo, useRef, useState } from 'react';
import type { EmotionalCurvePoint, EmotionalSegment } from '@/types/wishbook';
import { getEmotionFill } from '@/data/emotionColors';
import { TrendingUp, MapPin, Video } from 'lucide-react';

const GRAPH_HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };
const Y_MAX = 10;
const Y_MIN = 0;

function formatTime(seconds: number, useSeconds: boolean): string {
  if (useSeconds) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

function buildPathNew(
  points: EmotionalCurvePoint[],
  totalSeconds: number,
  width: number,
  height: number
): string {
  if (points.length < 2 || totalSeconds <= 0) return '';
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
  momentPins?: { id: string; positionPercent: number; note: string; image?: string }[];
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
  className = '',
  xAxisInSeconds = false,
}: EmotionalJourneyViewProps) {
  const [graphWidth, setGraphWidth] = useState(400);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
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
      if (typeof w === 'number' && w > 0) setGraphWidth(w);
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

  const totalDuration =
    isSeriesMode ? totalSecForSeries : totalDurationSeconds;
  const segmentsSingle =
    isSeriesMode ? segmentsForSeries : emotionalSegments;

  const useSegments =
    isSeriesMode
      ? segmentsSingle.length > 0 && totalDuration > 0
      : emotionalSegments.length > 0 && totalDurationSeconds > 0;
  const formatAxisTime = (t: number) => formatTime(t, xAxisInSeconds);
  const isNewFormat =
    !isSeriesMode && !useSegments && totalDurationSeconds > 0 && curvePoints.length >= 2 && curvePoints.every((p) => 'id' in p);
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
    [curvePoints]
  );
  const sortedSegments = useMemo(
    () => [...segmentsSingle].sort((a, b) => a.startSeconds - b.startSeconds),
    [segmentsSingle]
  );

  const svgX = (x: number) => PADDING.left + x * scaleX;
  const svgY = (y: number) => PADDING.top + (yMax - y) * scaleY;

  const pathD = useSegments
    ? (() => {
        if (sortedSegments.length === 0) return '';
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
        : '';

  const pointsWithNotes = sortedPoints.filter((p) => p.note || p.image);
  const segmentsWithNotes = sortedSegments.filter((s) => s.note || s.image || s.video);

  return (
    <div className={className} ref={containerRef}>
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Emotional journey</span>
      </div>
      {isSeriesMode && (
        <div className="space-y-2 mb-3">
          {seasonEpisodeCounts.length > 1
            ? (() => {
                let flatIndex = 0;
                return seasonEpisodeCounts.map((count, s) => {
                  const start = flatIndex;
                  flatIndex += count;
                  if (count <= 0) return null;
                  return (
                    <div key={s}>
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">Season {s + 1}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: count }, (_, e) => {
                          const i = start + e;
                          if (i >= episodeDurations.length) return null;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSelectedEpisodeIndex(i)}
                              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                episodeIndex === i
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              S{s + 1} E{e + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()
            : (
              <div className="flex flex-wrap gap-1.5">
                {episodeDurations.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedEpisodeIndex(i)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      episodeIndex === i
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
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
        className="relative w-full overflow-hidden rounded-lg bg-card/30 border border-white/10"
        style={{ height: GRAPH_HEIGHT + 22 }}
      >
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full"
        >
          <defs>
            <linearGradient id="curveGradientView" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
              <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          {/* Y grid */}
          {(useSegments || isNewFormat ? [0, 2, 4, 6, 8, 10] : [0, 25, 50, 75, 100]).map((v) => (
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
          {useSegments && sortedSegments.map((seg) => {
            const x1 = svgX(seg.startSeconds);
            const x2 = svgX(seg.endSeconds);
            const yTop = svgY(seg.intensity);
            const yBottom = height - PADDING.bottom;
            const fillColor = getEmotionFill(seg.emotionColor) || 'url(#curveGradientView)';
            return (
              <rect
                key={seg.id}
                x={x1}
                y={yTop}
                width={x2 - x1}
                height={yBottom - yTop}
                fill={fillColor}
                fillOpacity={0.45}
                stroke="hsl(var(--primary))"
                strokeWidth={1}
                strokeOpacity={0.6}
                rx={2}
              />
            );
          })}
          {pathD && !useSegments && (
            <>
              <path
                d={`${pathD} L ${svgX(isNewFormat ? totalSec : 100)} ${height - PADDING.bottom} L ${svgX(0)} ${height - PADDING.bottom} Z`}
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
          {!useSegments && sortedPoints.map((pt, i) => (
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
          {!useSegments && !isNewFormat && momentPins.map((pin) => (
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
              <circle cx={svgX(pin.positionPercent)} cy={PADDING.top - 3} r={4} fill="hsl(var(--secondary))" />
            </g>
          ))}
        </svg>
        <div
          className="absolute bottom-0 left-0 right-0 text-[10px] text-muted-foreground flex justify-between px-1"
          style={{ paddingLeft: PADDING.left + 4, paddingRight: PADDING.right + 4 }}
        >
          <span>0</span>
          {(useSegments || isNewFormat) ? (
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
        <div className="absolute left-1 top-4 text-[10px] text-muted-foreground">{yMax}</div>
        <div className="absolute left-1 bottom-8 text-[10px] text-muted-foreground">{yMin}</div>
      </div>
      {(segmentsWithNotes.length > 0 || pointsWithNotes.length > 0 || momentPins.length > 0) && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-secondary" />
            Moments
          </div>
          <ul className="space-y-2">
            {useSegments
              ? segmentsWithNotes.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="text-primary font-medium flex-shrink-0">
                      {formatAxisTime(s.startSeconds)}–{formatAxisTime(s.endSeconds)}
                    </span>
                    {s.image && (
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img src={s.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {s.video && !s.image && (
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        <Video className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-muted-foreground line-clamp-2">{s.note || '—'}</span>
                  </li>
                ))
              : isNewFormat
              ? pointsWithNotes.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="text-primary font-medium w-16 flex-shrink-0">
                      {formatTime(p.x, xAxisInSeconds)}
                    </span>
                    {p.image && (
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="text-muted-foreground line-clamp-2">{p.note || '—'}</span>
                  </li>
                ))
              : momentPins
                .slice()
                .sort((a, b) => a.positionPercent - b.positionPercent)
                .map((pin) => (
                  <li key={pin.id} className="flex items-center gap-2 text-sm">
                    <span className="text-primary font-medium w-14 flex-shrink-0">{pin.positionPercent}%</span>
                    {pin.image && (
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img src={pin.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="text-muted-foreground line-clamp-2">{pin.note}</span>
                  </li>
                ))}
          </ul>
        </div>
      )}
    </div>
  );
}
