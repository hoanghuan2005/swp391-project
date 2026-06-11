import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

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

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);
    try {
      // SỬA CHỖ NÀY: Thêm username gán bằng formData.email (hoặc lấy phần trước chữ @)
      const response = await axiosClient.post("/api/auth/signup", {
        fullName: formData.fullName,
        email: formData.email,
        username: formData.email, // Ép Backend nhận email làm username luôn
        password: formData.password,
      });

      if (response.status === 201 || response.status === 200) {
        fireSuccessConfetti();
        alert("Sign up successful! Please verify the OTP sent to your email.");
        setTimeout(
          () =>
            navigate("/verify-account", {
              state: { email: formData.email, mode: "signup" },
            }),
          600,
        );
      }
    } catch (error) {
      console.error("SignUp error:", error.response?.data || error.message);

      // CẬP NHẬT: Hiện tin nhắn lỗi chi tiết từ Backend trả về để dễ debug
      const serverMessage =
        error.response?.data?.message ||
        "Sign up failed! Please check your connection.";
      alert("Lỗi: " + serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithGoogle = () => {
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
        <div className="text-center mb-3">
          <h1 className="text-4xl font-black text-[#f26522] italic tracking-tighter mb-1">
            MinDoCu
          </h1>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">
            Create Account
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Join our platform today
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-2">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">
              Full Name
            </label>
            <div className="relative group">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f26522] transition-colors"
                size={18}
              />
              <input
                name="fullName"
                type="text"
                required
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] transition-all text-[13px]"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">
              Email
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f26522] transition-colors"
                size={18}
              />
              <input
                name="email"
                type="email"
                required
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] transition-all text-[13px]"
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f26522] transition-colors"
                  size={18}
                />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="w-full pl-11 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] transition-all text-[13px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Confirm
              </label>
              <div className="relative group">
                <ShieldCheck
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f26522] transition-colors"
                  size={18}
                />
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  onChange={handleInputChange}
                  placeholder="Confirm"
                  className="w-full pl-11 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] transition-all text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] font-medium py-1">
            <input
              name="agreeTerms"
              type="checkbox"
              required
              onChange={handleInputChange}
              className="mt-0.5 rounded border-slate-300 text-[#f26522] focus:ring-[#f26522]"
            />
            <span className="text-slate-500 leading-tight">
              I agree to the{" "}
              <span className="text-[#f26522] font-bold cursor-pointer hover:underline">
                Terms
              </span>{" "}
              &{" "}
              <span className="text-[#f26522] font-bold cursor-pointer hover:underline">
                Privacy Policy
              </span>
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={isLoading || !formData.agreeTerms}
              className="w-full py-2.5 bg-[#f26522] hover:bg-[#d9541a] text-white font-bold rounded-xl shadow-lg shadow-[#f26522]/30 transition-all transform active:scale-[0.98] disabled:opacity-50 text-sm"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>

            <div className="relative flex items-center justify-center py-1">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                Or
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={signupWithGoogle}
              className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-sm text-sm"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-4 h-4"
                alt="google"
              />
              Sign up with Google
            </button>
          </div>
        </form>

        <p className="text-center mt-4 text-sm text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-[#f26522] font-bold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
