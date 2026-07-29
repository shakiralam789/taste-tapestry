"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
    type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/features/auth/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/api-client";

export type PartnerInfo = {
    id: string;
    displayName: string;
    username: string;
    avatar: string | null;
};

export type ChatBoxState = {
    partner: PartnerInfo;
};

type MessagesContextValue = {
    socket: Socket | null;
    connected: boolean;
    isChatOpen: boolean;
    setIsChatOpen: (isOpen: boolean) => void;
    openChatBoxes: ChatBoxState[];
    openChatBox: (partner: PartnerInfo) => void;
    closeChatBox: (partnerId: string) => void;
};

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

export function MessagesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const [openChatBoxes, setOpenChatBoxes] = useState<ChatBoxState[]>([]);

    useEffect(() => {
        if (!user) {
            setOpenChatBoxes([]);
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

            const invalidateDebounceRef = { current: null as NodeJS.Timeout | null };
            const triggerInvalidate = () => {
                if (invalidateDebounceRef.current) clearTimeout(invalidateDebounceRef.current);
                invalidateDebounceRef.current = setTimeout(() => {
                    void queryClient.invalidateQueries({ queryKey: ["conversations"], exact: true });
                    invalidateDebounceRef.current = null;
                }, 300);
            };

            // Real-time unread count update
            s.on("messages:unread_count", (data: { count: number }) => {
                // Update the React Query cache instantly
                queryClient.setQueryData(["messages", "unread-count"], data.count);
            });

            // Unified reactive invalidation
            s.on("messages:new", triggerInvalidate);
            s.on("messages:read", triggerInvalidate);
            s.on("messages:updated", triggerInvalidate);

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

    const [isChatOpen, setIsChatOpen] = useState(false);

    const openChatBox = useCallback((partner: PartnerInfo) => {
        setOpenChatBoxes((prev) => {
            if (prev.some((box) => box.partner.id === partner.id)) {
                // Move existing box to the end (most recent)
                const filtered = prev.filter((box) => box.partner.id !== partner.id);
                return [...filtered, prev.find((box) => box.partner.id === partner.id)!];
            }
            const next = [...prev, { partner }];
            if (next.length > 3) {
                return next.slice(next.length - 3);
            }
            return next;
        });
    }, []);

    const closeChatBox = useCallback((partnerId: string) => {
        setOpenChatBoxes((prev) => prev.filter((box) => box.partner.id !== partnerId));
    }, []);

    const value = useMemo(() => ({
        socket: socketRef.current,
        connected,
        isChatOpen,
        setIsChatOpen,
        openChatBoxes,
        openChatBox,
        closeChatBox
    }), [connected, isChatOpen, openChatBoxes, openChatBox, closeChatBox]);

    return (
        <MessagesContext.Provider value={value}>
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
