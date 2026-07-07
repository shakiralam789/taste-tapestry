"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { trackAnalyticsBatch } from "@/features/favorites/api";

type AnalyticsEvent = {
  itemId: string;
  eventType: "impression" | "click";
  sessionId: string;
  source?: string;
  device?: string;
  platform?: string;
};

interface AnalyticsContextType {
  trackEvent: (event: Omit<AnalyticsEvent, "sessionId" | "device" | "platform">) => void;
  hasTrackedImpression: (itemId: string) => boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>("");
  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const trackedImpressions = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Initialize session id
    let sid = sessionStorage.getItem("analytics_session_id");
    if (!sid) {
      sid = generateSessionId();
      sessionStorage.setItem("analytics_session_id", sid);
    }
    setSessionId(sid);

    // Initialize flush interval (every 5 seconds)
    const interval = setInterval(() => {
      flushQueue();
    }, 5000);

    // Flush on page exit/unmount
    const handleBeforeUnload = () => flushQueue();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushQueue();
    };
  }, []);

  const flushQueue = () => {
    if (eventQueue.current.length === 0) return;
    const eventsToSend = [...eventQueue.current];
    eventQueue.current = []; // Clear queue immediately
    
    // Attempt to send
    trackAnalyticsBatch(eventsToSend).catch((err) => {
      console.error("Failed to send analytics batch", err);
      // In a robust implementation, we might push them back to the queue to retry,
      // but for now we drop to avoid memory bloat.
    });
  };

  const trackEvent = (
    event: Omit<AnalyticsEvent, "sessionId" | "device" | "platform">
  ) => {
    if (!sessionId) return; // Wait until session initialized

    if (event.eventType === "impression") {
      if (trackedImpressions.current.has(event.itemId)) return; // Dedupe
      trackedImpressions.current.add(event.itemId);
    }

    eventQueue.current.push({
      ...event,
      sessionId,
      device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
      platform: "web",
    });
    
    // If the queue gets too large, flush immediately to prevent memory issues
    if (eventQueue.current.length >= 50) {
      flushQueue();
    }
  };

  const hasTrackedImpression = (itemId: string) => {
    return trackedImpressions.current.has(itemId);
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, hasTrackedImpression }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return ctx;
}
