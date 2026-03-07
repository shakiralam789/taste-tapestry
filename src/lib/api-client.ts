import axios from "axios";

// ── In-memory access token store ──────────────────────────────────────────────
// Never written to localStorage/sessionStorage. Lives only in JS heap.
// Cleared on page refresh (user re-authenticates via the HttpOnly refresh cookie).
let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ── Axios instance ────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true, // required so the HttpOnly refresh cookie is sent
});

// ── Request interceptor — attach in-memory token ──────────────────────────────
apiClient.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ── Response interceptor — silent token refresh on 401 ───────────────────────
// When any request gets a 401 we attempt one silent refresh via the HttpOnly
// cookie. If that succeeds we update the in-memory token and replay the
// original request. If it fails the user is effectively logged out (the
// AuthContext will clear its state on the next auth check).

let refreshPromise: Promise<string> | null = null; // deduplicate concurrent refreshes

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401s once per request; skip auth endpoints themselves
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      typeof originalRequest.url !== "string" ||
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/register") ||
      originalRequest.url.includes("/auth/refresh") ||
      originalRequest.url.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // If multiple requests fail at the same time, deduplicate to a single refresh call
      if (!refreshPromise) {
        refreshPromise = apiClient
          .post<{ accessToken: string }>("/auth/refresh")
          .then((res) => res.data.accessToken)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      setAccessToken(newToken);

      // Replay the original request with the fresh token
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch {
      // Refresh failed — clear in-memory token; the HttpOnly cookie is gone too
      setAccessToken(null);
      // Dispatch a custom event so the AuthContext can react (clear user state)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }
      return Promise.reject(error);
    }
  },
);
