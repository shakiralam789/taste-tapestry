import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Applies a Cloudinary transformation to an existing Cloudinary URL.
 * Automatically handles sizing, formatting (f_auto), and quality (q_auto) 
 * for optimized inline rendering while preserving the original URL.
 */
export function getOptimizedUrl(url: string | undefined | null, width: number = 800): string | undefined {
  if (!url) return undefined;
  if (!url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
}
