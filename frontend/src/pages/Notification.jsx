import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { getMyInvitationStatus, acceptInvitation, rejectInvitation } from "@/api/projectApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserPlus, Shield, Users, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  // Workspace invitation dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteProjectId, setInviteProjectId] = useState(null);

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
      // Smart workspace notification: check invitation status
      if (item.type === "WORKSPACE_INVITED") {
        try {
          const status = await getMyInvitationStatus(item.referenceId);
          if (status.isMember) {
            navigate(`/workspace/${item.referenceId}`);
          } else if (status.invitation?.token && status.invitation?.status === "PENDING") {
            setInviteData(status.invitation);
            setInviteProjectId(item.referenceId);
            setInviteDialogOpen(true);
          } else {
            navigate(`/workspace/${item.referenceId}`);
          }
        } catch (err) {
          console.error("Failed to check invitation status", err);
          navigate(`/workspace/${item.referenceId}`);
        }
      } else {
        navigate(`/workspace/${item.referenceId}`);
      }
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
                  🔔
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

      {/* Workspace Invitation Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#f26522] flex items-center justify-center text-white">
                <UserPlus className="w-5 h-5" />
              </div>
              Workspace Invitation
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              You have been invited to join a workspace.
            </DialogDescription>
          </DialogHeader>

          {inviteData && (
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100/50 flex items-center justify-center text-[#f26522]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace</p>
                  <p className="font-extrabold text-slate-800 text-sm">{inviteData.projectName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-100">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invited By</p>
                  <p className="font-bold text-slate-700 text-sm truncate">{inviteData.inviterName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Role</p>
                  <span className="inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#f26522]/10 text-[#f26522]">
                    <Shield className="w-3.5 h-3.5" />
                    {inviteData.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              disabled={inviteSubmitting}
              onClick={async () => {
                try {
                  setInviteSubmitting(true);
                  await rejectInvitation(inviteData.token);
                  toast.success("Invitation declined.");
                  setInviteDialogOpen(false);
                  setInviteData(null);
                } catch (err) {
                  toast.error(err.response?.data?.message || "Failed to decline invitation.");
                } finally {
                  setInviteSubmitting(false);
                }
              }}
              className="rounded-xl"
            >
              Decline
            </Button>
            <Button
              disabled={inviteSubmitting}
              onClick={async () => {
                try {
                  setInviteSubmitting(true);
                  await acceptInvitation(inviteData.token);
                  toast.success("Invitation accepted! Welcome to the workspace.");
                  setInviteDialogOpen(false);
                  setInviteData(null);
                  navigate(`/workspace/${inviteProjectId}`);
                } catch (err) {
                  toast.error(err.response?.data?.message || "Failed to accept invitation.");
                } finally {
                  setInviteSubmitting(false);
                }
              }}
              className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white"
            >
              {inviteSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Accept & Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

