"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageCircle,
  Bell,
  Search,
  ArrowLeft,
  Film,
  Sparkles,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/features/notifications/NotificationsContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useProfileInfo } from "@/features/profile/useProfileInfo";
import { useQuery } from "@tanstack/react-query";
import { getTotalUnreadCount, getConversations } from "@/features/messages/api";
import { globalSearchItems, searchUsers, getPublicProfile, type GlobalSearchItemResult } from "@/features/users/api";
import { useMessages, type PartnerInfo } from "@/features/messages/MessagesContext";
import type { Conversation } from "@/types/messages";
import {
  getSystemRecommendations,
  type RecommendationItem,
} from "@/features/favorites/api";

function NavbarConversationItem({
  convo,
  myUserId,
  onClick,
}: {
  convo: Conversation;
  myUserId: string;
  onClick: (partner: PartnerInfo) => void;
}) {
  const partnerId = convo.participantIds.find((id) => id !== myUserId) || "";

  const { data: partner } = useQuery({
    queryKey: ["user-profile", partnerId],
    queryFn: () => getPublicProfile(partnerId).catch(() => null),
    staleTime: 5 * 60 * 1000,
    enabled: !!partnerId,
  });

  const name = partner?.displayName || partner?.username || "Loading...";
  const lastMsg = convo.lastMessage?.content || "No messages yet";
  const initials = (name || "?").slice(0, 2).toUpperCase();

  const partnerInfo: PartnerInfo = {
    id: partnerId,
    displayName: partner?.displayName || partner?.username || name,
    username: partner?.username || "",
    avatar: partner?.avatar || null,
  };

  return (
    <DropdownMenuItem
      onClick={() => onClick(partnerInfo)}
      className="flex items-center gap-2.5 p-2.5 cursor-pointer transition-colors focus:bg-primary/5"
    >
      <div className="relative shrink-0">
        <Avatar className="w-8 h-8">
          {partner?.avatar && <AvatarImage src={partner.avatar} />}
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold truncate text-foreground">{name}</p>
          {convo.lastMessage && (
            <span className="text-[9px] text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(convo.lastMessage.createdAt), { addSuffix: false })} ago
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-[10px] text-muted-foreground truncate flex-1">
            {lastMsg}
          </p>
          {convo.unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center shrink-0">
              {convo.unreadCount}
            </span>
          )}
        </div>
      </div>
    </DropdownMenuItem>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileSearchResults, setMobileSearchResults] = useState<GlobalSearchItemResult[]>([]);
  const [mobileSearching, setMobileSearching] = useState(false);
  const [mobileSearchDropdownOpen, setMobileSearchDropdownOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const [desktopSearchQuery, setDesktopSearchQuery] = useState("");
  const [desktopSearchResults, setDesktopSearchResults] = useState<GlobalSearchItemResult[]>([]);
  const [desktopSearching, setDesktopSearching] = useState(false);
  const [desktopSearchDropdownOpen, setDesktopSearchDropdownOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);

  const runDesktopSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setDesktopSearchResults([]);
        return;
      }
      setDesktopSearching(true);
      try {
        const list = await globalSearchItems(q);
        setDesktopSearchResults(list);
        setDesktopSearchDropdownOpen(true);
      } catch {
        setDesktopSearchResults([]);
      } finally {
        setDesktopSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    const t = setTimeout(() => runDesktopSearch(desktopSearchQuery), 300);
    return () => clearTimeout(t);
  }, [desktopSearchQuery, runDesktopSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setDesktopSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDesktopSelectTitle = (title: string) => {
    setDesktopSearchDropdownOpen(false);
    setDesktopSearchQuery("");
    setDesktopSearchResults([]);
    router.push(`/search?q=${encodeURIComponent(title)}`);
  };

  const handleDesktopSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && desktopSearchQuery.trim()) {
      handleDesktopSelectTitle(desktopSearchQuery.trim());
    }
  };

  const {
    notifications,
    unreadCount: notificationsUnreadCount,
    isLoading: notificationsLoading,
    markAllRead,
    markAsRead,
    refresh: refreshNotifications,
  } = useNotifications();
  const { displayName, displayAvatar } = useProfileInfo();
  const { user } = useAuth();

  // Lazy-load dropdown contents. We keep the queries declared up here (instead
  // of mounting/unmounting per open) so the cached data stays warm between
  // opens, but we gate the initial fetch on the dropdown being opened.
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const handleRecommendationsOpenChange = (open: boolean) => {
    setRecommendationsOpen(open);
  };
  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open);
    if (open) {
      refreshNotifications();
    }
  };

  const { openChatBox } = useMessages();
  const [messagesDropdownOpen, setMessagesDropdownOpen] = useState(false);
  const [messagesSearchQuery, setMessagesSearchQuery] = useState("");
  const [messagesSearchResults, setMessagesSearchResults] = useState<any[]>([]);
  const [messagesSearching, setMessagesSearching] = useState(false);

  const runMessagesSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setMessagesSearchResults([]);
        return;
      }
      setMessagesSearching(true);
      try {
        const list = await searchUsers(q, { excludeUserId: user?.id });
        setMessagesSearchResults(list);
      } catch {
        setMessagesSearchResults([]);
      } finally {
        setMessagesSearching(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    const t = setTimeout(() => runMessagesSearch(messagesSearchQuery), 300);
    return () => clearTimeout(t);
  }, [messagesSearchQuery, runMessagesSearch]);

  const { data: conversations = [], isLoading: convosLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    staleTime: 60_000,
    enabled: !!user,
  });

  const runMobileSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setMobileSearchResults([]);
        return;
      }
      setMobileSearching(true);
      try {
        const list = await globalSearchItems(q);
        setMobileSearchResults(list);
        setMobileSearchDropdownOpen(true);
      } catch {
        setMobileSearchResults([]);
      } finally {
        setMobileSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    const t = setTimeout(() => runMobileSearch(mobileSearchQuery), 300);
    return () => clearTimeout(t);
  }, [mobileSearchQuery, runMobileSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setMobileSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMobileSelectTitle = (title: string) => {
    setMobileSearchDropdownOpen(false);
    setMobileSearchQuery("");
    setMobileSearchResults([]);
    setIsMobileSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(title)}`);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && mobileSearchQuery.trim()) {
      handleMobileSelectTitle(mobileSearchQuery.trim());
    }
  };

  const { data: messagesUnreadCount = 0 } = useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: getTotalUnreadCount,
    enabled: !!user,
    staleTime: Infinity,
    // Real-time updates handled via Socket.io
  });

  // System-recommendation feed for the Sparkles dropdown. Lazy: the first
  // fetch only happens when the user opens the dropdown. The 60s refresh
  // only runs while the dropdown is open.
  const { data: recFeed, isLoading: recLoading } = useQuery({
    queryKey: ["recommendations", "system-feed"],
    queryFn: () => getSystemRecommendations({ limit: 8 }),
    enabled: !!user && recommendationsOpen,
    refetchInterval: recommendationsOpen ? 60_000 : false,
    staleTime: 30_000,
  });
  const recItems: RecommendationItem[] = recFeed?.items ?? [];

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);

    let path = "";
    if (n.targetId) {
      // Most notifications (MENTION, NEW_COMMENT, NEW_REPLY, REACTION) 
      // are related to capsules currently.
      path = `/capsules/${n.targetId}`;
    } else if (n.actorId) {
      // Fallback to actor's profile if no targetId
      path = `/users/${n.actorId}`;
    }

    if (path) {
      router.push(path);
    }
  };

  // Skeleton row for the recommendations dropdown
  const RecsSkeleton = (
    <div className="flex flex-col">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border-b border-border/40 last:border-b-0">
          <div className="w-10 h-10 rounded-md bg-muted animate-pulse shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-1/2 rounded bg-muted/70 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  // Skeleton row for the notifications dropdown
  const NotifsSkeleton = (
    <div className="flex flex-col">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 border-b border-border/40 last:border-b-0">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-2/3 rounded bg-muted/70 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="px-4 sm:px-6">
        {/* Mobile: search-only bar when search is open */}
        {isMobileSearchOpen ? (
          <div className="flex items-center gap-2 h-12 sm:h-16 md:hidden" ref={mobileSearchRef}>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setMobileSearchQuery("");
                setMobileSearchResults([]);
                setMobileSearchDropdownOpen(false);
              }}
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <Input
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                onFocus={() => mobileSearchResults.length > 0 && setMobileSearchDropdownOpen(true)}
                placeholder="Search favorites..."
                className="pl-11 h-10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/40 border-2 rounded-full w-full shadow-sm transition-all"
                onKeyDown={handleSearchSubmit}
                autoFocus
              />
              {mobileSearchDropdownOpen && (mobileSearchQuery.trim() || mobileSearchResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 p-1 rounded-xl bg-popover border border-border shadow-lg z-50 max-h-[70vh] overflow-y-auto">
                  {mobileSearching ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">Searching...</p>
                  ) : mobileSearchResults.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                      {mobileSearchQuery.trim() ? "No results found" : "Type to search favorites"}
                    </p>
                  ) : (
                    mobileSearchResults.map((res) => (
                      <button
                        key={`${res.categoryId}-${res.title}`}
                        type="button"
                        onClick={() => handleMobileSelectTitle(res.title)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex flex-col min-w-0">
                          <p className="font-medium text-sm truncate">{res.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{res.categoryId}</p>
                        </div>
                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-12 items-center justify-between h-12 sm:h-16">
          <div className="col-span-6 md:col-span-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--gradient-sunset)" }}
              >
                <span className="text-xl">📖</span>
              </div>
              <span className="font-display text-xl font-semibold gradient-text hidden sm:block">
                Wishbook
              </span>
            </Link>
          </div>

          {/* Desktop Title Search */}
          <div className="col-span-8 hidden md:flex items-center justify-center" ref={desktopSearchRef}>
            <div className="relative w-full max-w-xl">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <Input
                value={desktopSearchQuery}
                onChange={(e) => setDesktopSearchQuery(e.target.value)}
                onFocus={() => desktopSearchResults.length > 0 && setDesktopSearchDropdownOpen(true)}
                placeholder="Search movie, series, song, book..."
                className="pl-11 pr-4 h-11 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/40 border-2 ring-1 ring-primary/10 focus-visible:ring-primary/40 focus-visible:border-primary rounded-full w-full text-foreground placeholder:text-muted-foreground/80 shadow-sm transition-all"
                onKeyDown={handleDesktopSearchSubmit}
              />
              {desktopSearchDropdownOpen && (desktopSearchQuery.trim() || desktopSearchResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 p-1 rounded-xl bg-popover border border-border shadow-lg z-50 max-h-80 overflow-y-auto">
                  {desktopSearching ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">Searching...</p>
                  ) : desktopSearchResults.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                      {desktopSearchQuery.trim() ? "No titles found" : "Type to search titles"}
                    </p>
                  ) : (
                    desktopSearchResults.map((res) => (
                      <button
                        key={`${res.categoryId}-${res.title}`}
                        type="button"
                        onClick={() => handleDesktopSelectTitle(res.title)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Film className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <p className="font-medium text-sm truncate">{res.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{res.categoryId}</p>
                          </div>
                        </div>
                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="col-span-6 md:col-span-2 flex items-center justify-end gap-2">
            {/* Mobile: search icon — opens search bar in navbar */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setIsMobileSearchOpen(true)}
              aria-label="Search users"
            >
              <Search className="w-5 h-5" />
            </Button>
            {/* Suggested for you (system recommendations from followed users) */}
            <DropdownMenu
              open={recommendationsOpen}
              onOpenChange={handleRecommendationsOpenChange}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label="Suggested for you"
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-80 p-0 overflow-hidden"
                align="end"
                sideOffset={8}
              >
                <div
                  className="overflow-y-auto overflow-x-hidden"
                  style={{ maxHeight: "calc(100vh - 70px)" }}
                >
                  <DropdownMenuLabel className="sticky top-0 bg-card z-10 flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-semibold">Suggested for you</span>
                    <span className="text-[10px] text-muted-foreground">
                      From your network
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {recLoading && recItems.length === 0 ? (
                    RecsSkeleton
                  ) : recItems.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Sparkles className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Follow more people to get personalized suggestions.
                      </p>
                    </div>
                  ) : (
                    <>
                      {recItems.map((item) => (
                        <DropdownMenuItem
                          key={`${item.source}:${item.id}`}
                          onClick={() => router.push(`/favorites/${item.item.id}`)}
                          className="flex items-center gap-3 p-3 cursor-pointer transition-colors focus:bg-primary/5"
                        >
                          {item.item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.item.image}
                              alt={item.item.title}
                              className="w-10 h-10 rounded-md object-cover ring-1 ring-border shrink-0 bg-muted"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-primary/10 ring-1 ring-border shrink-0 flex items-center justify-center text-primary text-sm font-semibold">
                              {item.item.title[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 w-full">
                              <span className="font-semibold text-sm truncate">
                                {item.item.title}
                              </span>
                              {item.item.rating != null && (
                                <span className="text-[10px] text-amber-500 shrink-0 inline-flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                                  {item.item.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate w-full">
                              {item.owner.displayName} · @{item.owner.username}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <div className="px-3 py-2 flex justify-center bg-muted/30">
                        <Link
                          href="/recommendations"
                          className="text-[11px] font-medium text-primary hover:underline"
                        >
                          See all suggestions
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Notifications */}
            <DropdownMenu
              open={notificationsOpen}
              onOpenChange={handleNotificationsOpenChange}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {notificationsUnreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-semibold flex items-center justify-center border-2 border-background">
                      {notificationsUnreadCount > 9 ? "9+" : notificationsUnreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-80 p-0 overflow-hidden"
                align="end"
                sideOffset={8}
              >
                <div
                  className="overflow-y-auto overflow-x-hidden"
                  style={{ maxHeight: "calc(100vh - 70px)" }}
                >
                  <DropdownMenuLabel className="sticky top-0 bg-card z-10 flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-semibold">Notifications</span>
                    {!notificationsLoading && notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllRead()}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notificationsLoading && notifications.length === 0 ? (
                    NotifsSkeleton
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No notifications yet.</p>
                    </div>
                  ) : (
                    <>
                      {(showAllNotifications
                        ? notifications
                        : notifications.slice(0, 10)
                      ).map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            "flex items-start gap-3 p-3 cursor-pointer transition-colors",
                            !n.isRead ? "bg-primary/5" : "opacity-70"
                          )}
                        >
                          {n.actor && (
                            <div className="shrink-0 mt-0.5">
                              <Avatar className="w-8 h-8 ring-1 ring-border">
                                <AvatarImage
                                  src={n.actor.avatar ?? undefined}
                                  alt={n.actor.username}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {n.actor.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                          <div className="flex flex-col items-start gap-0.5 min-w-0">
                            <p className="text-xs leading-normal">
                              <span className="font-semibold">@{n.actor.username}</span>{" "}
                              {n.type === "MENTION" ? "mentioned you in a comment" :
                                n.type === "NEW_COMMENT" ? "commented on your capsule" :
                                  n.type === "NEW_REPLY" ? "replied to your comment" :
                                    n.type === "REACTION" ? "reacted to your comment" :
                                      "sent you a notification"}
                            </p>
                            {n.content && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 italic">
                                "{n.content}"
                              </p>
                            )}
                            <span className="text-[10px] text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {!n.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2 ml-auto" />
                          )}
                        </DropdownMenuItem>
                      ))}
                      {notifications.length > 10 && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="px-3 py-2 flex justify-center bg-muted/30">
                            <button
                              type="button"
                              className="text-[11px] font-medium text-primary hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowAllNotifications((prev) => !prev);
                              }}
                            >
                              {showAllNotifications
                                ? "Show latest 10"
                                : `View all ${notifications.length} notifications`}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Messages Dropdown */}
            <DropdownMenu
              open={messagesDropdownOpen}
              onOpenChange={(open) => {
                setMessagesDropdownOpen(open);
                if (!open) {
                  setMessagesSearchQuery("");
                  setMessagesSearchResults([]);
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <MessageCircle className="w-5 h-5" />
                  {messagesUnreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-semibold flex items-center justify-center border-2 border-background">
                      {messagesUnreadCount > 9 ? "9+" : messagesUnreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-80 p-0 overflow-hidden"
                align="end"
                sideOffset={8}
              >
                <div
                  className="overflow-hidden flex flex-col h-[calc(100vh-70px)] sm:h-[calc(100vh-80px)]"
                >
                  <DropdownMenuLabel className="sticky top-0 bg-card z-10 flex items-center justify-between px-3 py-2 border-b border-border/40">
                    <span className="text-sm font-semibold">Messages</span>
                  </DropdownMenuLabel>

                  {/* Dropdown Search */}
                  <div className="p-2 border-b border-border/40 bg-muted/10 sticky top-[37px] z-10">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        value={messagesSearchQuery}
                        onChange={(e) => setMessagesSearchQuery(e.target.value)}
                        placeholder="Search conversations or users..."
                        className="pl-8 h-8 text-xs bg-muted/40 border border-border rounded-full w-full focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Dropdown Chat List / Search Results */}
                  <div className="flex-1 overflow-y-auto">
                    {messagesSearchQuery.trim() ? (
                      messagesSearching ? (
                        <div className="p-4 flex justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : messagesSearchResults.length === 0 ? (
                        <p className="p-4 text-xs text-muted-foreground text-center">No users found</p>
                      ) : (
                        messagesSearchResults.map((u) => {
                          const partnerInfo: PartnerInfo = {
                            id: u.id,
                            displayName: u.displayName || u.username,
                            username: u.username,
                            avatar: u.avatar,
                          };
                          return (
                            <DropdownMenuItem
                              key={u.id}
                              onClick={() => {
                                openChatBox(partnerInfo);
                                setMessagesDropdownOpen(false);
                              }}
                              className="flex items-center gap-2.5 p-2.5 cursor-pointer transition-colors focus:bg-primary/5"
                            >
                              <Avatar className="w-8 h-8">
                                {u.avatar && <AvatarImage src={u.avatar} />}
                                <AvatarFallback className="text-[10px]">
                                  {(u.displayName || u.username).slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold truncate text-foreground">
                                  {u.displayName || u.username}
                                </p>
                                <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                              </div>
                            </DropdownMenuItem>
                          );
                        })
                      )
                    ) : (
                      convosLoading ? (
                        <div className="p-4 flex justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="text-xs">No active conversations</p>
                        </div>
                      ) : (
                        conversations.map((convo: any) => (
                          <NavbarConversationItem
                            key={convo.id}
                            convo={convo}
                            myUserId={user?.id || ""}
                            onClick={(partnerInfo) => {
                              openChatBox(partnerInfo);
                              setMessagesDropdownOpen(false);
                            }}
                          />
                        ))
                      )
                    )}
                  </div>

                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 flex justify-center bg-muted/30">
                    <Link
                      href="/messages"
                      className="text-[11px] font-medium text-primary hover:underline"
                      onClick={() => setMessagesDropdownOpen(false)}
                    >
                      See all in Messages
                    </Link>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <Link href="/profile">
              <Avatar className="w-9 h-9 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/50 transition-all">
                <AvatarImage
                  src={displayAvatar || "/images/default-user.jpg"}
                  alt={displayName}
                />
                <AvatarFallback>{displayName}</AvatarFallback>
              </Avatar>
            </Link>

          </div>
        </div>
        )}
      </div>
    </nav>
  );
}
