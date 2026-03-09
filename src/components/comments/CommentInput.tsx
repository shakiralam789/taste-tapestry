"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/features/users/api";
import { Send, Smile, AtSign, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface CommentInputProps {
    onSubmit: (content: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
    isSmall?: boolean;
    initialValue?: string;
    onCancel?: () => void;
}

export function CommentInput({
    onSubmit,
    placeholder = "Write a comment...",
    autoFocus,
    className,
    isSmall = false,
    initialValue = "",
    onCancel
}: CommentInputProps) {
    const [content, setContent] = useState(initialValue);
    const [mentionSearch, setMentionSearch] = useState("");
    const [isMentionOpen, setIsMentionOpen] = useState(false);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mentionRef = useRef<HTMLDivElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursorPos, setCursorPos] = useState(0);
    const [mentionDropdownDirection, setMentionDropdownDirection] = useState<"up" | "down">("up");
    const [emojiDropdownDirection, setEmojiDropdownDirection] = useState<"up" | "down">("up");

    const debouncedSearch = useDebounce(mentionSearch, 300);

    const { data: users = [] } = useQuery({
        queryKey: ["users-search", debouncedSearch],
        queryFn: () => searchUsers(debouncedSearch),
        enabled: isMentionOpen,
    });

    useEffect(() => {
        if (autoFocus) {
            textareaRef.current?.focus();
        }
    }, [autoFocus]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mentionRef.current && !mentionRef.current.contains(event.target as Node)) {
                setIsMentionOpen(false);
            }
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                // Check if we clicked the trigger button as well to avoid immediate re-opening
                const target = event.target as HTMLElement;
                if (!target.closest('.emoji-trigger')) {
                    setIsEmojiOpen(false);
                }
            }
        };

        if (isMentionOpen || isEmojiOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMentionOpen, isEmojiOpen]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const position = e.target.selectionStart;
        setContent(value);
        setCursorPos(position);

        // Check for @ trigger
        const lastAtIdx = value.lastIndexOf("@", position - 1);
        if (lastAtIdx !== -1) {
            const query = value.slice(lastAtIdx + 1, position);
            if (!query.includes(" ")) {
                setMentionSearch(query);

                // Calculate direction before opening
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const spaceAbove = rect.top;
                    const dropdownHeight = 280; // Buffer for max height
                    const direction = spaceAbove < dropdownHeight ? "down" : "up";
                    console.log("[Mention] rect.top:", rect.top, "direction:", direction);
                    setMentionDropdownDirection(direction);
                }

                setIsMentionOpen(true);
                return;
            }
        }
        setIsMentionOpen(false);
    };

    const insertMention = (username: string) => {
        const lastAtIdx = content.lastIndexOf("@", cursorPos - 1);
        const before = content.slice(0, lastAtIdx);
        const after = content.slice(cursorPos);
        const newContent = `${before}@${username} ${after}`;
        setContent(newContent);
        setIsMentionOpen(false);
        textareaRef.current?.focus();
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!content.trim()) return;
        onSubmit(content);
        setContent("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && !isMentionOpen) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const insertEmoji = (emoji: string) => {
        const position = textareaRef.current?.selectionStart || content.length;
        const before = content.slice(0, position);
        const after = content.slice(position);
        setContent(`${before}${emoji}${after}`);
        textareaRef.current?.focus();
    };

    const popularEmojis = ["😀", "😂", "🥰", "😍", "🤩", "😊", "🤔", "🧐", "🙄", "😤", "😭", "😮", "😴", "😋", "😎", "✨", "🔥", "❤️", "👍", "🙌", "🎉", "💯", "🚀", "🌈"];

    return (
        <div ref={containerRef} className={cn("relative flex flex-col gap-2", className)}>
            <div className="relative flex flex-col bg-background border border-border rounded-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    data-gramm="false"
                    className={cn(
                        "w-full p-3 bg-transparent resize-none focus:outline-none text-sm rounded-t-xl",
                        isSmall ? "min-h-[45px]" : "min-h-[80px]"
                    )}
                />

                <div className="flex items-center justify-between px-2 pb-2 gap-1 border-t border-border/10 rounded-b-xl bg-muted/5">
                    <div className="flex items-center">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => {
                                setMentionSearch("");
                                if (containerRef.current) {
                                    const rect = containerRef.current.getBoundingClientRect();
                                    const spaceAbove = rect.top;
                                    setMentionDropdownDirection(spaceAbove < 280 ? "down" : "up");
                                }
                                setIsEmojiOpen(false); // Close emoji if mention opens
                                setIsMentionOpen(true);
                            }}
                        >
                            <AtSign className="w-3.5 h-3.5" />
                        </Button>

                        <div className="relative">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7 text-muted-foreground hover:text-primary emoji-trigger", isEmojiOpen && "text-primary bg-primary/10")}
                                onClick={() => {
                                    if (containerRef.current) {
                                        const rect = containerRef.current.getBoundingClientRect();
                                        setEmojiDropdownDirection(rect.top < 280 ? "down" : "up");
                                    }
                                    setIsEmojiOpen(!isEmojiOpen);
                                    setIsMentionOpen(false); // Close mention if emoji opens
                                }}
                            >
                                <Smile className="w-3.5 h-3.5" />
                            </Button>

                            {isEmojiOpen && (
                                <div
                                    ref={emojiRef}
                                    className={cn(
                                        "absolute z-50 w-64 bg-background border border-border shadow-xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                                        emojiDropdownDirection === "up" ? "bottom-full mb-2" : "top-full mt-2",
                                        "left-0"
                                    )}
                                >
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/50">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pick an emoji</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsEmojiOpen(false)}
                                            className="p-1 hover:bg-muted rounded-md transition-colors"
                                        >
                                            <X className="w-3 h-3 text-muted-foreground" />
                                        </button>
                                    </div>
                                    <div className="p-2 grid grid-cols-8 gap-1">
                                        {popularEmojis.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => insertEmoji(emoji)}
                                                className="text-lg p-1 hover:bg-muted rounded transition-colors"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onCancel}
                                className="h-7 px-2 text-[10px]"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            size="icon"
                            className={cn(
                                "rounded-lg transition-all",
                                isSmall ? "h-7 w-7" : "h-8 w-8"
                            )}
                            disabled={!content.trim()}
                            onClick={() => handleSubmit()}
                        >
                            <Send className={cn(isSmall ? "w-3 h-3" : "w-4 h-4")} />
                        </Button>
                    </div>
                </div>
            </div>

            {isMentionOpen && (
                <div
                    ref={mentionRef}
                    className={cn(
                        "absolute z-50 left-0 w-64 bg-background border border-border shadow-xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                        mentionDropdownDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
                    )}
                >
                    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/50">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mention someone</span>
                        <button
                            type="button"
                            onClick={() => setIsMentionOpen(false)}
                            className="p-1 hover:bg-muted rounded-md transition-colors"
                        >
                            <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                    </div>
                    <Command className="rounded-xl border-none" shouldFilter={false}>
                        <CommandInput
                            placeholder="Search user..."
                            value={mentionSearch}
                            onValueChange={setMentionSearch}
                            autoFocus
                        />
                        <CommandList className="max-h-[200px]">
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup heading="People">
                                {users.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        onSelect={() => insertMention(user.username)}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src={user.avatar ?? undefined} />
                                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium">{user.displayName || user.username}</span>
                                            <span className="text-[10px] text-muted-foreground">@{user.username}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            )}
        </div>
    );
}
