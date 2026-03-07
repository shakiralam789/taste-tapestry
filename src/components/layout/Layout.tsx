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
import { MessagesProvider } from "@/features/messages/MessagesContext";

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
  const isMessagesPage = pathname.startsWith("/messages");
  const isClient = typeof window !== "undefined";

  return (
    <NotificationsProvider>
      <MessagesProvider>
        <div
          className={cn(
            "bg-background text-foreground flex flex-col font-body selection:bg-primary/20 selection:text-primary",
            isMessagesPage ? "h-screen overflow-hidden" : "min-h-screen"
          )}
        >
          {/* Top navigation */}
          <Navbar />

          <NotificationsSocketRoot />

          {/* Left sidebar */}
          {isClient && <Sidebar />}

          <main
            className={cn(
              "flex-1 w-full transition-all duration-300",
              isMessagesPage ? "overflow-hidden" : "min-h-screen",
              isHomePage && "xl:pr-80",
              isProfilePage ? "md:pl-20" : "md:pl-64"
            )}
          >
            <div
              className={cn(
                "w-full h-full px-4 md:px-8 pt-4",
                isMessagesPage ? "overflow-hidden pb-0" : "pb-20 md:pb-8",
                className
              )}
            >
              {children}
            </div>
          </main>

          {/* Right sidebar only on homepage */}
          {isHomePage && <RightSidebar />}

          {/* Mobile bottom navigation */}
          <MobileNav />
        </div>
      </MessagesProvider>
    </NotificationsProvider>
  );
}