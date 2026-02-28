"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/AuthContext';
import { searchUsers, type UserSearchHit } from '@/features/users/api';

export function RightSidebar() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
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
  }, [authUser?.id]);

  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (id: string) => {
    setDropdownOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/users/${id}`);
  };

  const trends = [
    { tag: '#CyberPunk2077', posts: '54.2k' },
    { tag: '#NeuralLink', posts: '32.1k' },
    { tag: '#SpaceX', posts: '28.4k' },
    { tag: '#AIArt', posts: '21.9k' },
  ];

  const suggestions = [
    { name: 'Sarah Connor', handle: '@resistence', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { name: 'Neo Anderson', handle: '@theone', avatar: 'https://i.pravatar.cc/150?u=neo' },
  ];

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 bg-sidebar border-l border-sidebar-border hidden xl:flex flex-col p-6 z-40 gap-8 overflow-y-auto">
      {/* User search */}
      <div className="relative group" ref={containerRef}>
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setDropdownOpen(true)}
          placeholder="Search users..."
          className="pl-10 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-foreground focus:border-primary/50 focus:ring-primary/20 h-12 rounded-full transition-all"
        />
        {dropdownOpen && (searchQuery.trim() || searchResults.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 p-1 rounded-xl bg-popover border border-border shadow-lg z-50 max-h-72 overflow-y-auto">
            {searching ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                {searchQuery.trim() ? 'No users found' : 'Type to search users'}
              </p>
            ) : (
              searchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarImage src={user.avatar ?? undefined} />
                    <AvatarFallback className="text-sm">
                      {(user.displayName || user.username || '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.displayName || user.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username || user.id}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Trending */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Trending Now
        </h3>
        <div className="space-y-4 bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/10 dark:border-white/10">
          {trends.map((trend, i) => (
            <div key={i} className="flex justify-between items-center group cursor-pointer">
              <div>
                <p className="font-bold group-hover:text-primary transition-colors">{trend.tag}</p>
                <p className="text-xs text-muted-foreground">{trend.posts} posts</p>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-muted-foreground text-xl">→</span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Users */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-secondary" />
          Who to Follow
        </h3>
        <div className="space-y-4">
          {suggestions.map((user, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
              <Avatar className="w-10 h-10 ring-2 ring-transparent group-hover:ring-secondary/50 transition-all">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.handle}</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full border-secondary/50 text-secondary hover:bg-secondary hover:text-white">
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-auto pt-4 text-xs text-muted-foreground text-center">
        <p>© 2026 Nebula Social. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <span className="hover:text-primary cursor-pointer">Privacy</span>
          <span className="hover:text-primary cursor-pointer">Terms</span>
          <span className="hover:text-primary cursor-pointer">More</span>
        </div>
      </div>
    </aside>
  );
}
