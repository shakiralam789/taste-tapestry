"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/features/auth/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/api-client";

type MessagesContextValue = {
    socket: Socket | null;
    connected: boolean;
};

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

export function MessagesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        if (!socketRef.current) {
            const baseUrl =
                process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ??
                "http://localhost:4000";

            const s = io(`${baseUrl}/messages`, {
                auth: { token: getAccessToken() },
                transports: ["websocket", "polling"],
            });

            s.on("connect", () => setConnected(true));
            s.on("disconnect", () => setConnected(false));

            // Real-time unread count update
            s.on("messages:unread_count", (data: { count: number }) => {
                // Update the React Query cache instantly
                queryClient.setQueryData(["messages", "unread-count"], data.count);
            });

            // Also invalidate on new messages just in case
            s.on("messages:new", () => {
                void queryClient.invalidateQueries({ queryKey: ["messages", "unread-count"] });
                void queryClient.invalidateQueries({ queryKey: ["conversations"] });
            });

            s.on("messages:read", () => {
                void queryClient.invalidateQueries({ queryKey: ["messages", "unread-count"] });
                void queryClient.invalidateQueries({ queryKey: ["conversations"] });
            });

            socketRef.current = s;
        } else {
            // Token might have refreshed or user changed
            socketRef.current.auth = { token: getAccessToken() };
            if (socketRef.current.disconnected) {
                socketRef.current.connect();
            }
        }

        return () => {
            // We don't necessarily want to disconnect on every re-render of layout
            // but if the component truly unmounts (e.g. logout), we should.
            // However, layout usually stays mounted.
        };
    }, [user, queryClient]);

    return (
        <MessagesContext.Provider value={{ socket: socketRef.current, connected }}>
            {children}
        </MessagesContext.Provider>
    );
}

export function useMessages() {
    const ctx = useContext(MessagesContext);
    if (!ctx) {
        throw new Error("useMessages must be used within MessagesProvider");
    }
    return ctx;
}
