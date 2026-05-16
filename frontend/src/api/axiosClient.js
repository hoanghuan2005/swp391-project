import axios from 'axios';

const axiosClient = axios.create({
    baseURL: "http://localhost:8080",
    timeout: 20000, 
    headers: {
        "Content-Type": "application/json",
    },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    // Nếu API thành công (mã 200), cho đi tiếp bình thường
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      alert("Your session has expired or your account has been banned by Admin.");

      localStorage.removeItem("token");

      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;