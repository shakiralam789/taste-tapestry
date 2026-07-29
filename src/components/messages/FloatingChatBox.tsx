"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Minus, MessageSquare, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessagesSocket } from "@/features/messages/useMessagesSocket";
import { getOrCreateConversation, getMessages, getConversations } from "@/features/messages/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Conversation, Message } from "@/types/messages";
import type { PartnerInfo } from "@/features/messages/MessagesContext";
import { format } from "date-fns";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const queryClient = useQueryClient();

  const {
    sendMessage: socketSendMessage,
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

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
      socketSendMessage(convo.id, inputValue.trim(), "text");
      
      // Stop typing immediately on send
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTyping(convo.id, false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      setInputValue("");
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
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        isMe ? "self-end items-end" : "self-start items-start"
                      }`}
                    >
                      <div
                        className={`px-3 py-1.5 rounded-2xl text-[11px] break-words ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted text-foreground rounded-tl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-muted-foreground/60 mt-0.5 px-1">
                        {format(new Date(msg.createdAt), "h:mm a")}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Typing Indicator & Input */}
          <div className="border-t border-white/10 px-3 py-2 bg-muted/20">
            {isPartnerTyping && (
              <div className="text-[10px] text-muted-foreground italic mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                <span>@{partner.username} is typing...</span>
              </div>
            )}
            <form onSubmit={handleSend} className="flex items-center gap-1.5">
              <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="h-8 text-xs bg-muted/40 border border-white/5 rounded-full pl-3 pr-2 flex-1"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="w-8 h-8 rounded-full text-primary hover:text-primary-foreground hover:bg-primary shrink-0"
                disabled={loading || !inputValue.trim()}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
