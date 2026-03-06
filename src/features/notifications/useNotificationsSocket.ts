"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/features/auth/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "./NotificationsContext";

let socket: Socket | null = null;

export function useNotificationsSocket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
        withCredentials: true,
        auth: { userId: user.id },
      });
    } else {
      socket.auth = { userId: user.id };
      socket.connect();
    }

    const handleNotification = (payload: any) => {
      if (payload?.type === "follow") {
        if (!payload.removed) {
          // Only notify on new follower, not when follower is removed
          addNotification({
            type: "follow",
            title: "New follower",
            description: payload.actorDisplayName
              ? `${payload.actorDisplayName} started following you`
              : "",
            actorId: payload.actorId,
            actorDisplayName: payload.actorDisplayName,
            actorAvatar: payload.actorAvatar,
          });
          toast(
            payload.actorDisplayName
              ? `${payload.actorDisplayName} started following you.`
              : "You have a new follower.",
          );
        }
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      } else if (payload?.type === "favorite_love") {
        if (payload.loved) {
          addNotification({
            type: "favorite_love",
            title: "Favorite loved",
            description: payload.actorDisplayName
              ? `${payload.actorDisplayName} loved your favorite`
              : "",
            actorId: payload.actorId,
            actorDisplayName: payload.actorDisplayName,
            actorAvatar: payload.actorAvatar,
          });
          toast(
            payload.actorDisplayName
              ? `${payload.actorDisplayName} loved your favorite.`
              : "Someone loved your favorite.",
          );
        }
        queryClient.invalidateQueries({ queryKey: ["favorites"] });
      } else if (payload?.type === "capsule_love") {
        if (payload.loved) {
          addNotification({
            type: "capsule_love",
            title: "Capsule loved",
            description: payload.actorDisplayName
              ? `${payload.actorDisplayName} loved your capsule`
              : "",
            actorId: payload.actorId,
            actorDisplayName: payload.actorDisplayName,
            actorAvatar: payload.actorAvatar,
          });
          toast(
            payload.actorDisplayName
              ? `${payload.actorDisplayName} loved your capsule.`
              : "Someone loved your capsule.",
          );
        }
        queryClient.invalidateQueries({ queryKey: ["capsules"] });
      } else {
        toast("New activity.");
      }
    };

    socket.on("notification", handleNotification);

    return () => {
      if (!socket) return;
      socket.off("notification", handleNotification);
    };
  }, [user]);
}

