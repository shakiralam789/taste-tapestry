import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { useAnalytics } from "@/contexts/AnalyticsContext";

interface UseImpressionTrackerOptions {
  itemId: string;
  source?: string;
  threshold?: number;
  durationMs?: number;
  enabled?: boolean;
}

export function useImpressionTracker({
  itemId,
  source = "feed",
  threshold = 0.5,
  durationMs = 1000,
  enabled = true,
}: UseImpressionTrackerOptions) {
  const { trackEvent, hasTrackedImpression } = useAnalytics();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // If we already tracked it this session or it's disabled, we don't even need to observe it anymore
  const skipTracking = !enabled || hasTrackedImpression(itemId);

  const { ref, inView } = useInView({
    threshold,
    skip: skipTracking, // optimization: detach observer once tracked
  });

  useEffect(() => {
    if (skipTracking) return;

    if (inView) {
      // Start the 1-second continuous visibility timer
      timerRef.current = setTimeout(() => {
        trackEvent({
          itemId,
          eventType: "impression",
          source,
        });
      }, durationMs);
    } else {
      // User scrolled away before the duration was met, clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [inView, skipTracking, itemId, source, durationMs, trackEvent]);

  return { ref };
}
