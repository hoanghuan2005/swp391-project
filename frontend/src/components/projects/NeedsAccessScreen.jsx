import React, { useState, useEffect } from "react";
import { Lock, ArrowLeft, Send, CheckCircle2, Loader2, ShieldAlert, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { requestToJoinProject, getMyInvitationStatus } from "@/api/projectApi";
import { toast } from "sonner";

export default function NeedsAccessScreen({ projectId, projectName, ownerName, visibility = "PRIVATE", initialIsPending = false }) {
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);
  const [isPending, setIsPending] = useState(initialIsPending);

  const isPrivate = visibility === "PRIVATE";

  useEffect(() => {
    if (projectId && !initialIsPending && !isPrivate) {
      getMyInvitationStatus(projectId)
        .then((res) => {
          if (res?.invitation?.status === "PENDING") {
            setIsPending(true);
          }
        })
        .catch(() => {});
    }
  }, [projectId, initialIsPending, isPrivate]);

  const handleRequestAccess = async () => {
    if (!projectId || requesting || isPending || isPrivate) return;

    setRequesting(true);
    try {
      await requestToJoinProject(projectId);
      setIsPending(true);
      toast.success("Access request sent to workspace owner");
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "";
      if (msg.includes("already pending") || msg.includes("already member")) {
        setIsPending(true);
        toast.info("Your access request is pending approval by the owner");
      } else {
        console.error("Failed to request access:", error);
        toast.error(msg || "Failed to send access request");
      }
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4 bg-[#fafafa]">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 md:p-10 text-center relative overflow-hidden">
        {/* Top Decorative Banner Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 via-[#f26522] to-amber-500" />

        {/* Lock Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center shadow-inner">
          <Lock className="w-10 h-10 text-[#f26522]" />
        </div>

        {/* Header Title & Description */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          You need access
        </h1>
        
        <p className="text-sm md:text-base text-slate-500 mt-3 leading-relaxed">
          {isPrivate ? (
            <>
              Workspace <span className="font-bold text-slate-700">"{projectName || "Workspace"}"</span> is Private. Access can only be granted directly by the workspace owner via invitation.
            </>
          ) : (
            <>
              Workspace <span className="font-bold text-slate-700">"{projectName || "Workspace"}"</span> requires permission. Request access from the owner to view or edit.
            </>
          )}
        </p>

        {/* Owner Card Badge */}
        {ownerName && (
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <span>Workspace Owner: <strong className="text-slate-800">{ownerName}</strong></span>
          </div>
        )}

        {/* Notice for PRIVATE workspaces */}
        {isPrivate && (
          <div className="mt-6 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Private workspaces are invite-only. Contact the owner to get invited.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/workspaces");
              }
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {!isPrivate && (
            <Button
              disabled={requesting || isPending}
              onClick={handleRequestAccess}
              className={`w-full sm:w-auto px-7 py-2.5 rounded-2xl font-bold transition-all shadow-md cursor-pointer border-none ${
                isPending
                  ? "bg-amber-500 text-white cursor-default opacity-90 hover:bg-amber-500"
                  : "bg-[#f26522] hover:bg-[#d95516] text-white shadow-orange-500/20"
              }`}
            >
              {requesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : isPending ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-white" />
                  Request Pending
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Request Access
                </>
              )}
            </Button>
          )}
        </div>

        {/* Helper Note for LINK_SHARED */}
        {!isPrivate && isPending && (
          <p className="text-xs text-amber-600 font-medium mt-4 bg-amber-50 py-2 px-3 rounded-xl border border-amber-200/60 inline-block">
            ✓ Your join request has been submitted. The owner will be notified to grant approval.
          </p>
        )}
      </div>
    </div>
  );
}
