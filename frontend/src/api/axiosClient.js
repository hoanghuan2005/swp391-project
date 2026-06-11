import axios from 'axios';

export const backendBaseUrl = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL.slice(0, -4) : import.meta.env.VITE_API_URL)
  : "http://localhost:8080";

const axiosClient = axios.create({
  baseURL: backendBaseUrl,
  timeout: 20000,
  // TẠM TẮT DÒNG NÀY ĐỂ TRÁNH LỖI CORS 401
  // withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

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
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await axios.post(`${backendBaseUrl}/api/auth/refresh-token`, {
          refreshToken: refreshToken,
        });

        if (res.status === 200) {
          const { accessToken } = res.data;

          localStorage.setItem("token", accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Refresh token expired or invalid:", refreshError);
        alert("Phiên đăng nhập đã hết hạn hoàn toàn. Vui lòng đăng nhập lại!");

        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    if (error.response && error.response.status === 403) {
      console.warn("Bạn không có quyền truy cập API này:", error.config.url);
      alert("Bạn không có quyền truy cập vào tính năng/tài liệu này!");
    }

    return Promise.reject(error);
  }
);

export default axiosClient;