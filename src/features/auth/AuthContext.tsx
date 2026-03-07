"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "./api";
import { login, register as registerRequest } from "./api";
import { apiClient, setAccessToken } from "@/lib/api-client";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  loginWithEmail: (emailOrUsername: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName?: string,
    username?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Called on mount and after any token refresh failure to reset auth state
  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // On mount: attempt a silent refresh using the HttpOnly cookie.
  // If the cookie is present and valid the backend will return a fresh
  // access token that we keep only in memory.
  const initialize = useCallback(async () => {
    try {
      const { data } = await apiClient.post<{
        user: AuthUser;
        accessToken: string;
      }>("/auth/refresh");
      setAccessToken(data.accessToken);
      setUser(data.user);
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Listen for the event dispatched by the response interceptor when refresh
  // fails mid-session (e.g. cookie expired while the tab was open).
  useEffect(() => {
    const handler = () => {
      clearAuth();
      queryClient.clear();
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [clearAuth, queryClient]);

  const loginWithEmail = useCallback(
    async (emailOrUsername: string, password: string) => {
      const res = await login({ emailOrUsername, password });
      // The backend sets the HttpOnly refresh cookie automatically.
      // We only keep the access token in memory.
      setAccessToken(res.accessToken);
      setUser(res.user);
      queryClient.clear();
    },
    [queryClient],
  );

  const registerWithEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string,
      username?: string,
    ) => {
      if (!username?.trim()) {
        throw new Error("Username is required");
      }
      const res = await registerRequest({
        email,
        username: username.trim(),
        password,
        displayName,
      });
      setAccessToken(res.accessToken);
      setUser(res.user);
      queryClient.clear();
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      // The backend clears the HttpOnly cookie; we clear the in-memory token.
      await apiClient.post("/auth/logout");
    } finally {
      clearAuth();
      queryClient.clear();
    }
  }, [clearAuth, queryClient]);

  const value: AuthContextValue = {
    user,
    loading,
    loginWithEmail,
    registerWithEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // During Next.js prerender/export, some pages may be rendered outside the
    // provider. Return a safe fallback on the server; enforce usage on the client.
    if (typeof window === "undefined") {
      return {
        user: null,
        loading: true,
        loginWithEmail: async () => { },
        registerWithEmail: async () => { },
        logout: async () => { },
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
