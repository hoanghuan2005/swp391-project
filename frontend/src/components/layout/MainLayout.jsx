import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Survey from "@/pages/Survey";
import LogoutModal from "@/components/ui/LogoutModal"; // 1. Import LogoutModal vào đây
import axiosClient from "@/api/axiosClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showSurveyReminder, setShowSurveyReminder] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // 2. Quản lý state mở modal ở đây

  const location = useLocation();
  const isAiAskPage = location.pathname.startsWith("/ask-ai");

  useEffect(() => {
    if (isAiAskPage) return; // Không hiển thị survey nếu đang ở trang Ask AI

    const checkSurveyState = async () => {
      let surveyCompleted = localStorage.getItem("surveyCompleted") === "true";
      const surveySkipped = localStorage.getItem("surveySkipped") === "true";

      // If not completed locally, try to infer from server-side profile (when logged in)
      if (!surveyCompleted) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const res = await axiosClient.get("/api/profile");
            const pdata = res.data || {};
            const serverCompleted = !!(
              pdata.startYear ||
              (pdata.languages && pdata.languages.length > 0)
            );
            if (serverCompleted) {
              surveyCompleted = true;
              localStorage.setItem("surveyCompleted", "true");
              // remove any skipped flag if server indicates completion
              localStorage.removeItem("surveySkipped");
            }
          } catch (e) {
            // silent fail — keep local flags
            console.warn(
              "Could not fetch profile to determine survey state:",
              e,
            );
          }
        }
      }

      if (!surveyCompleted && !surveySkipped) {
        setShowSurvey(true);
      }

      if (!surveyCompleted && surveySkipped) {
        setShowSurveyReminder(true);
      }
    };

    checkSurveyState();
  }, [isAiAskPage]);

  return (
    <div className="h-screen bg-white text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Navbar - 3. Truyền prop onLogoutClick xuống cho Navbar */}
      <Navbar
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
      />

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-[1700px] w-full mx-auto relative rounded-3xl min-h-full">
            {showSurveyReminder && (
              <div className="flex justify-end mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSurvey(true)}
                  className="rounded-full border-slate-200 bg-white/90 text-slate-700 hover:border-[#f26522] hover:text-[#f26522]"
                >
                  <Badge className="mr-2 rounded-full bg-[#f26522]/10 text-[#f26522]">
                    Survey
                  </Badge>
                  Finish your learning survey
                </Button>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>

      {/* Survey Popup */}
      {showSurvey && (
        <Survey
          forceOpen={showSurvey}
          onClose={({ completed }) => {
            setShowSurvey(false);
            if (completed) {
              setShowSurveyReminder(false);
            } else {
              setShowSurveyReminder(true);
            }
          }}
        />
      )}

      {/* 4. Đặt LogoutModal ở đây - Tầng cao nhất của toàn bộ Layout, z-50 là đủ bao trọn màn hình */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}
