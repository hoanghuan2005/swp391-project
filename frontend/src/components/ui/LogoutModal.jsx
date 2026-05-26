import React from "react";
import { LogOut } from "lucide-react";

const LogoutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleLogout = () => {
    // Clear all local storage entries on logout (including survey flags)
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("Failed to clear localStorage on logout:", e);
    }

    onClose();
    window.location.href = "/login";
  };

  return (
    // FIX: Thêm fixed cho overlay riêng biệt và overflow-y-auto để hỗ trợ màn hình nhỏ/DevTools chiếm chỗ
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Background Overlay làm mờ phía sau */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity cursor-default"
        onClick={onClose}
      ></div>

      {/* FIX: Thay max-w-md -> max-w-sm, p-8 -> p-6, thêm my-auto để flex căn giữa hoàn hảo không sợ mất đầu */}
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl transition-all border border-slate-100 flex flex-col items-center z-10 my-auto">
        {/* Icon Logout hình tròn gradient - Tối ưu mb-6 -> mb-4, h-16 -> h-14 */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f26522] to-[#ff9e67] shadow-lg shadow-[#f26522]/30 animate-bounce-short">
          <LogOut className="h-6 w-6 text-white ml-0.5" />
        </div>

        {/* Tiêu đề & Nội dung - Giảm size chữ và margin một chút cho vừa vặn */}
        <h3 className="text-xl font-bold text-slate-900 mb-1">Logging Out</h3>
        <p className="text-xs font-medium text-slate-500 max-w-xs mb-6">
          Are you sure you want to log out of your account?
        </p>

        {/* Cụm Nút Bấm - Giảm py-3 -> py-2.5 cho cân đối */}
        <div className="w-full space-y-2.5">
          {/* Nút Xác nhận Đăng xuất (Gradient cam) */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 bg-gradient-to-r from-[#f26522] to-[#ff9e67] hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-[#f26522]/20 transition-all transform active:scale-[0.98] text-xs cursor-pointer"
          >
            Yes, Log Out
          </button>

          {/* Nút Hủy (Màu xám nhạt) */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all transform active:scale-[0.98] text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Đường gạch ngang & Dòng ghi chú nhỏ phía dưới - Tối ưu mt-6 -> mt-4, pt-5 -> pt-4 */}
        <div className="w-full border-t border-slate-100 mt-4 pt-4">
          <p className="text-[10px] font-medium text-slate-400">
            You'll need to sign in again to access your account
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
