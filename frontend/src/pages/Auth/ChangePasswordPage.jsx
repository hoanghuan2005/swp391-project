import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/picture-study.png";

const ChangePasswordPage = () => {
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();

    const handleUpdatePassword = (e) => {
        e.preventDefault();
        // Gọi API update pass xong thì:
        alert("Password updated successfully!");
        navigate("/login");
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 bg-cover bg-no-repeat relative py-10 px-4"
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundPosition: "center" }}>
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="relative z-10 w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-[#f26522]/10 rounded-2xl flex items-center justify-center rotate-12">
                        <ShieldCheck className="text-[#f26522] -rotate-12" size={32} />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Change Password</h2>
                <p className="text-slate-400 text-xs mb-8">Secure your account by updating your password.</p>

                <form className="space-y-4 text-left">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="password"
                                placeholder="Enter your new password"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Confirm New Password</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder="Confirm your new password"
                                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] outline-none"
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#f26522]">
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button className="w-full py-3.5 bg-[#f26522] hover:bg-[#d9541a] text-white font-bold rounded-2xl shadow-lg shadow-[#f26522]/20 transition-all active:scale-[0.98] pt-4">
                        Update Password
                    </button>
                </form>

                <p className="text-xs text-slate-400 mt-6">
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