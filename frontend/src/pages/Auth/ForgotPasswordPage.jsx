import React, { useState } from "react";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/picture-study.png";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Sau này ông gọi API gửi mail ở đây
      // const res = await axiosClient.post("/api/auth/forgot-password", { email });
      console.log("Đang gửi OTP đến:", email);
      
      // Giả lập gửi thành công thì sang trang Verify
      setTimeout(() => {
        setIsLoading(false);
        navigate("/verify-account");
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      alert("Error when sending request!");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 bg-cover bg-no-repeat relative py-10 px-4"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center">
        {/* Icon Header */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#f26522]/10 rounded-2xl flex items-center justify-center rotate-12 shadow-sm">
             <div className="w-10 h-10 bg-[#f26522]/20 rounded-xl flex items-center justify-center -rotate-12">
                <span className="text-[#f26522] text-xl">🔄</span>
             </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-2">Forgot Password</h2>
        <p className="text-slate-400 text-xs mb-8 leading-relaxed">
          Enter your registered email address below and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSendOTP} className="space-y-6 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f26522] transition-colors" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#f26522] hover:bg-[#d9541a] text-white font-bold rounded-2xl shadow-lg shadow-[#f26522]/30 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? "Sending..." : "Send Reset OTP"}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50">
          <button 
            onClick={() => navigate("/login")}
            className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors w-full"
          >
            <ArrowLeft size={14} />
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;