import axios from 'axios';
import { toast } from 'sonner';

export const backendBaseUrl = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL.slice(0, -4) : import.meta.env.VITE_API_URL)
  : "http://localhost:8080";

const axiosClient = axios.create({
  baseURL: backendBaseUrl,
  timeout: 120000,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    const isLoginApi = originalRequest.url.includes("/api/auth/login") || originalRequest.url.includes("/api/auth/google");

    if (error.response && error.response.status === 401 && !originalRequest._retry && !isLoginApi) {
      // Guest users should not be prompted with session expired alerts when accessing public pages
      if (!isLoggedIn) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const res = await axios.post(`${backendBaseUrl}/api/auth/refresh-token`, {}, {
          withCredentials: true,
        });

        if (res.status === 200) {
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Refresh token expired or invalid:", refreshError);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userRole");

        toast.error("Session expired. Please log in again!");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    if (error.response && error.response.status === 403) {
      console.warn("Bạn không có quyền truy cập API này:", error.config.url);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;