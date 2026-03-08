"use client";

import { useCallback, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/features/auth/AuthContext";

let socket: Socket | null = null;

export function useNotificationsSocket() {
  const { user } = useAuth();

  const getSocket = useCallback(() => {
    if (socket) return socket;
    
    // Clean URL: remove /api suffix if present to connect to the socket server root
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const socketUrl = baseUrl.replace(/\/api$/, "");
    
    socket = io(socketUrl, {
      withCredentials: true,
      auth: { userId: user?.id },
      autoConnect: false, // We'll connect manually
    });
    
    return socket;
  }, [user?.id]);

  const joinCapsule = useCallback((capsuleId: string) => {
    const s = getSocket();
    s.emit("joinCapsule", capsuleId);
  }, [getSocket]);

  const leaveCapsule = useCallback((capsuleId: string) => {
    const s = getSocket();
    s.emit("leaveCapsule", capsuleId);
  }, [getSocket]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    const s = getSocket();
    s.auth = { userId: user.id };
    if (!s.connected) {
      s.connect();
    }
  }, [user, getSocket]);

  return { socket: getSocket(), joinCapsule, leaveCapsule };
}
