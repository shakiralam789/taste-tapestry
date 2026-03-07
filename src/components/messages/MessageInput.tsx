"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal } from "lucide-react";

interface MessageInputProps {
    onSend: (content: string) => void;
    onTypingChange: (typing: boolean) => void;
    disabled?: boolean;
}

export function MessageInput({ onSend, onTypingChange, disabled }: MessageInputProps) {
    const [value, setValue] = useState("");
    const typingRef = useRef(false);
    const stopTypingTimeout = useRef<ReturnType<typeof setTimeout>>();

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setValue(e.target.value);

            if (!typingRef.current) {
                typingRef.current = true;
                onTypingChange(true);
            }

            clearTimeout(stopTypingTimeout.current);
            stopTypingTimeout.current = setTimeout(() => {
                typingRef.current = false;
                onTypingChange(false);
            }, 1500);
        },
        [onTypingChange],
    );

    const handleSend = useCallback(() => {
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setValue("");
        clearTimeout(stopTypingTimeout.current);
        typingRef.current = false;
        onTypingChange(false);
    }, [value, onSend, onTypingChange, disabled]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    return (
        <div className="flex items-end gap-2 p-3 border-t border-white/10 bg-background/80 backdrop-blur-sm">
            <Textarea
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send)"
                rows={1}
                disabled={disabled}
                className="resize-none min-h-[40px] max-h-32 flex-1 rounded-2xl bg-muted/50 border-white/10 text-sm focus-visible:ring-1"
                style={{ height: "auto" }}
                aria-label="Message input"
            />
            <Button
                size="icon"
                onClick={handleSend}
                disabled={!value.trim() || disabled}
                className="rounded-full shrink-0 w-10 h-10"
                aria-label="Send message"
            >
                <SendHorizonal className="w-4 h-4" />
            </Button>
        </div>
    );
}
