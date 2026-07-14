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
import { getTotalUnreadCount } from "@/features/messages/api";
import { globalSearchItems, type GlobalSearchItemResult } from "@/features/users/api";

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

  const { notifications, unreadCount: notificationsUnreadCount, markAllRead, markAsRead } = useNotifications();
  const { displayName, displayAvatar } = useProfileInfo();
  const { user } = useAuth();

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
                placeholder="Search movie, song, book..."
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
            {/* Notifications */}
            <DropdownMenu>
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
                    {notifications.length > 0 && (
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
                  {notifications.length === 0 ? (
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

            {/* Messages */}
            <Link href="/messages">
              <Button variant="ghost" size="icon" className="relative">
                <MessageCircle className="w-5 h-5" />
                {messagesUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-semibold flex items-center justify-center">
                    {messagesUnreadCount > 9 ? "9+" : messagesUnreadCount}
                  </span>
                )}
              </Button>
            </Link>

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
