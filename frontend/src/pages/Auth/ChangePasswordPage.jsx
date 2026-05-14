import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom"; // Thêm useLocation
import backgroundImage from "../../assets/picture-study.png";
import axiosClient from "../../api/axiosClient"; // Import axiosClient của bạn

const ChangePasswordPage = () => {
    const [showPass, setShowPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy email và otp đã được truyền từ trang VerifyOTP sang
    const { email, otp } = location.state || {};

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert("Password confirmation does not match!");
            return;
        }

        if (!email || !otp) {
            alert("Missing session information. Please start over.");
            navigate("/forgot-password");
            return;
        }

        setIsLoading(true);

        try {
            // GỌI API THẬT ĐỂ ĐỔI MẬT KHẨU TRONG DATABASE
            const response = await axiosClient.post("/api/auth/reset-password", null, {
                params: {
                    email: email,
                    otp: otp,
                    newPassword: password
                }
            });

            if (response.status === 200) {
                alert("Password changed successfully! Please log in with your new password.");
                navigate("/login");
            }
        } catch (error) {
            console.error("Update password error:", error.response?.data);
            alert(error.response?.data || "Something went wrong, please try again later!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 bg-cover bg-no-repeat relative py-10 px-4"
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundPosition: "center" }}>
            
            <div className="absolute inset-0 bg-black/50"></div>

            <div className="relative z-10 w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-[#f26522]/10 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="text-[#f26522]" size={32} />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">New Password</h2>
                <p className="text-slate-400 text-xs mb-8">
                    Resetting password for: <span className="text-[#f26522] font-semibold">{email}</span>
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-4 text-left">
                    {/* New Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">New Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f26522] transition-colors" size={18} />
                            <input
                                type={showPass ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Confirm New Password</label>
                        <div className="relative group">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f26522] transition-colors" size={18} />
                            <input
                                type={showPass ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] outline-none transition-all"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPass(!showPass)} 
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#f26522] transition-colors"
                            >
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-[#f26522] hover:bg-[#d9541a] text-white font-bold rounded-2xl shadow-lg shadow-[#f26522]/30 transition-all active:scale-[0.98] disabled:opacity-70 mt-2"
                    >
                        {isLoading ? "Updating..." : "Update Password"}
                    </button>
                </form>

                <p className="text-xs text-slate-400 mt-8 font-medium">
                    Change your mind? <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-[#f26522] font-bold hover:underline"
                    >
                        Cancel
                    </button>
                </p>
            </div>
        </div>
    );
};

export default ChangePasswordPage;