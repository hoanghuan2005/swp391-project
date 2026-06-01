import React, { useEffect, useState } from "react";
import axiosClient from "@/api/axiosClient";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const res = await axiosClient.get("/api/notifications?page=0&size=50");

      setNotifications(res.data.content);
    } catch {
      // mock
      setNotifications([
        {
          id: 1,
          message: "Nguyễn Văn A liked your document",
          isRead: false,
          createdAt: new Date(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>

        <button
          className="
            px-4 py-2
            rounded-lg
            bg-[#f26522]
            text-white
            text-sm
          "
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`
              p-4 border-b
              hover:bg-slate-50
              cursor-pointer
              ${!item.isRead ? "bg-orange-50" : ""}
            `}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                🔔
              </div>

              <div>
                <p className="text-sm text-slate-700">{item.message}</p>

                <p className="text-xs text-slate-400 mt-1">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
