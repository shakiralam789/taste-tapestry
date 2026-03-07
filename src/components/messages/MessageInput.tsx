"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Paperclip, X, FileIcon, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageInputProps {
    onSend: (
        content: string,
        type?: "text" | "image" | "video" | "file",
        mediaUrl?: string,
        fileName?: string,
        fileSize?: number
    ) => void;
    onTypingChange: (typing: boolean) => void;
    disabled?: boolean;
}

export function MessageInput({ onSend, onTypingChange, disabled }: MessageInputProps) {
    const [value, setValue] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const typingRef = useRef(false);
    const stopTypingTimeout = useRef<ReturnType<typeof setTimeout>>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (prev) => setUploadPreview(prev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setUploadPreview(null);
        }
    };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        setUploadPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

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

    const handleSend = useCallback(async () => {
        const trimmed = value.trim();
        if ((!trimmed && !selectedFile) || disabled || isUploading) return;

        let type: "text" | "image" | "video" | "file" = "text";
        let mediaUrl = "";
        let fileName = "";
        let fileSize = 0;

        if (selectedFile) {
            setIsUploading(true);
            try {
                if (selectedFile.type.startsWith("image/")) type = "image";
                else if (selectedFile.type.startsWith("video/")) type = "video";
                else type = "file";

                fileName = selectedFile.name;
                fileSize = selectedFile.size;

                mediaUrl = await uploadToCloudinary(
                    selectedFile,
                    type === "video" ? "video" : "image"
                );
            } catch (err) {
                console.error("Upload failed:", err);
                toast.error("Failed to upload media");
                setIsUploading(false);
                return;
            } finally {
                setIsUploading(false);
            }
        }

        onSend(trimmed, type, mediaUrl, fileName, fileSize);
        setValue("");
        clearSelectedFile();

        clearTimeout(stopTypingTimeout.current);
        typingRef.current = false;
        onTypingChange(false);
    }, [value, selectedFile, disabled, isUploading, onSend, onTypingChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col border-t border-white/10 bg-background/80 backdrop-blur-sm">
            {/* Media Preview */}
            {(uploadPreview || selectedFile) && (
                <div className="px-4 py-2 flex items-center gap-3 border-b border-white/5 bg-white/5 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center shrink-0 border border-white/10">
                        {uploadPreview ? (
                            <img src={uploadPreview} className="w-full h-full object-cover" />
                        ) : (
                            <FileIcon className="w-6 h-6 text-primary/60" />
                        )}
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{selectedFile?.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                            {selectedFile ? (selectedFile.size / 1024).toFixed(0) : 0} KB
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-white/10"
                        onClick={clearSelectedFile}
                        disabled={isUploading}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            <div className="flex items-end gap-2 p-3">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    aria-label="Attach file"
                >
                    <Paperclip className="w-5 h-5" />
                </Button>

                <Textarea
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={isUploading ? "Uploading..." : "Type a message… (Enter to send)"}
                    rows={1}
                    disabled={disabled || isUploading}
                    className="resize-none min-h-[40px] max-h-32 flex-1 rounded-2xl bg-muted/50 border-white/10 text-sm focus-visible:ring-1"
                    style={{ height: "auto" }}
                    aria-label="Message input"
                />

                <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={(!value.trim() && !selectedFile) || disabled || isUploading}
                    className="rounded-full shrink-0 w-10 h-10 shadow-lg shadow-primary/20"
                    aria-label="Send message"
                >
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <SendHorizonal className="w-4 h-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
