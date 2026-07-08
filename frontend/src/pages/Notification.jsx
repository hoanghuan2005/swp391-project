import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import axiosClient from "@/api/axiosClient";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const res = await axiosClient.get("/api/notifications?page=0&size=50");
      setNotifications(res.data.content);
    } catch {
      // mock fallback if API fails
      setNotifications([
        {
          id: "mock-1",
          message: "Nguyễn Văn A liked your document",
          isRead: false,
          createdAt: new Date(),
          referenceType: "USER",
          referenceId: "mock-user-id"
        },
      ]);
    }
  };

  const handleNotificationClick = async (item) => {
    // If it's a mock notification, just navigate
    if (String(item.id).startsWith("mock-")) {
      if (item.referenceType === "USER" && item.referenceId) {
        navigate(`/users/${item.referenceId}`);
      } else if (item.referenceType === "DOCUMENT" && item.referenceId) {
        navigate(`/documents/${item.referenceId}`);
      } else if (item.referenceType === "WORKSPACE" && item.referenceId) {
        navigate(`/workspace/${item.referenceId}`);
      }
      return;
    }

    try {
      if (!item.isRead) {
        await axiosClient.put(`/api/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }

    if (item.referenceType === "DOCUMENT" && item.referenceId) {
      navigate(`/documents/${item.referenceId}`);
    } else if (item.referenceType === "USER" && item.referenceId) {
      navigate(`/users/${item.referenceId}`);
    } else if (item.referenceType === "WORKSPACE" && item.referenceId) {
      navigate(`/workspace/${item.referenceId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosClient.put("/api/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Thông báo</h1>

        <button
          onClick={handleMarkAllAsRead}
          className="
            px-4 py-2
            rounded-xl
            bg-orange-500
            hover:bg-orange-600
            transition-colors
            text-white
            text-sm
            font-medium
            shadow-sm
          "
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Không có thông báo nào
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`
                p-4 border-b border-slate-100 last:border-b-0
                hover:bg-slate-50/80
                cursor-pointer
                transition-colors
                ${!item.isRead ? "bg-orange-50/40" : ""}
              `}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
                  <Bell className="w-5 h-5 text-[#f26522]" />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.title || "Thông báo"}
                    </p>
                    {!item.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block"></span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{item.message}</p>

                  <p className="text-xs text-slate-400 mt-1.5">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

