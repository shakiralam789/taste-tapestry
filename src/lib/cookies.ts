export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const pattern = new RegExp(
    "(?:^|;\\s*)" + name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&") + "=([^;]*)",
  );
  const match = document.cookie.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(
  name: string,
  value: string,
  options?: { maxAgeSeconds?: number; path?: string },
): void {
  if (typeof document === "undefined") return;
  const parts = [`${name}=${encodeURIComponent(value)}`];
  const path = options?.path ?? "/";
  if (path) parts.push(`path=${path}`);
  if (options?.maxAgeSeconds != null) {
    parts.push(`max-age=${options.maxAgeSeconds}`);
  }
  document.cookie = parts.join("; ");
}

export function deleteCookie(name: string, path: string = "/"): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=${path}; max-age=0`;
}

