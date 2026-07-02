"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Compass,
  User,
  MessageCircle,
  Bell,
  Sparkles,
  Clock,
  Search,
  ArrowLeft,
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
import { searchUsers, type UserSearchHit } from "@/features/users/api";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/discover", icon: Compass, label: "Collections" },
  { path: "/capsules", icon: Clock, label: "Capsules" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileSearchResults, setMobileSearchResults] = useState<UserSearchHit[]>([]);
  const [mobileSearching, setMobileSearching] = useState(false);
  const [mobileSearchDropdownOpen, setMobileSearchDropdownOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

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
        const list = await searchUsers(q, { excludeUserId: user?.id });
        setMobileSearchResults(list);
        setMobileSearchDropdownOpen(true);
      } catch {
        setMobileSearchResults([]);
      } finally {
        setMobileSearching(false);
      }
    },
    [user?.id]
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

  const handleMobileSelectUser = (id: string) => {
    setMobileSearchDropdownOpen(false);
    setMobileSearchQuery("");
    setMobileSearchResults([]);
    setIsMobileSearchOpen(false);
    router.push(`/users/${id}`);
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
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <Input
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                onFocus={() => mobileSearchResults.length > 0 && setMobileSearchDropdownOpen(true)}
                placeholder="Search users..."
                className="pl-10 h-8 bg-muted/50 border-border rounded-full w-full"
                autoFocus
              />
              {mobileSearchDropdownOpen && (mobileSearchQuery.trim() || mobileSearchResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 p-1 rounded-xl bg-popover border border-border shadow-lg z-50 max-h-[70vh] overflow-y-auto">
                  {mobileSearching ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">Searching...</p>
                  ) : mobileSearchResults.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                      {mobileSearchQuery.trim() ? "No users found" : "Type to search users"}
                    </p>
                  ) : (
                    mobileSearchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleMobileSelectUser(u.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors"
                      >
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={u.avatar ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(u.displayName || u.username || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{u.displayName || u.username || "User"}</p>
                          <p className="text-xs text-muted-foreground truncate">@{u.username || u.id}</p>
                        </div>
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

          {/* Desktop Navigation */}
          <div className="col-span-8 hidden md:flex items-center justify-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className={`gap-2 ${isActive ? "bg-primary text-primary-foreground" : ""
                    }`}
                >
                  <Link href={item.path}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
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
