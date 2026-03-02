"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppNotification = {
  id: string;
  type: "follow" | "favorite_love" | "capsule_love" | "other";
  title: string;
  description?: string;
  actorId?: string;
  actorDisplayName?: string;
  actorAvatar?: string | null;
  createdAt: Date;
  read: boolean;
};

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read"> & { createdAt?: Date }) => void;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("wishbook_notifications");
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Array<
        Omit<AppNotification, "createdAt"> & { createdAt: string }
      >;
      return parsed.map((n) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));
    } catch {
      return [];
    }
  });

  const addNotification: NotificationsContextValue["addNotification"] = (n) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = n.createdAt ?? new Date();
    setNotifications((prev) => {
      const next: AppNotification[] = [
        { ...n, id, createdAt, read: false },
        ...prev,
      ];
      // keep only latest 100 in memory/storage
      return next.slice(0, 100);
    });
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  // Persist to localStorage whenever notifications change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const serializable = notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }));
      window.localStorage.setItem(
        "wishbook_notifications",
        JSON.stringify(serializable),
      );
    } catch {
      // ignore storage errors
    }
  }, [notifications]);

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    addNotification,
    markAllRead,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}

