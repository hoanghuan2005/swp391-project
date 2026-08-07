import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  getProjectDetail,
  getSharedProject,
  removeDocumentFromProject,
} from "@/api/projectApi";
import WorkspaceGroupChat from "@/components/chat/WorkspaceGroupChat";
import axiosClient, { backendBaseUrl } from "@/api/axiosClient";
import UnifiedAIChat from "@/components/ai-chat/UnifiedAIChat";
import NeedsAccessScreen from "@/components/projects/NeedsAccessScreen";
import useAiUsage from "@/hooks/useAiUsage";
import AiUsageBadge from "@/components/ai-usage/AiUsageBadge";

export default function ProjectWorkspacePage() {
  const { projectId, token } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDeniedInfo, setAccessDeniedInfo] = useState(null);
  const isSharedView = Boolean(token);

  // Group Chat States
  const [chatMode] = useState("ai"); // "ai" or "group"
  const [groupMessages, setGroupMessages] = useState([]);
  const [isGroupChatConnected, setIsGroupChatConnected] = useState(false);
  const [groupSocket, setGroupSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Custom Confirmation Dialog State (for document removal from workspace)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, name }
  const [isConfirming, setIsConfirming] = useState(false);

  const {
    planName,
    remainingUsage,
    isUnlimited,
    tierLimits,
    loading: aiUsageLoading,
  } = useAiUsage();

  const fetchProject = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setAccessDeniedInfo(null);
      let data = token
        ? await getSharedProject(token)
        : await getProjectDetail(projectId);
      setProject(data);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      if (error.response?.status === 403 && error.response?.data?.errorCode === "NEEDS_ACCESS") {
        setAccessDeniedInfo(error.response.data);
      } else {
        toast.error("Failed to load project workspace");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProject();
  }, [fetchProject]);

  // Prevent parent container from scrolling while workspace is mounted
  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (mainElement) {
      const originalOverflow = mainElement.style.overflow;
      mainElement.style.overflow = "hidden";
      return () => {
        mainElement.style.overflow = originalOverflow;
      };
    }
  }, []);

  // Background polling every 15s to sync workspace documents
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchProject(true);
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchProject]);

  // Fetch current user details for the group chat bubbles
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get("/api/profile");
        setCurrentUser(res.data);
      } catch (e) {
        console.error("Failed to fetch user profile", e);
      }
    };
    fetchProfile();
  }, []);

  // Fetch group chat history
  useEffect(() => {
    if (chatMode !== "group" || !projectId) return;

    const fetchGroupChatHistory = async () => {
      try {
        const res = await axiosClient.get(`/api/projects/${projectId}/messages`);
        if (Array.isArray(res.data)) {
          setGroupMessages(res.data);
        }
      } catch (e) {
        console.error("Failed to load workspace group chat history", e);
      }
    };

    fetchGroupChatHistory();
  }, [chatMode, projectId]);

  // Connect to Group Chat WebSocket
  useEffect(() => {
    if (chatMode !== "group" || !projectId) return;
    if (localStorage.getItem("isLoggedIn") !== "true") return;

    const wsBaseUrl = backendBaseUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");

    const cleanWsBaseUrl = wsBaseUrl.endsWith("/") ? wsBaseUrl.slice(0, -1) : wsBaseUrl;
    const tokenStr = localStorage.getItem("token");
    const queryParam = tokenStr ? `?token=${encodeURIComponent(tokenStr)}` : "";
    const wsUrl = `${cleanWsBaseUrl}/project-chat-ws/${projectId}${queryParam}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsGroupChatConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event === "NEW_COMMENT") {
          setGroupMessages((prev) => [...prev, parsed.data]);
        } else if (parsed.event === "REACTION_UPDATE") {
          setGroupMessages((prev) =>
            prev.map((msg) => (msg.id === parsed.data.id ? parsed.data : msg))
          );
        }
      } catch (err) {
        console.error("Failed to parse message", err);
      }
    };

    ws.onclose = () => {
      setIsGroupChatConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroupSocket(ws);

    return () => {
      ws.close();
      setIsGroupChatConnected(false);
    };
  }, [chatMode, projectId]);

  const handleSendGroupMessage = (content, parentId = null) => {
    if (!content.trim() || !groupSocket || groupSocket.readyState !== WebSocket.OPEN) return;

    const payload = JSON.stringify({
      type: "COMMENT",
      content: content.trim(),
      parentId: parentId,
    });

    groupSocket.send(payload);
  };

  const handleToggleGroupReaction = (messageId, reactionType) => {
    if (!groupSocket || groupSocket.readyState !== WebSocket.OPEN) return;

    const payload = JSON.stringify({
      type: "REACTION",
      messageId: messageId,
      reactionType: reactionType,
    });

    groupSocket.send(payload);
  };

  const handleDeleteDocument = (documentId) => {
    if (isSharedView) return;
    const doc = project?.documents?.find((d) => d.id === documentId);
    setConfirmTarget({
      id: documentId,
      name: doc?.title || doc?.name || "this document",
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    setIsConfirming(true);
    try {
      await axiosClient.delete(
        `/api/projects/${projectId}/documents/${confirmTarget.id}`
      );
      toast.success("Document removed from workspace");
      await fetchProject();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove document");
    } finally {
      setIsConfirming(false);
      setConfirmDialogOpen(false);
      setConfirmTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#f26522]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-[#f26522]">{error || "Workspace not found"}</p>
        <Button onClick={() => navigate("/workspace")}>
          Back to Workspaces
        </Button>
      </div>
    );
  }

  if (accessDeniedInfo) {
    return (
      <NeedsAccessScreen
        projectId={accessDeniedInfo.projectId || projectId}
        projectName={accessDeniedInfo.projectName}
        ownerName={accessDeniedInfo.ownerName}
        visibility={accessDeniedInfo.visibility}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {activeTab === "documents" ? (
        <UnifiedAIChat
          mode="WORKSPACE"
          workspaceId={projectId}
          shareToken={token}
          documents={project.documents || []}
          maxSelectedDocs={tierLimits?.maxSelectedDocs || 2}
          onDeleteDocument={isSharedView ? null : handleDeleteDocument}
          rightElement={
            <AiUsageBadge
              planName={planName}
              remainingUsage={remainingUsage}
              isUnlimited={isUnlimited}
              loading={aiUsageLoading}
            />
          }
        />
      ) : (
        <WorkspaceGroupChat
          projectId={project.id}
          title={project.name}
          subtitle="Workspace Discussion Room"
          messages={groupMessages}
          isChatConnected={isGroupChatConnected}
          currentUser={currentUser}
          onSendMessage={handleSendGroupMessage}
          onToggleReaction={handleToggleGroupReaction}
        />
      )}

      {/* DOCUMENT REMOVAL CONFIRMATION DIALOG */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl bg-white border border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                <Trash2 className="w-5 h-5" />
              </span>
              Confirm Removal
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-2">
              Are you sure you want to remove document "{confirmTarget?.name}" from this workspace? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              disabled={isConfirming}
              onClick={() => setConfirmDialogOpen(false)}
              className="rounded-xl border-slate-200 font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={isConfirming}
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer border-none"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
