"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Notification, NotificationType } from "@/types/notifications";
import { getNotifications, getUnreadNotificationsCount, markAllNotificationsAsRead, markNotificationAsRead } from "./api";
import { useAuth } from "@/features/auth/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationsSocket } from "./useNotificationsSocket";
import { toast } from "sonner";

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /** Re-fetch the notifications list. Call when the bell dropdown opens. */
  refresh: () => void;
  joinCapsule: (id: string) => void;
  leaveCapsule: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket, joinCapsule, leaveCapsule } = useNotificationsSocket();

  // The list query is lazy: it never fetches on mount. The navbar bell
  // calls `refresh()` when it opens the dropdown. The query stays enabled
  // afterwards so socket-driven invalidations still refresh the visible list.
  const [listEnabled, setListEnabled] = useState(false);
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(50),
    enabled: !!user && listEnabled,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadNotificationsCount,
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (payload: any) => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });

      switch (payload.type) {
        case NotificationType.MENTION:
          toast(`@${payload.actor?.username || 'Someone'} mentioned you`);
          break;
        case NotificationType.NEW_COMMENT:
          toast(`${payload.actor?.username || 'Someone'} commented on your capsule`);
          break;
        case NotificationType.NEW_REPLY:
          toast(`${payload.actor?.username || 'Someone'} replied to your comment`);
          break;
        case NotificationType.REACTION:
          toast(`${payload.actor?.username || 'Someone'} reacted to your content`);
          break;
        default:
          toast("New activity notification");
      }
    };

    const handleCapsuleUpdate = (payload: any) => {
      const handledTypes = ['comment', 'comment_edit', 'comment_delete', 'reaction', 'love'];
      if (handledTypes.includes(payload.type)) {
        void queryClient.invalidateQueries({ queryKey: ["comments", payload.capsuleId] });
        if (payload.capsuleId) {
          void queryClient.invalidateQueries({ queryKey: ["capsule", payload.capsuleId] });
        }
        void queryClient.invalidateQueries({ queryKey: ["capsules"] });
        void queryClient.invalidateQueries({ queryKey: ["user-capsules"] });
      }
    };

    socket.on("notification", handleNotification);
    socket.on("capsule_update", handleCapsuleUpdate);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("capsule_update", handleCapsuleUpdate);
    };
  }, [socket, user, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: async (id) => {
      await markReadMutation.mutateAsync(id);
    },
    markAllRead: async () => {
      await markAllReadMutation.mutateAsync();
    },
    refresh: () => {
      setListEnabled(true);
      void refetch();
    },
    joinCapsule,
    leaveCapsule,
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
