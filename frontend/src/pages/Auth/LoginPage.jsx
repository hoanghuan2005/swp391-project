import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { jwtDecode } from "jwt-decode";

import axiosClient, { backendBaseUrl } from "../../api/axiosClient";
import backgroundImage from "../../assets/picture-study.png";

const fireSuccessConfetti = () => {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#f26522", "#ffffff", "#22c55e"],
  });
};

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // HÀM XỬ LÝ ĐĂNG NHẬP THƯỜNG (CẬP NHẬT REFRESH TOKEN)
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axiosClient.post("/api/auth/login", {
        email: email,
        password: password,
      });

      if (response.data) {
        // 💥 BÓC TÁCH: Lấy cặp bài trùng accessToken và refreshToken từ Object JSON mới của Backend
        const { accessToken, refreshToken } = response.data;

        if (accessToken) {
          // Lưu cả 2 mã vào localStorage bảo mật
          localStorage.setItem("token", accessToken);
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          } else {
            localStorage.removeItem("refreshToken");
          }

          try {
            // Giải mã Access Token mới để check Role quyền hạn
            const decoded = jwtDecode(accessToken);
            const role = decoded.role;

            fireSuccessConfetti();
            setTimeout(() => {
              if (role === "ADMIN") {
                navigate("/admin/dashboard");
              } else {
                navigate("/home");
              }
            }, 1500);
          } catch (e) {
            console.error("Token decode error", e);
            navigate("/home");
          }
        }
      }
    } catch (error) {
      // Vì Backend mới đã quăng Http Status 401 khi gõ sai tài khoản, lỗi sẽ tự nhảy vào block catch này
      const errorMsg = error.response?.data || error.message;
      console.error("Login error detail:", errorMsg);

      const messageText = typeof errorMsg === "string" ? errorMsg : "";
      if (messageText.toLowerCase().includes("verify")) {
        alert("Tài khoản chưa xác thực. Vui lòng nhập OTP đã gửi qua email.");
        navigate("/verify-account", { state: { email, mode: "signup" } });
        return;
      }

      // Hiện thông báo đẹp đẽ cho người dùng thay vì nuốt trọn cục chữ lỗi lưu vào máy
      alert(
        "Đăng nhập thất bại: " +
          (messageText || "Sai tài khoản hoặc mật khẩu!"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${backendBaseUrl}/oauth2/authorization/google`;
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-slate-900 bg-cover bg-no-repeat relative py-10 px-4"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl p-7 shadow-2xl mx-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-[#f26522] italic tracking-tighter mb-2">
            MinDoCu
          </h1>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">
            Welcome Back!
          </h2>
          <p className="text-slate-500 text-sm">
            Sign in to continue your journey with us
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">
              Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#f26522] transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#f26522] transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-11 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-medium">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-[#f26522] focus:ring-[#f26522]"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-[#f26522] hover:underline font-semibold"
            >
              Forgot password?
            </button>
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#f26522] hover:bg-[#d9541a] text-white font-bold rounded-xl shadow-lg shadow-[#f26522]/30 transition-all transform active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? "Authenticating..." : "Log In"}
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                Or continue with
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-3"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5"
                alt="google"
              />
              Sign in with Google
            </button>
          </div>
        </form>

        <p className="text-center mt-5 text-sm text-slate-500 font-medium">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-[#f26522] font-bold hover:underline ml-1"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
