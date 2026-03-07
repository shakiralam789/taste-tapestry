"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/features/auth/AuthContext";
import { MessageThread } from "@/components/messages/MessageThread";
import { MessageInput } from "@/components/messages/MessageInput";
import { useMessagesSocket } from "@/features/messages/useMessagesSocket";
import {
  getConversations,
  getMessages,
  getOrCreateConversation,
  muteConversation,
  clearConversation,
} from "@/features/messages/api";
import { searchUsers, getPublicProfile } from "@/features/users/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Conversation, Message } from "@/types/messages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { ClientOnly } from "@/components/common/ClientOnly";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  MessageCircle,
  PenSquare,
  X,
  Loader2,
  Send,
  MoreVertical,
  BellOff,
  User,
  Trash2,
  Bell,
  Paperclip,
  Image as ImageIcon,
  Film,
  File as FileIconLucide,
} from "lucide-react";

// ── Types & Helpers ────────────────────────────────────────────────────────────

type PartnerInfo = { id: string; displayName: string; username: string; avatar: string | null };

function getPartnerId(convo: Conversation, myId: string): string {
  return convo.participantIds.find((id) => id !== myId) ?? "";
}

function lastMessagePreview(msg: Message | null): string {
  if (!msg) return "No messages yet";
  const content = msg.content.length > 40 ? msg.content.slice(0, 40) + "…" : msg.content;
  return content;
}

function shortTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function initials(name: string): string {
  return (name || "?").slice(0, 2).toUpperCase();
}

// ── Components ────────────────────────────────────────────────────────────────

