import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

// Attach access token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401, try to refresh access token once, then retry the original request
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If there's no response or it's not 401, just reject
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Avoid infinite loop and skip auth endpoints themselves
    if (
      originalRequest._retry ||
      typeof originalRequest.url !== "string" ||
      originalRequest.url.startsWith("/auth/login") ||
      originalRequest.url.startsWith("/auth/register") ||
      originalRequest.url.startsWith("/auth/refresh") ||
      originalRequest.url.startsWith("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const res = await apiClient.post<{
        user: { id: string; email: string; accessToken?: string };
        accessToken: string;
      }>("/auth/refresh");

      const newToken = res.data.accessToken;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("accessToken", newToken);
      }

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("accessToken");
      }
      return Promise.reject(refreshError);
    }
  },
);

