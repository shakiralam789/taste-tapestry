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

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/discover", icon: Compass, label: "Collections" },
  { path: "/mood", icon: Sparkles, label: "Hidden talents" },
  { path: "/capsules", icon: Clock, label: "Capsules" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: wishbookUser } = useWishbook();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();
   const { displayName, displayAvatar } = useProfileInfo();
  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="px-6">
        <div className="grid grid-cols-12 items-center justify-between h-16">
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
                    className={`gap-2 ${
                      isActive ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
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
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-semibold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
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
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-xs text-muted-foreground text-center">
                      No notifications yet.
                    </div>
                  ) : (
                    <>
                      {(showAllNotifications
                        ? notifications
                        : notifications.slice(0, 10)
                      ).map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          className={`flex items-center gap-3 ${
                            !n.read ? "" : ""
                          }`}
                        >
                          {n.actorId && (
                            <button
                              type="button"
                              onClick={() => {
                                router.push(`/users/${n.actorId}`);
                              }}
                              className="shrink-0"
                            >
                              <Avatar className="w-7 h-7 ring-1 ring-primary/30">
                                <AvatarImage
                                  src={n.actorAvatar ?? undefined}
                                  alt={n.actorDisplayName ?? "User"}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {(n.actorDisplayName ?? "?")[0]}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                          )}
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-xs font-medium">
                              {n.title}
                            </span>
                            {n.description && (
                              <span className="text-[11px] text-muted-foreground">
                                {n.description}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {n.createdAt.toLocaleTimeString()}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      {notifications.length > 10 && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="px-3 py-1.5 flex justify-center">
                            <button
                              type="button"
                              className="text-[11px] text-primary hover:underline"
                              onClick={() =>
                                setShowAllNotifications((prev) => !prev)
                              }
                            >
                              {showAllNotifications
                                ? "Show latest 10"
                                : "See more"}
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
              <Button variant="ghost" size="icon">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>

            {/* Profile */}
            <Link href="/profile">
              <Avatar className="w-9 h-9 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/50 transition-all">
                <AvatarImage
                  src={displayAvatar}
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
