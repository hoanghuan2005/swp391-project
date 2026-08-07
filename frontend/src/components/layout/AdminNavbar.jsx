import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, BookOpen, LogOut, Settings, Bell, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import NotificationDetailModal from "@/components/modals/NotificationDetailModal";

function getEmailPrefix(email) {
  return email?.includes("@") ? email.split("@")[0] : "";
}

function getInitials(fullName, email) {
  const source = fullName || getEmailPrefix(email) || "Admin";
  const words = source.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return (words[0]?.[0] || "A").toUpperCase();
}

export default function AdminNavbar({
  onMenuClick,
  onLogoutClick,
  currentUser = {},
}) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const notificationButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);

  const displayName =
    currentUser.fullName || getEmailPrefix(currentUser.email) || "Admin";
  const secondaryLabel = currentUser.email || currentUser.role || "ADMIN";
  const initials = getInitials(currentUser.fullName, currentUser.email);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/notifications?page=0&size=50");
      const list = res.data?.content || [];
      
      const adminOnlyList = list.filter((n) => {
        const title = (n.title || "").toLowerCase();
        const msg = (n.message || "").toLowerCase();
        const type = (n.type || "").toUpperCase();
        const refType = (n.referenceType || "").toUpperCase();

        const isReport =
          type.includes("REPORT") ||
          refType === "REPORT" ||
          title.includes("report") ||
          msg.includes("report") ||
          title.includes("báo cáo") ||
          msg.includes("báo cáo");

        const isVersion =
          type.includes("VERSION") ||
          refType === "VERSION" ||
          title.includes("version") ||
          msg.includes("version") ||
          title.includes("phiên bản") ||
          msg.includes("phiên bản");

        return isReport || isVersion;
      });

      setNotifications(adminOnlyList);
      setUnreadCount(adminOnlyList.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch admin notifications", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.put("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const handleNotificationClick = async (item) => {
    setIsNotificationOpen(false);
    try {
      if (!item.isRead) {
        await axiosClient.put(`/api/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }

    const title = (item.title || "").toLowerCase();
    const type = (item.type || "").toUpperCase();
    const refType = (item.referenceType || "").toUpperCase();

    if (type.includes("REPORT") || refType === "REPORT" || title.includes("report")) {
      navigate("/admin/reports");
    } else if (type.includes("VERSION") || refType === "VERSION" || title.includes("version")) {
      navigate("/admin/documents");
    } else {
      setSelectedNotification(item);
      setDetailModalOpen(true);
    }
  };

  return (
    <div className="w-full bg-white border-b border-gray-100 py-2.5 sticky top-0 z-50 shadow-sm/5 backdrop-blur-sm">
      <div className="w-full pr-4 sm:pr-6 flex items-center justify-between gap-2">
        
        {/* Nhóm Logo và nút Menu */}
        <div className="flex items-center shrink-0">
          <div className="w-[72px] flex items-center justify-center shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:bg-slate-100 h-10 w-10 rounded-full cursor-pointer"
              onClick={onMenuClick}
            >
              <Menu className="size-6" />
            </Button>
          </div>

          <Link to="/admin/dashboard" className="flex items-center gap-2 font-bold text-[20px] text-slate-800 tracking-tight ml-2">
            <BookOpen className="h-7 w-7 text-[#f26522]" />
            <span className="hidden sm:inline-block">MinDoCu Admin</span>
          </Link>
        </div>

        {/* Khoảng trống */}
        <div className="flex-1"></div>

        {/* Action icons & User profile */}
        <div className="relative flex items-center gap-3 shrink-0">

          {/* Admin Notification Icon */}
          <div className="relative">
            <button
              ref={notificationButtonRef}
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative h-10 w-10 rounded-full flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Admin Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <>
                <div
                  className="fixed inset-0 z-30 bg-transparent cursor-default"
                  onClick={() => setIsNotificationOpen(false)}
                />
                <div
                  ref={notificationPanelRef}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-40"
                >
                  <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#f26522]" />
                      <span className="font-bold text-xs text-slate-800">
                        Admin Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-[#f26522]">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-[#f26522] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                            !item.isRead ? "bg-orange-50/20" : ""
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#f26522] shrink-0 mt-0.5">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-800 truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                              {item.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!item.isRead && (
                            <div className="w-2 h-2 rounded-full bg-[#f26522] mt-1.5 shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    to="/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="block p-3 text-center text-xs font-bold text-[#f26522] hover:bg-slate-50 border-t border-slate-100 bg-slate-50/30"
                  >
                    View all notifications
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="max-w-[180px] truncate text-sm font-bold text-slate-800 leading-tight">
              {displayName}
            </span>
            <span className="max-w-[220px] truncate text-[10px] text-[#f26522] font-semibold">
              {secondaryLabel}
            </span>
          </div>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="cursor-pointer h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f26522]/40"
            aria-label="Open admin account menu"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={`${displayName} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </button>

          {isDropdownOpen && (
            <>
              {/* Lớp overlay trong suốt để bấm ra ngoài là đóng menu */}
              <div className="fixed inset-0 z-30 bg-transparent cursor-default" onClick={() => setIsDropdownOpen(false)} />

              <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40">
                <Link
                  to="/admin/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors block rounded-t-xl"
                >
                  <Settings size={15} className="text-slate-400" />
                  Settings
                </Link>

                <div className="border-t border-slate-100 my-1.5"></div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogoutClick();
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

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        notification={selectedNotification}
      />
    </div>
  );
}
