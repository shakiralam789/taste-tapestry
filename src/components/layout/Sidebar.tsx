"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Sparkles,
  Clock,
  Heart,
  MessageCircle,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/AuthContext";
import { getProfile, PROFILE_QUERY_STALE_MS } from "@/features/profile/api";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/discover", icon: Compass, label: "Discover" },
  { path: "/mood", icon: Sparkles, label: "Moods" },
  { path: "/capsules", icon: Clock, label: "Capsules" },
  { path: "/matches", icon: Heart, label: "Matches" },
  // { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: "/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user: authUser } = useAuth();
  const collapsed = pathname === "/profile";
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!authUser,
    staleTime: PROFILE_QUERY_STALE_MS,
  });

  return (
    <aside
      className={`fixed left-0 top-0 hidden md:flex h-screen flex-col border-r border-sidebar-border bg-sidebar z-40 transition-all duration-200 ${
        collapsed ? "w-20 px-2 py-4" : "w-64 p-4"
      }`}
    >
      <div className={`mb-8 ${collapsed ? "px-0" : "px-4 py-2"}`}>
        <Link
          href="/"
          className={`flex items-center gap-3 group ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-cyber flex items-center justify-center shadow-glow group-hover:shadow-neon transition-all duration-300">
            <span className="text-xl">🌌</span>
          </div>
          {!collapsed && (
            <span className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-cyber">
              Nebula
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full ${
                  collapsed ? "justify-center" : "justify-start"
                } gap-3 text-base font-medium h-12 mb-1 ${
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/20 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]"
                    : "text-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <item.icon
                  className={`w-6 h-6 ${isActive ? "text-primary" : ""}`}
                />
                {!collapsed && item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Actions */}
      {profile && !profileLoading && (
        <div className="pt-4 border-t border-sidebar-border mt-auto space-y-2">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage
                src={profile?.avatar || "/images/default-user.jpg"}
              />
              <AvatarFallback>{profile?.displayName || ""}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-foreground">
                    {profile?.displayName || ""}
                  </p>
                  {profile?.username && (
                    <p className="text-xs text-muted-foreground truncate">
                      @{profile?.username || ""}
                    </p>
                  )}
                </div>
                <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </>
            )}
          </Link>
        </div>
      )}
    </aside>
  );
}
