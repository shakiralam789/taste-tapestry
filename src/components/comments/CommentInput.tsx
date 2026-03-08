"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/features/users/api";
import { Send, Smile, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentInputProps {
    onSubmit: (content: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
}

export function CommentInput({ onSubmit, placeholder = "Write a comment...", autoFocus, className }: CommentInputProps) {
    const [content, setContent] = useState("");
    const [mentionSearch, setMentionSearch] = useState("");
    const [isMentionOpen, setIsMentionOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [cursorPos, setCursorPos] = useState(0);

    const { data: users = [] } = useQuery({
        queryKey: ["users-search", mentionSearch],
        queryFn: () => searchUsers(mentionSearch),
        enabled: isMentionOpen,
    });

    useEffect(() => {
        if (autoFocus) {
            textareaRef.current?.focus();
        }
    }, [autoFocus]);

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

    return (
        <div className={cn("relative flex flex-col gap-2", className)}>
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full min-h-[80px] p-3 pt-4 bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />

                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => setIsMentionOpen(true)}
                    >
                        <AtSign className="w-4 h-4" />
                    </Button>
                    <Button
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        disabled={!content.trim()}
                        onClick={() => handleSubmit()}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {isMentionOpen && (
                <div className="absolute z-50 bottom-full mb-2 left-0 w-64 bg-background border border-border shadow-xl rounded-xl overflow-hidden">
                    <Command className="rounded-xl border-none">
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
