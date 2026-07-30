"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Minus, MessageSquare, Loader2, Minimize2, Maximize2, Paperclip, FileIcon, Download, Trash2, MoreHorizontal, Reply, Edit2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessagesSocket } from "@/features/messages/useMessagesSocket";
import { getOrCreateConversation, getMessages, getConversations } from "@/features/messages/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Conversation, Message, MessageMediaItem } from "@/types/messages";
import type { PartnerInfo } from "@/features/messages/MessagesContext";
import { format } from "date-fns";
import { cn, getOptimizedUrl } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/upload";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface FloatingChatBoxProps {
  partner: PartnerInfo;
  onClose: () => void;
}

export function FloatingChatBox({ partner, onClose }: FloatingChatBoxProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Reply / Edit / Delete state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const {
    sendMessage: socketSendMessage,
    editMessage: socketEditMessage,
    deleteMessage: socketDeleteMessage,
    sendTyping,
    sendRead,
    joinConversation,
  } = useMessagesSocket({
    onNewMessage: (msg) => {
      if (conversation && msg.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.senderId !== user?.id) {
          sendRead(conversation.id);
        }
      }
    },
    onTyping: (event) => {
      if (conversation && event.conversationId === conversation.id && event.userId === partner.id) {
        setIsPartnerTyping(event.typing);
      }
    },
    onRead: (event) => {
      if (conversation && event.conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((m) =>
            event.messageIds.includes(m.id)
              ? { ...m, readBy: [...new Set([...m.readBy, event.userId])] }
              : m
          )
        );
      }
    },
    onUpdate: (msg) => {
      if (conversation && msg.conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? msg : m))
        );
      }
    },
    onUserOnline: (event) => {
      if (event.userId === partner.id) {
        setIsOnline(true);
      }
    },
    onUserOffline: (event) => {
      if (event.userId === partner.id) {
        setIsOnline(false);
      }
    },
  });

  // Resolve conversation on mount
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        setLoading(true);
        // Look up in cache first
        const cache = queryClient.getQueryData<Conversation[]>(["conversations"]);
        let existing = cache?.find((c) => c.participantIds.includes(partner.id));

        if (!existing) {
          // Fallback to fetch conversations list
          const list = await getConversations();
          existing = list.find((c) => c.participantIds.includes(partner.id));
        }

        if (active) {
          if (existing) {
            setConversation(existing);
            joinConversation(existing.id);
            const msgs = await getMessages(existing.id, 40);
            if (active) {
              setMessages(msgs);
              setLoading(false);
              sendRead(existing.id);
            }
          } else {
            // No existing convo yet, wait until message is sent
            setConversation(null);
            setMessages([]);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to load chat:", err);
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [partner.id, joinConversation, sendRead, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!isMinimized && !loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized, loading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const allowed = files.slice(0, 5);
    if (files.length > 5) {
      toast.info("Only the first 5 files will be sent.");
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
      setInputValue(editingMessage.content);
    }
  }, [editingMessage]);

  const handleCancelAction = () => {
    setReplyingTo(null);
    setEditingMessage(null);
    setInputValue("");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    const hasFiles = selectedFiles.length > 0;
    if ((!trimmed && !hasFiles) || loading || isUploading) return;

    // Handle edit
    if (editingMessage) {
      socketEditMessage(editingMessage.id, trimmed);
      setEditingMessage(null);
      setInputValue("");
      return;
    }

    let convo = conversation;
    if (!convo) {
      try {
        setLoading(true);
        convo = await getOrCreateConversation(partner.id);
        setConversation(convo);
        joinConversation(convo.id);
        // Invalidate list so it gets added to Navbar dropdown list
        void queryClient.invalidateQueries({ queryKey: ["conversations"], exact: true });
        setLoading(false);
      } catch (err) {
        console.error("Failed to create conversation on send:", err);
        setLoading(false);
        return;
      }
    }

    if (convo) {
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

      socketSendMessage(
        convo.id,
        trimmed,
        type,
        mediaUrl,
        fileName,
        fileSize,
        replyingTo?.id,
        media
      );
      
      // Stop typing immediately on send
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTyping(convo.id, false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      setInputValue("");
      setReplyingTo(null);
      handleRemoveFile();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!conversation) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(conversation.id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && conversation) {
        isTypingRef.current = false;
        sendTyping(conversation.id, false);
      }
    }, 2000);
  };

  const nameInitials = (partner.displayName || partner.username || "?")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-72 sm:w-80 bg-background/95 border border-white/10 rounded-t-xl shadow-2xl flex flex-col backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2.5 bg-muted/40 border-b border-white/10 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <Avatar className="w-8 h-8">
              {partner.avatar ? (
                <AvatarImage src={partner.avatar} alt={partner.displayName} />
              ) : null}
              <AvatarFallback className="text-xs">{nameInitials}</AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-background" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground truncate">
              {partner.displayName || partner.username}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 rounded-md text-muted-foreground"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <>
          <div className="h-64 flex flex-col overflow-y-auto p-3 gap-2 bg-background/30">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground/20 mb-2" />
                <p className="text-[11px] text-muted-foreground">Say hello to start the chat!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;

                  // Collect media items
                  const mediaItems = !msg.isDeleted
                    ? msg.media?.length
                      ? msg.media
                      : msg.mediaUrl
                        ? [{ url: msg.mediaUrl, type: msg.type, fileName: msg.fileName, fileSize: msg.fileSize }]
                        : []
                    : [];

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        isMe ? "self-end items-end" : "self-start items-start"
                      }`}
                    >
                      <div
                        className={cn(
                          "relative group rounded-2xl text-[11px] break-words transition-all",
                          msg.isDeleted
                            ? "bg-muted/30 text-muted-foreground italic border border-white/5 px-3 py-1.5"
                            : isMe
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-muted text-foreground rounded-tl-none",
                          !msg.isDeleted && (msg.type === "text" || mediaItems.length === 0)
                            ? "px-3 py-1.5"
                            : !msg.isDeleted ? "p-1" : "",
                        )}
                      >
                        {/* Reply context */}
                        {msg.replyToId && !msg.isDeleted && (() => {
                          const parent = messages.find(m => m.id === msg.replyToId);
                          if (!parent) return null;
                          return (
                            <div className={cn(
                              "mb-1 p-1.5 rounded-lg text-[10px] border-l-2 bg-black/10 flex flex-col gap-0.5",
                              isMe ? "border-primary-foreground/30" : "border-primary"
                            )}>
                              <span className="font-bold opacity-70">
                                {parent.senderId === user?.id ? "You" : partner.displayName || partner.username}
                              </span>
                              <span className="truncate opacity-60">
                                {parent.isDeleted ? "This message was deleted" : parent.content || (parent.type !== 'text' ? `Attachment (${parent.type})` : "")}
                              </span>
                            </div>
                          );
                        })()}

                        {msg.isDeleted ? (
                          <div className="flex items-center gap-1.5 opacity-60">
                            <Trash2 className="w-3 h-3" />
                            <span>This message was deleted</span>
                          </div>
                        ) : (
                          <>
                            {/* Media rendering */}
                            {mediaItems.length > 0 && (
                              <div className={cn(
                                "mb-0.5",
                                mediaItems.length > 1 && "grid grid-cols-2 gap-1"
                              )}>
                                {mediaItems.map((item, idx) => (
                                  <div key={idx}>
                                    {item.type === "image" && (
                                      <div className="rounded-xl overflow-hidden">
                                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                                          <img
                                            src={getOptimizedUrl(item.url, 400) || ""}
                                            alt=""
                                            className="max-h-40 w-full object-cover hover:opacity-90 transition-opacity"
                                          />
                                        </a>
                                      </div>
                                    )}
                                    {item.type === "video" && (
                                      <div className="rounded-xl overflow-hidden bg-black/20 aspect-video flex items-center justify-center">
                                        <video src={item.url} className="max-h-40 w-full" controls />
                                      </div>
                                    )}
                                    {item.type === "file" && (
                                      <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors min-w-0"
                                      >
                                        <FileIcon className="w-3.5 h-3.5 shrink-0 text-primary" />
                                        <span className="text-[10px] font-medium truncate">{item.fileName || "Attachment"}</span>
                                        <Download className="w-3 h-3 shrink-0 opacity-40" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Text content */}
                            {msg.content && (
                              <p className={cn(
                                "whitespace-pre-wrap",
                                mediaItems.length > 0 ? "px-2 py-0.5 pb-1" : ""
                              )}>
                                {msg.content}
                              </p>
                            )}
                          </>
                        )}

                        {/* Actions dropdown */}
                        {!msg.isDeleted && (
                          <div className={cn(
                            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                            isMe ? "-left-8 pr-1" : "-right-8 pl-1"
                          )}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="sm:h-6 sm:w-6 rounded-full hover:bg-white/10">
                                  <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isMe ? "end" : "start"} className="w-28">
                                <DropdownMenuItem onClick={() => setReplyingTo(msg)} className="text-xs">
                                  <Reply className="w-3.5 h-3.5 mr-1.5" /> Reply
                                </DropdownMenuItem>
                                {isMe && (
                                  <>
                                    <DropdownMenuItem onClick={() => setEditingMessage(msg)} className="text-xs">
                                      <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-xs text-red-500 focus:text-red-500"
                                      onClick={() => setMessageToDelete(msg.id)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 mt-0.5 px-1",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        <span className="text-[9px] text-muted-foreground/60">
                          {format(new Date(msg.createdAt), "h:mm a")}
                        </span>
                        {msg.isEdited && !msg.isDeleted && (
                          <span className="text-[9px] text-muted-foreground/40 italic">(edited)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* File Preview Strip */}
          {selectedFiles.length > 0 && (
            <div className="px-3 py-1.5 border-t border-white/5 bg-white/5 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {selectedFiles.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-1.5 rounded-lg bg-black/20 border border-white/10 p-1 shrink-0"
                  >
                    <div className="relative w-8 h-8 rounded-md overflow-hidden bg-black/20 flex items-center justify-center shrink-0">
                      {uploadPreviews[i] ? (
                        <img src={uploadPreviews[i]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <FileIcon className="w-4 h-4 text-primary/60" />
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-3 h-3 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 max-w-[80px]">
                      <p className="text-[10px] font-medium truncate">{file.name}</p>
                      <p className="text-[9px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full hover:bg-white/10 shrink-0"
                      onClick={() => handleRemoveFile(i)}
                      disabled={isUploading}
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} • send with message
              </p>
            </div>
          )}

          {/* Reply / Edit Banner */}
          {(replyingTo || editingMessage) && (
            <div className="px-3 py-2 flex items-center gap-2 border-t border-primary/20 bg-primary/5 animate-in slide-in-from-bottom-2 duration-200">
              <div className="p-1.5 rounded-lg bg-primary/10">
                {editingMessage ? <Edit2 className="w-3.5 h-3.5 text-primary" /> : <Reply className="w-3.5 h-3.5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-primary mb-0.5">
                  {editingMessage ? "Editing message" : "Replying"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate italic opacity-80">
                  "{(editingMessage || replyingTo)?.content || "Attachment"}"
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-white/10 shrink-0"
                onClick={handleCancelAction}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Typing Indicator & Input */}
          <div className="border-t border-white/10 px-3 py-2 bg-muted/20">
            {isPartnerTyping && (
              <div className="text-[10px] text-muted-foreground italic mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                <span>@{partner.username} is typing...</span>
              </div>
            )}
            <form onSubmit={handleSend} className="flex items-center gap-1.5">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
              />
              {!editingMessage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || isUploading}
                  aria-label="Attach file"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </Button>
              )}
              <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder={isUploading ? "Uploading..." : editingMessage ? "Edit message..." : "Type a message..."}
                className="h-8 text-xs bg-muted/40 border border-white/5 rounded-full pl-3 pr-2 flex-1"
                disabled={loading || isUploading}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="w-8 h-8 rounded-full text-primary hover:text-primary-foreground hover:bg-primary shrink-0"
                disabled={loading || isUploading || (!inputValue.trim() && selectedFiles.length === 0)}
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </Button>
            </form>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete for everyone"
        variant="destructive"
        onConfirm={() => {
          if (messageToDelete) {
            socketDeleteMessage(messageToDelete);
            setMessageToDelete(null);
          }
        }}
      />
    </div>
  );
}
