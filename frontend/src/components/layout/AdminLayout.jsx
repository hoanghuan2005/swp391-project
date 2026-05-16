import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import Navbar from "./Navbar"; 

export default function AdminLayout() {
  // Quản lý trạng thái đóng/mở sidebar ngay tại Layout (Chuẩn Vercel Practices)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Tái sử dụng Navbar, truyền hàm bật/tắt vào prop onMenuClick */}
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Render Admin Sidebar thay vì Sidebar thường */}
        <AdminSidebar isOpen={isSidebarOpen} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-[1700px] w-full mx-auto relative rounded-3xl min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}