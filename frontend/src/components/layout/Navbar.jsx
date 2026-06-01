import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Mic,
  Menu,
  BookOpen,
  LogOut,
  User,
  Settings,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
// FIX: Xóa bỏ dòng import LogoutModal không cần thiết ở đây nữa

export default function Navbar({ onMenuClick, onLogoutClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [userInitial, setUserInitial] = useState("H");

  useEffect(() => {
    fetchUnreadCount();
    // load user info from token
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        const name = decoded?.name || decoded?.sub || null;
        if (name) {
          setUserName(name);
          setUserInitial(name.charAt(0).toUpperCase());
        }
      }
    } catch (e) {
      console.error("Token decode error", e);
    }
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await axiosClient.get("/api/notifications/unread-count");

      setUnreadCount(res.data.count);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isNotificationOpen) {
      loadNotifications();
    }
  }, [isNotificationOpen]);

  {
    /* Hàm loadNotifications load danh sách thông báo*/
  }
  const loadNotifications = async () => {
    try {
      const res = await axiosClient.get("/api/notifications?page=0&size=5");

      setNotifications(res.data.content);
    } catch (error) {
      console.error(error);
    }
  };

  {
    /* Hàm markAsRead đánh dấu thông báo đã đọc */
  }
  const markAsRead = async (id) => {
    try {
      await axiosClient.put(`/api/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="w-full bg-white border-b border-gray-100 py-2.5 sticky top-0 z-50 shadow-sm/5 backdrop-blur-sm">
      <div className="w-full pr-4 sm:pr-6 flex items-center justify-between gap-2">
        {/* Logo & Menu Button */}
        <div className="flex items-center shrink-0">
          <div className="w-[72px] flex items-center justify-center shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:bg-slate-100 h-10 w-10 rounded-full"
              onClick={onMenuClick}
            >
              <Menu className="cursor-pointer size-6" />
            </Button>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-bold text-[20px] text-slate-800 tracking-tight ml-2"
          >
            <BookOpen className="h-7 w-7 text-[#f26522]" />
            <span className="hidden sm:inline-block">MinDoCu</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl flex items-center gap-4 px-2">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <Input
              className="pl-12 h-11 bg-slate-50 border-transparent hover:border-slate-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/20 rounded-full shadow-sm text-sm transition-all"
              placeholder="Search..."
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 h-11 w-11 shrink-0 shadow-sm"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Bell Icons */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="rounded-full hover:bg-slate-100 text-slate-700 h-10 w-10"
            >
              <Bell className="!h-5 !w-5" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            {isNotificationOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsNotificationOpen(false)}
                />

                <div className="absolute right-0 top-12 w-[360px] bg-white rounded-xl shadow-xl border border-slate-100 z-40">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-slate-800">
                      Notifications
                    </h3>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => markAsRead(item.id)}
                          className={`
      px-4 py-3 border-b cursor-pointer
      transition-all
      hover:bg-slate-50
      ${!item.isRead ? "bg-orange-50" : ""}
    `}
                        >
                          <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                              <Bell size={16} className="text-[#f26522]" />
                            </div>

                            <div className="flex-1">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {item.message}
                              </p>

                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>

                            {!item.isRead && (
                              <div className="w-2 h-2 rounded-full bg-[#f26522] mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    to="/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="block text-center py-3 text-sm font-medium text-[#f26522] hover:bg-slate-50"
                  >
                    View all notifications
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-sm font-bold text-slate-800 leading-tight">
                {userName || "Guest"}
              </span>
              <span className="text-[10px] text-[#f26522] font-semibold">
                Free Plan
              </span>
            </div>

            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="cursor-pointer h-10 w-10 shrink-0 rounded-full bg-[#f26522] text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white hover:opacity-90 transition-all focus:outline-none"
            >
              {userInitial}
            </button>

            {isDropdownOpen && (
              <>
                {/* Overlay ẩn để bấm ra ngoài dropdown thì tự đóng */}
                <div
                  className="fixed inset-0 z-30 bg-transparent cursor-default"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Menu con */}
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40">
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors block rounded-t-xl"
                  >
                    <User size={15} className="text-slate-400" />
                    My Profile
                  </Link>

                  <button className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                    <Settings size={15} className="text-slate-400" />
                    Account Settings
                  </button>

                  <Link
                    to="/notifications"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors block rounded-t-xl"
                  >
                    <Bell size={15} className="text-slate-400" />
                    Notifications
                  </Link>

                  <div className="border-t border-slate-100 my-1.5"></div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogoutClick(); // Kích hoạt hàm mở modal truyền từ MainLayout xuống
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors rounded-b-xl cursor-pointer"
                  >
                    <LogOut size={15} className="text-red-500" />
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FIX: Đã xóa hoàn toàn component LogoutModal cũ bị thừa ở đây */}
    </div>
  );
}
