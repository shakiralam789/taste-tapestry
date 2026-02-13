import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { EmotionalCurvePoint } from '@/types/wishbook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TrendingUp, X, ImageIcon, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

const GRAPH_HEIGHT = 220;
const PADDING = { top: 20, right: 20, bottom: 36, left: 44 };
const Y_MIN = 0;
const Y_MAX = 10;
const Y_MID = 5;

function buildPathFromPoints(
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

function formatTime(seconds: number, useSeconds: boolean): string {
  if (useSeconds) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

interface EmotionalJourneyEditorProps {
  categoryId: string;
  /** Total duration in seconds (movie/song/episode length). Required for graph. */
  totalDurationSeconds: number;
  onTotalDurationSecondsChange: (seconds: number) => void;
  curvePoints: EmotionalCurvePoint[];
  onCurveChange: (points: EmotionalCurvePoint[]) => void;
  className?: string;
}

export function EmotionalJourneyEditor({
  categoryId: _categoryId,
  totalDurationSeconds,
  onTotalDurationSecondsChange,
  curvePoints,
  onCurveChange,
  className = '',
}: EmotionalJourneyEditorProps) {
  const [graphWidth, setGraphWidth] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphAreaRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const pointerDownAtRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const CLICK_THRESHOLD_PX = 6;
  const [xAxisInSeconds, setXAxisInSeconds] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(
    totalDurationSeconds ? Math.floor(totalDurationSeconds / 60) : 0
  );
  const [durationSeconds, setDurationSeconds] = useState(
    totalDurationSeconds ? totalDurationSeconds % 60 : 0
  );

  const canEdit = totalDurationSeconds > 0;
  useEffect(() => {
    const el = graphAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === 'number' && w > 0) setGraphWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [canEdit]);

  const totalSec = totalDurationSeconds || 1;
  const width = graphWidth;
  const height = GRAPH_HEIGHT;
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;
  const scaleX = chartW / totalSec;
  const scaleY = chartH / (Y_MAX - Y_MIN);

  const sortedPoints = useMemo(
    () => [...curvePoints].sort((a, b) => a.x - b.x),
    [curvePoints]
  );

  const svgX = (x: number) => PADDING.left + x * scaleX;
  const svgY = (y: number) => PADDING.top + (Y_MAX - y) * scaleY;

  const applyDuration = useCallback(() => {
    const sec = durationMinutes * 60 + durationSeconds;
    if (sec > 0) {
      onTotalDurationSecondsChange(sec);
      if (curvePoints.length === 0) {
        onCurveChange([
          { id: `pt-${Date.now()}-0`, x: 0, y: Y_MID },
          { id: `pt-${Date.now()}-1`, x: sec, y: Y_MID },
        ]);
      }
    }
  }, [durationMinutes, durationSeconds, onTotalDurationSecondsChange, curvePoints.length, onCurveChange]);

  const screenToData = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const rect = graphAreaRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return null;
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const viewBoxX = (localX / rect.width) * width;
      const viewBoxY = (localY / rect.height) * height;
      const dataX = (viewBoxX - PADDING.left) / scaleX;
      const dataY = Y_MAX - (viewBoxY - PADDING.top) / scaleY;
      return {
        x: Math.max(0, Math.min(totalSec, dataX)),
        y: Math.max(Y_MIN, Math.min(Y_MAX, dataY)),
      };
    },
    [scaleX, scaleY, totalSec, width]
  );

  const tryAddPointAt = useCallback(
    (clientX: number, clientY: number) => {
      const target = (document.elementFromPoint(clientX, clientY) as SVGElement)?.closest?.('svg');
      if (!target?.isSameNode(svgRef.current)) return;
      const { x, y } = screenToData(clientX, clientY) ?? {};
      if (x == null || y == null) return;
      const newId = `pt-${Date.now()}`;
      const next = [...sortedPoints, { id: newId, x, y: y ?? Y_MID }].sort((a, b) => a.x - b.x);
      onCurveChange(next);
      setSelectedPointId(newId);
    },
    [sortedPoints, onCurveChange, screenToData]
  );

  const handleGraphPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as SVGElement;
    if (target.closest?.('circle[data-point-id]')) {
      setDraggingId((target.closest('circle[data-point-id]') as SVGElement).getAttribute('data-point-id')!);
      return;
    }
    pointerDownAtRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;
  }, []);

  const handlePointPointerDown = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (draggingId !== null) {
        setDraggingId(null);
        return;
      }
      if (pointerDownAtRef.current && !didDragRef.current) {
        tryAddPointAt(e.clientX, e.clientY);
      }
      pointerDownAtRef.current = null;
    },
    [draggingId, tryAddPointAt]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingId !== null) {
        const pos = screenToData(e.clientX, e.clientY);
        if (!pos) return;
        const next = sortedPoints
          .map((p) => (p.id === draggingId ? { ...p, x: pos.x, y: pos.y } : p))
          .sort((a, b) => a.x - b.x);
        onCurveChange(next);
        return;
      }
      if (pointerDownAtRef.current) {
        const dx = e.clientX - pointerDownAtRef.current.x;
        const dy = e.clientY - pointerDownAtRef.current.y;
        if (Math.abs(dx) > CLICK_THRESHOLD_PX || Math.abs(dy) > CLICK_THRESHOLD_PX) {
          didDragRef.current = true;
        }
      }
    },
    [draggingId, sortedPoints, onCurveChange, screenToData]
  );

  const removePoint = useCallback(
    (id: string) => {
      if (sortedPoints.length <= 2) return;
      const next = sortedPoints.filter((p) => p.id !== id);
      onCurveChange(next);
      if (selectedPointId === id) setSelectedPointId(null);
    },
    [sortedPoints, onCurveChange, selectedPointId]
  );

  const updatePoint = useCallback(
    (id: string, patch: Partial<Pick<EmotionalCurvePoint, 'image' | 'note'>>) => {
      const next = sortedPoints.map((p) => (p.id === id ? { ...p, ...patch } : p));
      onCurveChange(next);
    },
    [sortedPoints, onCurveChange]
  );

  const selectedPoint = selectedPointId ? sortedPoints.find((p) => p.id === selectedPointId) : null;

  return (
    <div className={className} ref={containerRef}>
      <div className="mb-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-primary" />
          Your emotional journey
        </h3>
        <p className="text-sm text-muted-foreground">
          Set duration, then click on the line to add points and drag them up/down (0–10). Click a point to add image & comment. X-axis: time (minutes or seconds when zoomed).
        </p>
      </div>

      {/* Duration */}
      <div className="mb-4 p-4 rounded-xl bg-card/30 border border-white/10 space-y-3">
        <Label>Duration (for timeline)</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="number"
            min={0}
            placeholder="Minutes"
            value={durationMinutes || ''}
            onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-24"
          />
          <span className="text-muted-foreground">min</span>
          <Input
            type="number"
            min={0}
            max={59}
            placeholder="Sec"
            value={durationSeconds || ''}
            onChange={(e) => setDurationSeconds(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
            className="w-20"
          />
          <span className="text-muted-foreground">sec</span>
          <Button type="button" size="sm" onClick={applyDuration}>
            Apply
          </Button>
        </div>
        {totalDurationSeconds > 0 && (
          <p className="text-xs text-muted-foreground">
            Total: {Math.floor(totalDurationSeconds / 60)} min {totalDurationSeconds % 60} sec
          </p>
        )}
      </div>

      {!canEdit && (
        <div className="rounded-xl border border-dashed border-white/20 p-6 text-center text-muted-foreground text-sm">
          Set duration and click Apply to draw your emotional curve.
        </div>
      )}

      {canEdit && (
        <>
          {/* Zoom toggle */}
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-xs text-muted-foreground">X-axis:</Label>
            <Button
              type="button"
              variant={!xAxisInSeconds ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 gap-1"
              onClick={() => setXAxisInSeconds(false)}
            >
              <ZoomOut className="w-3.5 h-3.5" />
              Minutes
            </Button>
            <Button
              type="button"
              variant={xAxisInSeconds ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 gap-1"
              onClick={() => setXAxisInSeconds(true)}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              Seconds
            </Button>
          </div>

          {/* Graph */}
          <div
            ref={graphAreaRef}
            className="relative w-full overflow-hidden rounded-xl bg-card/30 border border-white/10"
            style={{ height: GRAPH_HEIGHT + 28 }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <svg
              ref={svgRef}
              width="100%"
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full cursor-crosshair"
              onPointerDown={handleGraphPointerDown}
            >
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              {/* Y grid 0..10 */}
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
              {/* X grid: 4–6 ticks */}
              {(() => {
                const step = xAxisInSeconds ? Math.max(1, Math.floor(totalSec / 6)) : Math.max(60, Math.floor(totalSec / 6 / 60) * 60);
                const ticks: number[] = [];
                for (let t = 0; t <= totalSec; t += step) ticks.push(t);
                if (ticks[ticks.length - 1] !== totalSec) ticks.push(totalSec);
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
              {/* Middle line (y=5) */}
              <line
                x1={PADDING.left}
                y1={svgY(Y_MID)}
                x2={width - PADDING.right}
                y2={svgY(Y_MID)}
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.3}
                strokeDasharray="8 4"
              />
              {/* Fill under curve */}
              <path
                d={`${buildPathFromPoints(sortedPoints, totalSec, width, height)} L ${svgX(totalSec)} ${height - PADDING.bottom} L ${svgX(0)} ${height - PADDING.bottom} Z`}
                fill="url(#curveGradient)"
                fillOpacity={0.2}
              />
              {/* Curve */}
              <motion.path
                d={buildPathFromPoints(sortedPoints, totalSec, width, height)}
                fill="none"
                stroke="url(#curveGradient)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Points */}
              {sortedPoints.map((pt) => (
                <g
                  key={pt.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handlePointPointerDown(pt.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPointId(pt.id);
                  }}
                  style={{ cursor: draggingId === pt.id ? 'grabbing' : 'pointer' }}
                  className="touch-none"
                >
                  <circle
                    data-point-id={pt.id}
                    cx={svgX(pt.x)}
                    cy={svgY(pt.y)}
                    r={draggingId === pt.id ? 14 : 11}
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  {pt.note && (
                    <circle
                      cx={svgX(pt.x)}
                      cy={svgY(pt.y)}
                      r={4}
                      fill="hsl(var(--secondary))"
                      opacity={0.9}
                    />
                  )}
                </g>
              ))}
            </svg>
            {/* Axis labels */}
            <div
              className="absolute bottom-1 left-0 right-0 flex justify-between text-[10px] text-muted-foreground"
              style={{ paddingLeft: PADDING.left + 4, paddingRight: PADDING.right + 4 }}
            >
              <span>0</span>
              {xAxisInSeconds
                ? [...Array(5)].map((_, i) => {
                    const t = Math.round((totalSec * (i + 1)) / 6);
                    return <span key={t}>{formatTime(t, true)}</span>;
                  })
                : [...Array(5)].map((_, i) => {
                    const t = Math.round((totalSec * (i + 1)) / 6);
                    return <span key={t}>{formatTime(t, false)}</span>;
                  })}
              <span>{formatTime(totalSec, xAxisInSeconds)}</span>
            </div>
            <div className="absolute left-1 top-4 text-[10px] text-muted-foreground">10</div>
            <div className="absolute left-1 bottom-10 text-[10px] text-muted-foreground">0</div>
          </div>

          {/* Point form (image + comment) when a point is selected */}
          {selectedPoint && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Point at {formatTime(selectedPoint.x, xAxisInSeconds)} · intensity {selectedPoint.y}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removePoint(selectedPoint.id)}
                    disabled={sortedPoints.length <= 2}
                    title="Remove point"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPointId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  Image URL (optional)
                </Label>
                <Input
                  placeholder="Paste image URL for this moment"
                  value={selectedPoint.image ?? ''}
                  onChange={(e) => updatePoint(selectedPoint.id, { image: e.target.value.trim() || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Comment (optional)</Label>
                <Textarea
                  placeholder="e.g., The twist / Best part / Made me cry"
                  value={selectedPoint.note ?? ''}
                  onChange={(e) => updatePoint(selectedPoint.id, { note: e.target.value || undefined })}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </motion.div>
          )}

          {/* List of points with note/image */}
          {sortedPoints.filter((p) => p.note || p.image).length > 0 && (
            <div className="mt-4 space-y-2">
              <Label className="text-xs text-muted-foreground">Moments with notes</Label>
              <ul className="space-y-2">
                {sortedPoints
                  .filter((p) => p.note || p.image)
                  .map((p) => (
                    <li key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-card/30 border border-white/5 text-sm">
                      <span className="text-primary font-medium w-20 flex-shrink-0">
                        {formatTime(p.x, xAxisInSeconds)}
                      </span>
                      {p.image && (
                        <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-muted-foreground line-clamp-1 flex-1">{p.note || '—'}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPointId(p.id)}>
                        Edit
                      </Button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
