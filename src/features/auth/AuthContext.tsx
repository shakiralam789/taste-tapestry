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
import { apiClient } from "@/lib/api-client";

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

  const persistAccessToken = useCallback((token: string | null) => {
    if (typeof window === "undefined") return;
    if (!token) {
      window.localStorage.removeItem("accessToken");
    } else {
      window.localStorage.setItem("accessToken", token);
    }
  }, []);

  const initialize = useCallback(async () => {
    try {
      const { data } = await apiClient.post<{
        user: AuthUser;
        accessToken: string;
      }>("/auth/refresh");
      persistAccessToken(data.accessToken);
      setUser(data.user);
    } catch {
      persistAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [persistAccessToken]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const loginWithEmail = useCallback(
    async (emailOrUsername: string, password: string) => {
      const res = await login({ emailOrUsername, password });
      persistAccessToken(res.accessToken);
      setUser(res.user);
      queryClient.clear();
    },
    [persistAccessToken, queryClient],
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
      persistAccessToken(res.accessToken);
      setUser(res.user);
      queryClient.clear();
    },
    [persistAccessToken, queryClient],
  );

  const logout = useCallback(async () => {
    await apiClient.post("/auth/logout");
    persistAccessToken(null);
    setUser(null);
    queryClient.clear();
  }, [persistAccessToken, queryClient]);

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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

