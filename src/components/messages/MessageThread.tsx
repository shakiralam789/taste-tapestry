"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Loader2, CheckCheck } from "lucide-react";
import { TypingIndicator } from "./TypingIndicator";
import { getMessages } from "@/features/messages/api";
import type { Message } from "@/types/messages";
import { cn } from "@/lib/utils";

interface MessageThreadProps {
    conversationId: string;
    myUserId: string;
    messages: Message[];
    onOlderMessages: (msgs: Message[]) => void;
    isPartnerTyping: boolean;
}

function dateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
}

export function MessageThread({
    conversationId,
    myUserId,
    messages,
    onOlderMessages,
    isPartnerTyping,
}: MessageThreadProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const isFirstLoad = useRef(true);

    // Reset first load flag when conversation changes
    useEffect(() => {
        isFirstLoad.current = true;
    }, [conversationId]);

    // Scroll to bottom on first load & new messages
    useEffect(() => {
        if (!containerRef.current) return;

        const scroll = () => {
            if (isFirstLoad.current) {
                containerRef.current!.scrollTop = containerRef.current!.scrollHeight;
                isFirstLoad.current = false;
            } else {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        };

        // Use a small delay to ensure content is measured after render
        const timeout = setTimeout(scroll, 50);
        return () => clearTimeout(timeout);
    }, [messages.length, conversationId]);

    // Infinite scroll upward — load older messages
    const loadOlder = useCallback(async () => {
        if (loadingOlder || !hasMore || messages.length === 0) return;
        setLoadingOlder(true);
        const oldest = messages[0];
        try {
            const older = await getMessages(conversationId, 20, oldest.createdAt);
            if (older.length === 0) {
                setHasMore(false);
            } else {
                // Preserve scroll position
                const container = containerRef.current;
                const prevHeight = container?.scrollHeight ?? 0;
                onOlderMessages(older);
                requestAnimationFrame(() => {
                    if (container) {
                        container.scrollTop = container.scrollHeight - prevHeight;
                    }
                });
            }
        } finally {
            setLoadingOlder(false);
        }
    }, [loadingOlder, hasMore, messages, conversationId, onOlderMessages]);

    useEffect(() => {
        const sentinel = topSentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) void loadOlder();
            },
            { threshold: 0.1 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadOlder]);

    // Group messages by date
    const grouped: { label: string; msgs: Message[] }[] = [];
    for (const msg of messages) {
        const label = dateLabel(msg.createdAt);
        const last = grouped[grouped.length - 1];
        if (last && last.label === label) {
            last.msgs.push(msg);
        } else {
            grouped.push({ label, msgs: [msg] });
        }
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto flex flex-col gap-1 px-4 py-4"
        >
            {/* Top sentinel for infinite scroll */}
            <div ref={topSentinelRef} className="h-1" />

            {loadingOlder && (
                <div className="flex justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
            )}

            {!hasMore && messages.length > 0 && (
                <p className="text-center text-xs text-muted-foreground/50 py-2">
                    Beginning of conversation
                </p>
            )}

            {grouped.map(({ label, msgs }) => (
                <div key={label}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-muted-foreground/60 font-medium">
                            {label}
                        </span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {msgs.map((msg) => {
                        const isMine = msg.senderId === myUserId;
                        const isRead =
                            isMine && msg.readBy.some((id) => id !== myUserId);

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex mb-1",
                                    isMine ? "justify-end" : "justify-start",
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed break-words",
                                        isMine
                                            ? "bg-primary text-primary-foreground rounded-br-sm"
                                            : "bg-muted/60 border border-white/10 rounded-bl-sm",
                                    )}
                                >
                                    <p>{msg.content}</p>
                                    <div
                                        className={cn(
                                            "flex items-center gap-1 mt-0.5 text-[10px] opacity-60",
                                            isMine ? "justify-end" : "justify-start",
                                        )}
                                    >
                                        <span>
                                            {format(new Date(msg.createdAt), "h:mm a")}
                                        </span>
                                        {isMine && (
                                            <CheckCheck
                                                className={cn(
                                                    "w-3 h-3",
                                                    isRead ? "text-blue-400" : "opacity-60",
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}

            {isPartnerTyping && (
                <div className="flex justify-start mt-1">
                    <div className="bg-muted/60 border border-white/10 rounded-2xl rounded-bl-sm">
                        <TypingIndicator />
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
}
