import { useCallback } from "react";
import { useAnalytics } from "@/contexts/AnalyticsContext";

export function useClickTracker(source: string = "feed") {
  const { trackEvent } = useAnalytics();

  const trackClick = useCallback((itemId: string) => {
    trackEvent({
      itemId,
      eventType: "click",
      source,
    });
  }, [trackEvent, source]);

  return { trackClick };
}
