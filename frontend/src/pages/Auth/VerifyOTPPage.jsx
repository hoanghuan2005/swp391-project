import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import backgroundImage from "../../assets/picture-study.png";
import { Lock } from "lucide-react";
import axiosClient from "../../api/axiosClient"; // Đảm bảo bạn đã import axiosClient

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(59);
  const [isResending, setIsResending] = useState(false); // THÊM DÒNG NÀY
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const location = useLocation();
  const email = location.state?.email || "your email";
  const mode = location.state?.mode || "reset";

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1].focus();
    } else if (e.key === "Enter") {
      handleVerify(e);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(data)) return;
    const pasteData = data.split("");
    const newOtp = [...otp];
    pasteData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
    const nextIndex = data.length < 6 ? data.length : 5;
    inputRefs.current[nextIndex].focus();
  };

  // HÀM VERIFY ĐÃ CẬP NHẬT GỌI API
  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      alert("Please input all 6 numbers!");
      return;
    }

    try {
      // Gọi API kiểm tra OTP (Sử dụng đúng Endpoint bạn vừa tạo ở Controller)
      // TRONG VerifyOTPPage.jsx
      const endpoint =
        mode === "signup"
          ? "/api/auth/verify-signup-otp"
          : "/api/auth/verify-otp";
      const response = await axiosClient.post(
        `${endpoint}?email=${email}&otp=${code}`,
      );
      if (response.status === 200) {
        if (mode === "signup") {
          alert("Account verified successfully! Please sign in.");
          navigate("/login");
        } else {
          // ĐÚNG MÃ -> Mới cho sang trang đổi mật khẩu
          navigate("/change-password", { state: { email, otp: code } });
        }
      }
    } catch (error) {
      console.error("Verify error:", error.response?.data);
      alert(error.response?.data || "Invalid OTP Code!");

      // Tùy chọn: Xóa OTP cũ để người dùng nhập lại từ đầu
      setOtp(new Array(6).fill(""));
      inputRefs.current[0].focus();
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const endpoint =
        mode === "signup"
          ? "/api/auth/resend-signup-otp"
          : "/api/auth/forgot-password";
      await axiosClient.post(`${endpoint}?email=${email}`);
      alert("A new OTP Code has been sent!");
      setTimer(59);
    } catch (error) {
      console.error("Resend error:", error);
      alert("Can't resend OTP, please try again later.");
    } finally {
      setIsResending(false);
    }
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

      <div className="relative z-10 w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-[#f26522]/10 rounded-2xl flex items-center justify-center">
            <Lock className="text-[#f26522]" size={32} />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Verify Account
        </h2>
        <p className="text-slate-400 text-xs mb-8 leading-relaxed">
          Check your email for the code sent to
          <br />
          <span className="text-[#f26522] font-semibold">{email}</span>
        </p>

        <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
          {otp.map((data, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              value={data}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-11 h-12 border-2 border-slate-100 bg-slate-50 rounded-xl text-center text-xl font-bold text-slate-800 focus:border-[#f26522] focus:bg-white focus:outline-none transition-all"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          className="w-full py-4 bg-[#f26522] hover:bg-[#d9541a] text-white font-bold rounded-2xl shadow-lg shadow-[#f26522]/20 transition-all active:scale-[0.95] mb-6"
        >
          Verify OTP
        </button>

        <p className="text-xs text-slate-400 font-medium">
          Didn't receive code?{" "}
          <button
            onClick={handleResendOTP}
            disabled={timer > 0 || isResending}
            className="text-[#f26522] font-bold hover:underline disabled:opacity-50"
          >
            {isResending ? "Sending..." : `Resend (${timer}s)`}
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
