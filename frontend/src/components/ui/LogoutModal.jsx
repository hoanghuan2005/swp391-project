import React from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LogoutModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    // 1. Xóa token và dữ liệu user khỏi localStorage
    localStorage.removeItem("token");
    // localStorage.removeItem("user"); // Nếu bạn có lưu thông tin user

    // 2. Đóng modal
    onClose();

    // 3. Đá người dùng về trang login
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay làm mờ phía sau */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Khung Modal chính theo thiết kế */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-center shadow-2xl transition-all border border-slate-100 flex flex-col items-center">
        
        {/* Icon Logout hình tròn gradient */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f26522] to-[#ff9e67] shadow-lg shadow-[#f26522]/30 animate-bounce-short">
          <LogOut className="h-7 w-7 text-white ml-1" />
        </div>

        {/* Tiêu đề & Nội dung */}
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Logging Out
        </h3>
        <p className="text-sm font-medium text-slate-500 max-w-xs mb-8">
          Are you sure you want to log out of your account?
        </p>

        {/* Cụm Nút Bấm */}
        <div className="w-full space-y-3">
          {/* Nút Xác nhận Đăng xuất (Gradient cam) */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 bg-gradient-to-r from-[#f26522] to-[#ff9e67] hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-[#f26522]/20 transition-all transform active:scale-[0.98] text-sm"
          >
            Yes, Log Out
          </button>

          {/* Nút Hủy (Màu xám nhạt) */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all transform active:scale-[0.98] text-sm"
          >
            Cancel
          </button>
        </div>

        {/* Đường gạch ngang & Dòng ghi chú nhỏ phía dưới */}
        <div className="w-full border-t border-slate-100 mt-6 pt-5">
          <p className="text-[11px] font-medium text-slate-400">
            You'll need to sign in again to access your account
          </p>
        </div>

      </div>
    </div>
  );
};

export default LogoutModal;