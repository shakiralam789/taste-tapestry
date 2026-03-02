"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { RightSidebar } from "./RightSidebar";
import { MobileNav } from "./MobileNav";
import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";
import { useNotificationsSocket } from "@/features/notifications/useNotificationsSocket";
import { NotificationsProvider } from "@/features/notifications/NotificationsContext";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

function NotificationsSocketRoot() {
  useNotificationsSocket();
  return null;
}

export function Layout({ children, className }: LayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isProfilePage = false;
  const isClient = typeof window !== "undefined";

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-body selection:bg-primary/20 selection:text-primary">
        {/* Top navigation with notifications bell and dropdown */}
        <Navbar />
        
        <NotificationsSocketRoot />
        {isClient && <Sidebar />}

        <main
          className={cn(
            "flex-1 w-full min-h-screen transition-all duration-300",
            isHomePage && "xl:pr-80",
            isProfilePage ? "md:pl-20" : "md:pl-64",
          )}
        >
          <div className={cn(`w-full h-full px-4 pb-20 md:pb-8 md:px-8 pt-4`, className)}>
            {children}
          </div>
        </main>

        {isHomePage && <RightSidebar />}
        <MobileNav />
      </div>
    </NotificationsProvider>
  );
}
