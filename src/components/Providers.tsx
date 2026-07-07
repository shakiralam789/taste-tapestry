"use client";

import { useState, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WishbookProvider } from "@/contexts/WishbookContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <TooltipProvider>
          <WishbookProvider>
            <AnalyticsProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                {children}
              </AuthProvider>
            </AnalyticsProvider>
          </WishbookProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
