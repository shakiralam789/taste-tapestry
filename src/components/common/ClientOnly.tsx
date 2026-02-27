"use client";

import type { ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
}

export function ClientOnly({ children }: ClientOnlyProps) {
  if (typeof window === "undefined") {
    return null;
  }

  return <>{children}</>;
}

