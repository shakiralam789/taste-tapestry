import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { MobileNav } from './MobileNav';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-body selection:bg-primary/20 selection:text-primary">
      <Sidebar />

      <main
        className={`flex-1 w-full md:pl-64 min-h-screen transition-all duration-300 ${isHomePage ? 'xl:pr-80' : ''}`}
      >
        <div className={`w-full h-full px-4 pb-20 md:pb-8 md:px-8 pt-4 ${className || ''}`}>
          {children}
        </div>
      </main>

      {isHomePage && <RightSidebar />}
      <MobileNav />
    </div>
  );
}
