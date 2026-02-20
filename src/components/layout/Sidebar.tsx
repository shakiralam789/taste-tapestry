"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Sparkles, Clock, Heart, MessageCircle, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWishbook } from '@/contexts/WishbookContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/mood', icon: Sparkles, label: 'Moods' },
  { path: '/capsules', icon: Clock, label: 'Capsules' },
  { path: '/matches', icon: Heart, label: 'Matches' },
  // { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useWishbook();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col p-4 z-40">
      <div className="mb-8 px-4 py-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-cyber flex items-center justify-center shadow-glow group-hover:shadow-neon transition-all duration-300">
            <span className="text-xl">🌌</span>
          </div>
          <span className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-cyber">
            Nebula
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 text-base font-medium h-12 mb-1 ${
                  isActive 
                    ? 'bg-primary/10 text-primary hover:bg-primary/20 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]' 
                    : 'text-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Actions */}
      <div className="pt-4 border-t border-sidebar-border mt-auto">
        <Link href="/settings" className="flex items-center gap-3 px-2 py-3 mb-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">@{user.name.toLowerCase().replace(' ', '')}</p>
          </div>
          <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        </Link>
      </div>
    </aside>
  );
}
