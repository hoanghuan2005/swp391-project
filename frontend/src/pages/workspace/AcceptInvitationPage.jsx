import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyInvitationToken, acceptInvitation, rejectInvitation } from "@/api/projectApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, UserPlus, Check, X, Shield, Lock, Users, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import axiosClient from "@/api/axiosClient";

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      axiosClient.get("/api/profile")
        .then((res) => setCurrentUserEmail(res.data?.email || null))
        .catch((e) => console.error("Failed to fetch profile email:", e));
    }
  }, [isLoggedIn]);

  const isEmailMismatch = isLoggedIn && invitation && currentUserEmail && invitation.email.toLowerCase() !== currentUserEmail.toLowerCase();

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setLoading(false);
      return;
    }

    const loadInvitation = async () => {
      try {
        const data = await verifyInvitationToken(token);
        setInvitation(data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Invalid or expired invitation link.");
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!isLoggedIn) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    try {
      setSubmitting(true);
      const project = await acceptInvitation(token);
      toast.success("Invitation accepted! Welcome to the workspace.");
      navigate(`/workspace/${project.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to accept invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      await rejectInvitation(token);
      toast.success("Invitation declined.");
      navigate("/home");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to decline invitation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#f66810]" />
        <p className="text-slate-500 font-medium text-sm animate-pulse">
          Verifying your invitation...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-3xl border border-red-100 bg-white shadow-xl overflow-hidden">
          <div className="p-8 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <X className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              Invalid Invitation
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              {error}
            </p>
            <Button
              onClick={() => navigate("/home")}
              className="mt-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 w-full h-11 font-semibold transition-all border-0"
            >
              Go to Homepage
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-xl w-full rounded-[32px] border border-orange-100 bg-gradient-to-br from-orange-50/20 to-white shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2" />
        
        <CardContent className="p-10 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-[24px] bg-[#f66810] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 animate-bounce">
            <UserPlus className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-850 tracking-tight">
              Workspace Invitation
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
              Collaborate and study together with colleagues on Keeper App.
            </p>
          </div>

          <div className="w-full bg-orange-50/40 border border-orange-100/70 rounded-2xl p-6 text-left space-y-4 my-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100/50 flex items-center justify-center text-[#f66810]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Workspace
                </p>
                <p className="font-extrabold text-slate-800 text-lg">
                  {invitation?.projectName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Invited By
                </p>
                <p className="font-bold text-slate-700 text-sm truncate">
                  {invitation?.inviterName}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Your Role
                </p>
                <span className="inline-flex items-center gap-1 mt-1 px-3 py-1 rounded-full text-xs font-extrabold bg-[#f66810]/10 text-[#f66810]">
                  <Shield className="w-3.5 h-3.5" />
                  {invitation?.role}
                </span>
              </div>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2.5 justify-center text-sm font-medium text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <Lock className="w-4 h-4 shrink-0" />
                <span>You must log in to accept this invitation.</span>
              </div>

              <Button
                onClick={() => {
                  const currentUrl = window.location.pathname + window.location.search;
                  navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
                }}
                className="w-full h-12 rounded-xl bg-[#f66810] hover:bg-[#de5b0b] text-white font-bold transition-all shadow-md shadow-orange-500/10 cursor-pointer border-0"
              >
                Log In or Sign Up
              </Button>
            </div>
          ) : isEmailMismatch ? (
            <div className="w-full space-y-4">
              <div className="flex items-start gap-2.5 text-left text-sm font-medium text-red-650 bg-red-50 border border-red-100 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-650" />
                <div className="space-y-1">
                  <p className="font-bold text-red-800">Email Mismatch</p>
                  <p className="text-xs text-red-700 leading-normal">
                    You are logged in as <span className="font-semibold">{currentUserEmail}</span>, but this invitation was sent to <span className="font-semibold">{invitation?.email}</span>.
                  </p>
                  <p className="text-xs text-red-700 leading-normal font-medium mt-1">
                    Please switch to the correct account to join this workspace.
                  </p>
                </div>
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/home")}
                  className="flex-1 h-12 rounded-xl border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 shadow-sm transition-all"
                >
                  Go to Homepage
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("userId");
                    const currentUrl = window.location.pathname + window.location.search;
                    navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
                  }}
                  className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-md shadow-red-500/15 flex items-center justify-center cursor-pointer border-0"
                >
                  Switch Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col sm:flex-row gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={handleReject}
                className="flex-1 h-12 rounded-xl border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 shadow-sm transition-all"
              >
                Decline
              </Button>

              <Button
                type="button"
                disabled={submitting}
                onClick={handleAccept}
                className="flex-1 h-12 rounded-xl bg-[#f66810] hover:bg-[#de5b0b] text-white font-bold transition-all shadow-md shadow-orange-500/15 flex items-center justify-center cursor-pointer border-0"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Check className="w-5 h-5 mr-2" />
                )}
                Accept & Join
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
