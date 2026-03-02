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
      socket = io("http://localhost:4000", {
        withCredentials: true,
        auth: { userId: user.id },
      });
    } else {
      socket.auth = { userId: user.id };
      socket.connect();
    }

    const handleNotification = (payload: any) => {
      if (payload?.type === "follow") {
        addNotification({
          type: "follow",
          title: payload.removed ? "Follower removed" : "New follower",
          description: "",
        });
        // Whether follow or unfollow, refresh profile counts
        if (!payload.removed) {
          toast("You have a new follower.");
        }
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      } else if (payload?.type === "favorite_love") {
        addNotification({
          type: "favorite_love",
          title: payload.loved ? "Favorite loved" : "Love removed",
          description: "",
        });
        if (payload.loved) {
          toast("Someone loved your favorite.");
        }
        queryClient.invalidateQueries({ queryKey: ["favorites"] });
      } else if (payload?.type === "capsule_love") {
        addNotification({
          type: "capsule_love",
          title: payload.loved ? "Capsule loved" : "Love removed",
          description: "",
        });
        if (payload.loved) {
          toast("Someone loved your capsule.");
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