function ConversationItem({
  convo,
  myId,
  isActive,
  onClick,
  isOnline,
}: {
  convo: Conversation;
  myId: string;
  isActive: boolean;
  onClick: () => void;
  isOnline: boolean;
}) {
  const partnerId = getPartnerId(convo, myId);
  const qc = useQueryClient();
  const router = useRouter();

  const { data: partner } = useQuery({
    queryKey: ["user-profile", partnerId],
    queryFn: () => getPublicProfile(partnerId),
    staleTime: 5 * 60 * 1000,
  });

  const name = partner?.displayName || partner?.username || "Loading…";
  const isMuted = convo.mutedBy.includes(myId);

  const muteMutation = useMutation({
    mutationFn: () => muteConversation(convo.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearConversation(convo.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
      void qc.invalidateQueries({ queryKey: ["messages", "unread-count"] });
      if (isActive) {
        onClick(); // Deselect if clearing active
      }
      toast.success("Conversation history cleared");
    },
  });

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="relative group/item">
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
          isActive
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-white/5 border border-transparent",
        )}
      >
        <div className="relative shrink-0">
          <Avatar className="w-12 h-12">
            {partner?.avatar && <AvatarImage src={partner.avatar} />}
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-baseline gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm font-medium truncate">{name}</p>
              {isMuted && <BellOff className="w-3 h-3 text-muted-foreground/60" />}
            </div>
            {convo.lastMessage && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {shortTime(convo.lastMessage.createdAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground truncate">
              {lastMessagePreview(convo.lastMessage)}
            </p>
            {convo.unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {convo.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Actions dropdown */}
      <div className="absolute top-1/2 -translate-y-1/2 right-2 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={handleAction}>
            <Button variant="ghost" size="icon" className="sm:h-7 sm:w-7 rounded-full hover:bg-white/10">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push(`/ users / ${partnerId} `)}>
              <User className="w-4 h-4 mr-2" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => muteMutation.mutate()}>
              {isMuted ? (
                <>
                  <Bell className="w-4 h-4 mr-2" /> Unmute
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 mr-2" /> Mute
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500"
              onClick={() => {
                if (confirm("Are you sure you want to delete this conversation for you? Older messages will be hidden.")) {
                  clearMutation.mutate();
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

function MessagesPageInner() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Navigation State
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [pendingPartner, setPendingPartner] = useState<PartnerInfo | null>(null);

  // Message State
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Real-time Presence/Typing
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingInConvo, setTypingInConvo] = useState<Record<string, boolean>>({});

  // Search State
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Conversations list ──────────────────────────────────────────────────────
  const { data: conversations = [], isLoading: convosLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    staleTime: 10_000,
    refetchInterval: 30_000,
    enabled: !!user,
  });

  // ── Socket Hooks ────────────────────────────────────────────────────────────
  const {
    sendMessage: socketSendMessage,
    sendTyping,
    sendRead,
    joinConversation,
  } = useMessagesSocket({
    onNewMessage: (msg) => {
      setMessages((prev) => {
        if (msg.conversationId !== activeConvoId) return prev;
        const isFromMe = msg.senderId === user?.id;
        const filtered = isFromMe
          ? prev.filter(
            (m) =>
              !(m.id.startsWith("temp-") && m.content === msg.content),
          )
          : prev;
        if (filtered.some((m) => m.id === msg.id)) return filtered;
        return [...filtered, msg];
      });
    },
    onTyping: (event) => {
      if (event.userId === user?.id) return;
      setTypingInConvo((prev) => ({
        ...prev,
        [event.conversationId]: event.typing,
      }));
    },
    onRead: (event) => {
      setMessages((prev) =>
        prev.map((m) =>
          event.messageIds.includes(m.id)
            ? { ...m, readBy: [...new Set([...m.readBy, event.userId])] }
            : m,
        ),
      );
    },
    onUserOnline: (e) =>
      setOnlineUsers((prev) => new Set([...prev, e.userId])),
    onUserOffline: (e) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(e.userId);
        return next;
      }),
  });

  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const router = useRouter();

  // Handle incoming userId from query params (e.g. from Profile Message button)
  useEffect(() => {
    if (targetUserId && user && conversations.length > 0) {
      const existing = conversations.find((c) =>
        c.participantIds.includes(targetUserId),
      );
      if (existing) {
        if (activeConvoId !== existing.id) {
          setActiveConvoId(existing.id);
          setPendingPartner(null);
        }
        // Clear param after selection so user can click other items
        router.replace("/messages", { scroll: false });
      } else {
        // If not in current list, fetch profile and set as pending
        getPublicProfile(targetUserId).then((p) => {
          if (p) {
            setPendingPartner({
              id: p.id,
              displayName: p.displayName || p.username || "User",
              username: p.username || "user",
              avatar: p.avatar,
            });
            setActiveConvoId(null);
            // Clear param
            router.replace("/messages", { scroll: false });
          }
        });
      }
    }
  }, [targetUserId, user, conversations, activeConvoId, router]);

  // ── Load messages when active conversation changes ────────────────────────
  useEffect(() => {
    let ignore = false;
    if (!activeConvoId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    joinConversation(activeConvoId);

    getMessages(activeConvoId, 20)
      .then((msgs) => {
        if (ignore) return;
        setMessages(msgs);
        // Mark as read after messages are loaded
        sendRead(activeConvoId);
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Failed to load messages:", err);
        setMessages([]);
      })
      .finally(() => {
        if (ignore) return;
        setLoadingMessages(false);
      });

    return () => { ignore = true; };
  }, [activeConvoId, joinConversation, sendRead]);

  // ── Partner Info Fetching for Header ────────────────────────────────────────

  const currentPartnerId = useMemo(() => {
    if (pendingPartner) return pendingPartner.id;
    const convo = conversations.find((c) => c.id === activeConvoId);
    return convo && user ? getPartnerId(convo, user.id) : null;
  }, [activeConvoId, conversations, pendingPartner, user]);

  const { data: partner } = useQuery({
    queryKey: ["user-profile", currentPartnerId],
    queryFn: () =>
      currentPartnerId
        ? getPublicProfile(currentPartnerId)
        : Promise.resolve(null),
    enabled: !!currentPartnerId,
    staleTime: 5 * 60 * 1000,
  });

  const partnerName = partner?.displayName || partner?.username || pendingPartner?.displayName || "User";
  const partnerAvatar = partner?.avatar || pendingPartner?.avatar;
  const isOnline = currentPartnerId ? onlineUsers.has(currentPartnerId) : false;
  const isTyping = activeConvoId ? !!typingInConvo[activeConvoId] : false;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSelectUserFromSearch = (u: PartnerInfo) => {
    const existing = conversations.find((c) =>
      c.participantIds.includes(u.id),
    );
    if (existing) {
      setActiveConvoId(existing.id);
      setPendingPartner(null);
    } else {
      setActiveConvoId(null);
      setPendingPartner(u);
    }
    setShowNewChat(false);
    setSearchQuery("");
  };

  const sendMessage = useCallback(
    async (
      content: string,
      type: "text" | "image" | "video" | "file" = "text",
      mediaUrl = "",
      fileName = "",
      fileSize = 0
    ) => {
      const trimmedContent = content.trim();
      if (!trimmedContent && !mediaUrl) return;

      let convoId = activeConvoId;
      if (!convoId && pendingPartner) {
        try {
          const newConvo = await getOrCreateConversation(pendingPartner.id);
          convoId = newConvo.id;
          setActiveConvoId(convoId);
          setPendingPartner(null);
          void qc.invalidateQueries({ queryKey: ["conversations"] });
        } catch (err) {
          console.error("Failed to create conversation:", err);
          toast.error("Failed to start conversation");
          return;
        }
      }
      if (!convoId) return;

      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        conversationId: convoId,
        senderId: user?.id || "",
        content: trimmedContent,
        type,
        mediaUrl,
        fileName,
        fileSize,
        readBy: [user?.id || ""],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMsg]);
      socketSendMessage(convoId, trimmedContent, type, mediaUrl, fileName, fileSize);
    },
    [activeConvoId, pendingPartner, user, socketSendMessage, qc],
  );

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ["user-search-msg", searchQuery],
    queryFn: () =>
      searchQuery.trim().length >= 2
        ? searchUsers(searchQuery.trim(), { excludeUserId: user?.id })
        : Promise.resolve([]),
    enabled: searchQuery.trim().length >= 2,
  });

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r border-white/10 bg-background/60 backdrop-blur-sm transition-all overflow-hidden",
          activeConvoId || pendingPartner
            ? "hidden md:flex md:w-80 lg:w-96"
            : "w-full md:w-80 lg:w-96",
        )}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">Messages</h1>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full border border-white/10"
            onClick={() => setShowNewChat((v) => !v)}
          >
            {showNewChat ? (
              <X className="w-4 h-4" />
            ) : (
              <PenSquare className="w-4 h-4" />
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showNewChat && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-white/10 px-3 py-2"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-full bg-muted/30 border-white/10"
                  autoFocus
                />
              </div>
              {searching && (
                <div className="p-4 flex justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
              <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUserFromSearch(u)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left"
                  >
                    <Avatar className="w-9 h-9">
                      {u.avatar && <AvatarImage src={u.avatar} />}
                      <AvatarFallback>
                        {initials(u.displayName || u.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {u.displayName || u.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{u.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollArea className="flex-1">
          {convosLoading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto opacity-20 mb-3" />
              <p className="text-sm">Start a new conversation!</p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {conversations.map((c) => (
                <ConversationItem
                  key={c.id}
                  convo={c}
                  myId={user?.id || ""}
                  isActive={c.id === activeConvoId}
                  onClick={() => {
                    setActiveConvoId(c.id);
                    setPendingPartner(null);
                  }}
                  isOnline={onlineUsers.has(getPartnerId(c, user?.id || ""))}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Panel */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-background/30",
          !activeConvoId && !pendingPartner && "hidden md:flex",
        )}
      >
        {activeConvoId || pendingPartner ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-background/60 backdrop-blur-md">
              <button
                className="md:hidden p-1 mr-1 text-muted-foreground"
                onClick={() => {
                  setActiveConvoId(null);
                  setPendingPartner(null);
                }}
              >
                ←
              </button>
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={partnerAvatar || "/images/default-user.jpg"} />
                  <AvatarFallback>{initials(partnerName)}</AvatarFallback>
                </Avatar>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold truncate">
                  {partnerName}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {isTyping ? "Typing…" : isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {loadingMessages ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin opacity-20" />
                </div>
              ) : (
                <MessageThread
                  conversationId={activeConvoId || "pending"}
                  myUserId={user?.id || ""}
                  messages={messages}
                  isPartnerTyping={isTyping}
                  onOlderMessages={(older) =>
                    setMessages((prev) => [...older, ...prev])
                  }
                />
              )}
            </div>

            {/* Input Area */}
            <MessageInput
              onSend={sendMessage}
              onTypingChange={(typing) =>
                activeConvoId && sendTyping(activeConvoId, typing)
              }
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-muted-foreground gap-4">
            <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center border border-white/5">
              <Send className="w-10 h-10 opacity-20 -rotate-12" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-semibold text-white/90 mb-1">
                Your Direct Messages
              </h3>
              <p className="text-sm opacity-60">
                Send private photos and messages to a friend or group.
              </p>
              <Button
                variant="gradient"
                size="sm"
                className="mt-6 rounded-full"
                onClick={() => setShowNewChat(true)}
              >
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ClientOnly>
      <Layout className="!p-0">
        <MessagesPageInner />
      </Layout>
    </ClientOnly>
  );
}
