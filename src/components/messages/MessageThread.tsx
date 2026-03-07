"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Loader2, CheckCheck, FileIcon, Download, PlayCircle, MoreHorizontal, Reply, Edit2, Trash2 } from "lucide-react";
import { TypingIndicator } from "./TypingIndicator";
import { getMessages } from "@/features/messages/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Message } from "@/types/messages";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface MessageThreadProps {
    conversationId: string;
    myUserId: string;
    messages: Message[];
    onOlderMessages: (msgs: Message[]) => void;
    isPartnerTyping: boolean;
    onReply?: (msg: Message) => void;
    onEdit?: (msg: Message) => void;
    onDelete?: (msgId: string) => void;
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
    onReply,
    onEdit,
    onDelete,
}: MessageThreadProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

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
                                        "relative group max-w-[75%] rounded-2xl text-sm leading-relaxed break-words transition-all",
                                        isMine
                                            ? msg.isDeleted ? "bg-muted/30 text-muted-foreground italic border border-white/5" : "bg-primary text-primary-foreground rounded-br-sm shadow-lg shadow-primary/10"
                                            : "bg-muted/60 border border-white/10 rounded-bl-sm",
                                        msg.type === "text" || msg.isDeleted ? "px-4 py-2" : "p-1",
                                    )}
                                >
                                    {/* Reply Thread Context */}
                                    {msg.replyToId && !msg.isDeleted && (
                                        <div className={cn(
                                            "mb-2 p-2 rounded-lg text-xs border-l-2 bg-black/10 flex flex-col gap-0.5",
                                            isMine ? "border-primary-foreground/30" : "border-primary"
                                        )}>
                                            {(() => {
                                                const parent = messages.find(m => m.id === msg.replyToId);
                                                if (!parent) return <span className="opacity-50 italic">Original message missing</span>;
                                                return (
                                                    <>
                                                        <span className="font-bold opacity-70">
                                                            {parent.senderId === myUserId ? "You" : "Them"}
                                                        </span>
                                                        <span className="truncate opacity-60">
                                                            {parent.isDeleted ? "This message was deleted" : parent.content || (parent.type !== 'text' ? `Attachment (${parent.type})` : "")}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {!msg.isDeleted ? (
                                        <>
                                            {msg.type === "image" && (
                                                <div className="rounded-xl overflow-hidden mb-1">
                                                    <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={msg.mediaUrl}
                                                            alt="Image attachment"
                                                            className="max-h-60 w-full object-cover hover:opacity-90 transition-opacity"
                                                        />
                                                    </a>
                                                </div>
                                            )}

                                            {msg.type === "video" && (
                                                <div className="rounded-xl overflow-hidden mb-1 bg-black/20 aspect-video flex items-center justify-center relative group">
                                                    <video
                                                        src={msg.mediaUrl}
                                                        className="max-h-60 w-full"
                                                        controls
                                                    />
                                                </div>
                                            )}

                                            {msg.type === "file" && (
                                                <a
                                                    href={msg.mediaUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors mb-1 min-w-[200px]"
                                                >
                                                    <div className="p-2 rounded-lg bg-primary/20">
                                                        <FileIcon className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate">{msg.fileName || "Attachment"}</p>
                                                        {msg.fileSize && (
                                                            <p className="text-[10px] opacity-60">
                                                                {(msg.fileSize / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Download className="w-4 h-4 opacity-40" />
                                                </a>
                                            )}

                                            {msg.content && (
                                                <p className={cn(
                                                    msg.type !== 'text' ? 'px-3 py-1 pb-2' : '',
                                                    "whitespace-pre-wrap"
                                                )}>
                                                    {msg.content}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 opacity-60">
                                            <Trash2 className="w-3 h-3" />
                                            <span>This message was deleted</span>
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "flex items-center gap-1 mt-0.5 text-[10px] opacity-60",
                                            isMine ? "justify-end" : "justify-start",
                                        )}
                                    >
                                        <span>
                                            {format(new Date(msg.createdAt), "h:mm a")}
                                        </span>
                                        {msg.isEdited && !msg.isDeleted && (
                                            <span className="italic ml-1">(edited)</span>
                                        )}
                                        {isMine && (
                                            <CheckCheck
                                                className={cn(
                                                    "w-3 h-3 ml-0.5",
                                                    isRead ? "text-blue-400" : "opacity-60",
                                                )}
                                            />
                                        )}
                                    </div>

                                    {/* Action Dropdown Toggle */}
                                    {!msg.isDeleted && (
                                        <div className={cn(
                                            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                            isMine ? "-left-12 pr-2" : "-right-12 pl-2"
                                        )}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                                                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align={isMine ? "end" : "start"} className="w-32">
                                                    <DropdownMenuItem onClick={() => onReply?.(msg)}>
                                                        <Reply className="w-4 h-4 mr-2" /> Reply
                                                    </DropdownMenuItem>
                                                    {isMine && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => onEdit?.(msg)}>
                                                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-500 focus:text-red-500"
                                                                onClick={() => {
                                                                    setMessageToDelete(msg.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
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

            <ConfirmDialog
                open={!!messageToDelete}
                onOpenChange={(open) => !open && setMessageToDelete(null)}
                title="Delete Message"
                description="Are you sure you want to delete this message? This action cannot be undone."
                confirmText="Delete for everyone"
                variant="destructive"
                onConfirm={() => {
                    if (messageToDelete) {
                        onDelete?.(messageToDelete);
                        setMessageToDelete(null);
                    }
                }}
            />
        </div>
    );
}
