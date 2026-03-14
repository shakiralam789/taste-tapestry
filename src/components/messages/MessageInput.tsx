"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Paperclip, X, FileIcon, Loader2, Reply, Edit2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Message, type MessageMediaItem } from "@/types/messages";

const MAX_ATTACHMENTS = 10;

interface MessageInputProps {
    onSend: (
        content: string,
        type?: "text" | "image" | "video" | "file",
        mediaUrl?: string,
        fileName?: string,
        fileSize?: number,
        replyToId?: string,
        media?: MessageMediaItem[]
    ) => void;
    onEdit?: (id: string, content: string) => void;
    onTypingChange: (typing: boolean) => void;
    disabled?: boolean;
    editingMessage?: Message | null;
    replyingToMessage?: Message | null;
    onCancelAction?: () => void;
}

export function MessageInput({
    onSend,
    onEdit,
    onTypingChange,
    disabled,
    editingMessage,
    replyingToMessage,
    onCancelAction,
}: MessageInputProps) {
    const [value, setValue] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const typingRef = useRef(false);
    const stopTypingTimeout = useRef<ReturnType<typeof setTimeout>>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        const allowed = files.slice(0, MAX_ATTACHMENTS);
        if (files.length > MAX_ATTACHMENTS) {
            toast.info(`Only the first ${MAX_ATTACHMENTS} files will be sent.`);
        }
        setSelectedFiles(allowed);

        const urls: string[] = new Array(allowed.length).fill("");
        const imageCount = allowed.filter((f) => f.type.startsWith("image/")).length;
        let loaded = 0;
        const maybeDone = () => {
            loaded++;
            if (loaded === imageCount || imageCount === 0) setUploadPreviews([...urls]);
        };
        allowed.forEach((file, i) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    urls[i] = (ev.target?.result as string) ?? "";
                    maybeDone();
                };
                reader.readAsDataURL(file);
            }
        });
        if (imageCount === 0) setUploadPreviews(urls);
    };

    const handleRemoveFile = (index?: number) => {
        if (index !== undefined) {
            setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
            setUploadPreviews((prev) => prev.filter((_, i) => i !== index));
        } else {
            setSelectedFiles([]);
            setUploadPreviews([]);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Populate input when editing
    useEffect(() => {
        if (editingMessage) {
            setValue(editingMessage.content);
        } else if (!replyingToMessage) {
            setValue("");
        }
    }, [editingMessage, replyingToMessage]);

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

    const handleSubmit = useCallback(async () => {
        const trimmed = value.trim();
        const hasFiles = selectedFiles.length > 0;
        if ((!trimmed && !hasFiles) || disabled || isUploading) return;

        if (editingMessage) {
            onEdit?.(editingMessage.id, trimmed);
            onCancelAction?.();
            setValue("");
            return;
        }

        let type: "text" | "image" | "video" | "file" = "text";
        let mediaUrl = "";
        let fileName = "";
        let fileSize = 0;
        let media: MessageMediaItem[] | undefined;

        if (hasFiles) {
            setIsUploading(true);
            try {
                const uploaded: MessageMediaItem[] = [];
                for (const file of selectedFiles) {
                    const itemType = file.type.startsWith("image/")
                        ? "image"
                        : file.type.startsWith("video/")
                          ? "video"
                          : "file";
                    const res = await uploadToCloudinary(
                        file,
                        itemType === "video" ? "video" : "image"
                    );
                    uploaded.push({
                        url: res.original_url,
                        type: itemType,
                        fileName: file.name,
                        fileSize: file.size,
                    });
                }
                media = uploaded;
                const first = uploaded[0]!;
                type = first.type as "image" | "video" | "file";
                mediaUrl = first.url;
                fileName = first.fileName ?? "";
                fileSize = first.fileSize ?? 0;
            } catch (err) {
                console.error("Upload failed:", err);
                toast.error("Failed to upload media");
                setIsUploading(false);
                return;
            } finally {
                setIsUploading(false);
            }
        }

        onSend(
            trimmed,
            type,
            mediaUrl,
            fileName,
            fileSize,
            replyingToMessage?.id,
            media
        );

        setValue("");
        handleRemoveFile();
        onCancelAction?.();

        clearTimeout(stopTypingTimeout.current);
        typingRef.current = false;
        onTypingChange(false);
    }, [value, selectedFiles, disabled, isUploading, onSend, onEdit, onTypingChange, editingMessage, replyingToMessage, onCancelAction]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col border-t border-white/10 bg-background/80 backdrop-blur-sm">
            {/* Media Preview — multiple */}
            {selectedFiles.length > 0 && (
                <div className="px-4 py-2 border-b border-white/5 bg-white/5 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 flex-wrap">
                        {selectedFiles.map((file, i) => (
                            <div
                                key={`${file.name}-${i}`}
                                className="flex items-center gap-2 rounded-lg bg-black/20 border border-white/10 p-1.5"
                            >
                                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-black/20 flex items-center justify-center shrink-0">
                                    {uploadPreviews[i] ? (
                                        <img src={uploadPreviews[i]} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <FileIcon className="w-6 h-6 text-primary/60" />
                                    )}
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 max-w-[120px]">
                                    <p className="text-xs font-medium truncate">{file.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-white/10 shrink-0"
                                    onClick={() => handleRemoveFile(i)}
                                    disabled={isUploading}
                                    aria-label="Remove"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                        {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} • send with message
                    </p>
                </div>
            )}

            {/* Editing / Replying Banner */}
            {(editingMessage || replyingToMessage) && (
                <div className="px-4 py-3 flex items-center gap-3 border-b border-primary/20 bg-primary/5 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="p-2 rounded-lg bg-primary/10">
                        {editingMessage ? <Edit2 className="w-4 h-4 text-primary" /> : <Reply className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-primary mb-0.5">
                            {editingMessage ? "Editing message" : `Replying to message`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate italic opacity-80">
                            "{(editingMessage || replyingToMessage)?.content || "Attachment"}"
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-white/10"
                        onClick={onCancelAction}
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
                    accept="image/*,video/*"
                    multiple
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
                    placeholder={isUploading ? "Uploading..." : "Type a message…"}
                    rows={1}
                    disabled={disabled || isUploading}
                    className="resize-none min-h-[40px] max-h-32 flex-1 rounded-2xl bg-muted/50 border-white/10 text-sm focus-visible:ring-1"
                    style={{ height: "auto" }}
                    aria-label="Message input"
                />

                <Button
                    size="icon"
                    onClick={handleSubmit}
                    disabled={(!value.trim() && selectedFiles.length === 0) || disabled || isUploading}
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
