import axios from 'axios';

export const backendBaseUrl = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL.slice(0, -4) : import.meta.env.VITE_API_URL)
  : "http://localhost:8080";

const axiosClient = axios.create({
  baseURL: backendBaseUrl,
  timeout: 20000,
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

    const isLoginApi = originalRequest.url.includes("/api/auth/login") || originalRequest.url.includes("/api/auth/google");

    if (error.response && error.response.status === 401 && !originalRequest._retry && !isLoginApi) {
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
        if (refreshError.message === "Guest user accessing protected resource") {
          // Khách truy cập tính năng cần bảo vệ, không popup alert tự động khi tải trang
        } else {
          alert("Phiên đăng nhập đã hết hạn hoàn toàn. Vui lòng đăng nhập lại!");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
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