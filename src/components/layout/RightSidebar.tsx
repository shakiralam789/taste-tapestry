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
    <aside className="pt-20 fixed right-0 top-0 h-screen w-80 bg-sidebar border-l border-sidebar-border hidden xl:flex flex-col p-6 z-40 gap-8 overflow-y-auto">
   
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
