import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Survey from "@/pages/Survey";
import LogoutModal from "@/components/ui/LogoutModal";
import axiosClient from "@/api/axiosClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showSurveyReminder, setShowSurveyReminder] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // ==========================================
  // THÊM: STATE CHO SEARCH VÀ FILTER Ở ĐÂY
  // ==========================================
  const [searchQuery, setSearchQuery] = useState("");
  const [filterData, setFilterData] = useState({
    school: "",
    course: "",
    tag: "",
  });

  const location = useLocation();
  const isAiAskPage = location.pathname.startsWith("/ask-ai");
  const isWorkspacePage = location.pathname.startsWith("/workspace");
  const isAdminPage = location.pathname.startsWith("/admin");
  const isAuthPage = [
    "/login",
    "/signup",
    "/forgot-password",
    "/verify-account",
    "/change-password",
  ].some((path) => location.pathname.startsWith(path));
  const isAiToolsPage = location.pathname.startsWith("/ai-tools");

  useEffect(() => {
    if (
      isAiAskPage ||
      isWorkspacePage ||
      isAdminPage ||
      isAuthPage ||
      isAiToolsPage
    ) {
      setShowSurvey(false);
      setShowSurveyReminder(false);
      return;
    }

    const checkSurveyState = async () => {
      let surveyCompleted = localStorage.getItem("surveyCompleted") === "true";
      const surveySkipped = localStorage.getItem("surveySkipped") === "true";

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
              localStorage.removeItem("surveySkipped");
            }
          } catch (e) {
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
  }, [isAiAskPage, isWorkspacePage, isAdminPage, isAuthPage, isAiToolsPage]);

  return (
    <div className="h-screen bg-white text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* THÊM: Truyền onSearch và onFilter xuống Navbar */}
      <Navbar
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        onSearch={(query) => setSearchQuery(query)}
        onFilter={(data) => setFilterData(data)}
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

            {/* THÊM: Truyền context xuống cho Homepage (thông qua Outlet) */}
            <Outlet context={{ searchQuery, filterData }} />
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

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}
