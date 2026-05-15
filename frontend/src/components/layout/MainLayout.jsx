import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Survey from "@/pages/Survey";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [showSurvey, setShowSurvey] = useState(false);

  useEffect(() => {
    // giả sử lấy từ localStorage hoặc API user profile
    const onboardingCompleted =
      localStorage.getItem("onboardingCompleted") === "true";

    if (!onboardingCompleted) {
      setShowSurvey(true);
    }
  }, []);

  return (
    <div className="h-screen bg-white text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Navbar */}
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-[1700px] w-full mx-auto relative rounded-3xl min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Survey Popup */}
      {showSurvey && (
        <Survey onClose={() => setShowSurvey(false)} />
      )}
    </div>
  );
}