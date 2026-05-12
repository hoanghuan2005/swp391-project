import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8 py-6 h-full relative max-w-[1700px] mx-auto">
          {/* Sidebar Area */}
          <div
            className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
              isSidebarOpen ? "w-[260px]" : "w-[68px]"
            }`}
          >
            <div className="sticky top-[88px]">
              <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
