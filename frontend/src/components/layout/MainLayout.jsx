import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Survey from "@/pages/Survey";
import LogoutModal from "@/components/ui/LogoutModal"; // 1. Import LogoutModal vào đây
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showSurveyReminder, setShowSurveyReminder] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // 2. Quản lý state mở modal ở đây

  useEffect(() => {
    const surveyCompleted = localStorage.getItem("surveyCompleted") === "true";
    const surveySkipped = localStorage.getItem("surveySkipped") === "true";

    if (!surveyCompleted && !surveySkipped) {
      setShowSurvey(true);
    }

    if (!surveyCompleted && surveySkipped) {
      setShowSurveyReminder(true);
    }
  }, []);

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