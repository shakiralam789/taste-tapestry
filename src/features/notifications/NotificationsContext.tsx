"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type AppNotification = {
  id: string;
  type: "follow" | "favorite_love" | "capsule_love" | "other";
  title: string;
  description?: string;
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification: NotificationsContextValue["addNotification"] = (n) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = n.createdAt ?? new Date();
    setNotifications((prev) => {
      const next: AppNotification[] = [
        { ...n, id, createdAt, read: false },
        ...prev,
      ];
      // keep only latest 20
      return next.slice(0, 20);
    });
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

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

