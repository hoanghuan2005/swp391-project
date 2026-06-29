import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";
import LogoutModal from "@/components/ui/LogoutModal";
import axiosClient from "@/api/axiosClient";

function getTokenRole(token) {
  try {
    return token ? jwtDecode(token)?.role || "" : "";
  } catch (error) {
    console.error("Invalid admin token:", error);
    return "";
  }
}

export default function AdminLayout() {
  // Quản lý trạng thái đóng/mở sidebar ngay tại Layout (Chuẩn Vercel Practices)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    fullName: "",
    email: "",
    avatarUrl: "",
    role: getTokenRole(localStorage.getItem("token")),
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = getTokenRole(token);

    if (!token) return;

    let isMounted = true;

    const fetchCurrentUser = async () => {
      try {
        const response = await axiosClient.get("/api/profile");
        const profile = response.data || {};

        if (isMounted) {
          setCurrentUser({
            fullName: profile.fullName || "",
            email: profile.email || "",
            avatarUrl: profile.avatarUrl || "",
            role,
          });
        }
      } catch (error) {
        console.error("Failed to load admin profile:", error);
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Tái sử dụng Navbar, truyền hàm bật/tắt vào prop onMenuClick */}
      <AdminNavbar 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        currentUser={currentUser}
      />

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
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}
