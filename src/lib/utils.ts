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

/**
 * Returns true when the value is a parseable http/https URL.
 * Useful for validating user-entered media URLs before adding them to a list.
 */
export function isValidHttpUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
