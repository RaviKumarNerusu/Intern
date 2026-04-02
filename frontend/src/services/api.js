import axios from "axios";

const API_BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export const getApiErrorMessage = (error, fallbackMessage = "Something went wrong") => {
  const backendMessage = error?.response?.data?.message;

  if (backendMessage) {
    return backendMessage;
  }

  return fallbackMessage;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let pendingRequests = [];

const flushPendingRequests = (error, token) => {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(token);
  });
  pendingRequests = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    const status = error.response?.status;
    const hasRefreshToken = Boolean(localStorage.getItem("refreshToken"));
    const isAuthEndpoint = originalRequest.url?.includes("/auth/login")
      || originalRequest.url?.includes("/auth/refresh")
      || originalRequest.url?.includes("/auth/register");

    if (status === 401 && hasRefreshToken && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            resolve: (token) => {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const refreshResponse = await api.post("/api/auth/refresh", { refreshToken });
        const nextToken = refreshResponse.data.data.token;
        const nextRefreshToken = refreshResponse.data.data.refreshToken || refreshToken;

        localStorage.setItem("token", nextToken);
        localStorage.setItem("refreshToken", nextRefreshToken);

        flushPendingRequests(null, nextToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        flushPendingRequests(refreshError);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
