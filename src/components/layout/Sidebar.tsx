"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/AuthContext";
import { getProfile, PROFILE_QUERY_STALE_MS } from "@/features/profile/api";
import { useQuery } from "@tanstack/react-query";
import { searchUsers, type UserSearchHit } from "@/features/users/api";

const navItems = [
  { path: "/discover", icon: Compass, label: "Discover" },
  { path: "/mood", icon: Sparkles, label: "Moods" },
  { path: "/matches", icon: Heart, label: "Matches" },
  // { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: "/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const collapsed = false;
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!authUser,
    staleTime: PROFILE_QUERY_STALE_MS,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const list = await searchUsers(q, {
          excludeUserId: authUser?.id,
        });
        setSearchResults(list);
        setDropdownOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [authUser?.id]
  );

  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectUser = (id: string) => {
    setDropdownOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    router.push(`/users/${id}`);
  };

  return (
    <aside
      className={`fixed pt-20 left-0 top-0 hidden md:flex h-screen flex-col border-r border-sidebar-border bg-sidebar z-40 transition-all duration-200 ${
        collapsed ? "w-20 px-2 py-4" : "w-64 p-4"
      }`}
    >
      {/* User search (same as navbar) */}
      <div
        className={`mb-4 ${collapsed ? "hidden" : "block"}`}
        ref={searchContainerRef}
      >
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() =>
              searchResults.length > 0 && setDropdownOpen(true)
            }
            placeholder="Search users..."
            className="pl-10 h-10 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-foreground focus:border-primary/50 focus:ring-primary/20 rounded-full transition-all"
          />
          {dropdownOpen &&
            (searchQuery.trim() || searchResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 p-1 rounded-xl bg-popover border border-border shadow-lg z-50 max-h-72 overflow-y-auto">
                {searching ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                    Searching...
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                    {searchQuery.trim()
                      ? "No users found"
                      : "Type to search users"}
                  </p>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={user.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {(
                            user.displayName ||
                            user.username ||
                            "?"
                          )[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.displayName || user.username || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username || user.id}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
        </div>
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
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
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
