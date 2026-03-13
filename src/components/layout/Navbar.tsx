"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Compass,
  Heart,
  User,
  MessageCircle,
  Bell,
  Menu,
  X,
  Sparkles,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWishbook } from "@/contexts/WishbookContext";
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

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/discover", icon: Compass, label: "Collections" },
  { path: "/mood", icon: Sparkles, label: "Mood" },
  { path: "/capsules", icon: Clock, label: "Capsules" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const { notifications, unreadCount: notificationsUnreadCount, markAllRead, markAsRead } = useNotifications();
  const { displayName, displayAvatar } = useProfileInfo();
  const { user } = useAuth();

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
                  <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
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
      </div>
    </nav>
  );
}
