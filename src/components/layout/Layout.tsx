"use client";
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isProfilePage = pathname === '/profile';
  const isClient = typeof window !== 'undefined';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-body selection:bg-primary/20 selection:text-primary">
      {isClient && <Sidebar />}

      <main
        className={cn(
          'flex-1 w-full min-h-screen transition-all duration-300',
          isHomePage && 'xl:pr-80',
          isProfilePage ? 'md:pl-20' : 'md:pl-64'
        )}
      >
        <div className={cn(`w-full h-full px-4 pb-20 md:pb-8 md:px-8 pt-4`, className)}>
          {children}
        </div>
      </main>

      {isHomePage && <RightSidebar />}
      <MobileNav />
    </div>
  );
}
