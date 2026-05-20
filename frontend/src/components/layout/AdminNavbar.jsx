import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, BookOpen, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import LogoutModal from "@/components/ui/LogoutModal";

export default function AdminNavbar({ onMenuClick, onLogoutClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="w-full bg-white border-b border-gray-100 py-2.5 sticky top-0 z-50 shadow-sm/5 backdrop-blur-sm">
      <div className="w-full pr-4 sm:pr-6 flex items-center justify-between gap-2">
        
        {/* Nhóm Logo và nút Menu */}
        <div className="flex items-center shrink-0">
          <div className="w-[72px] flex items-center justify-center shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:bg-slate-100 h-10 w-10 rounded-full cursor-pointer"
              onClick={onMenuClick}
            >
              <Menu className="size-6" />
            </Button>
          </div>

          <Link to="/admin/dashboard" className="flex items-center gap-2 font-bold text-[20px] text-slate-800 tracking-tight ml-2">
            <BookOpen className="h-7 w-7 text-[#f26522]" />
            <span className="hidden sm:inline-block">MinDoCu Admin</span>
          </Link>
        </div>

        {/* Khoảng trống đẩy Dropdown sang góc phải */}
        <div className="flex-1"></div>

        {/* Menu Dropdown góc phải */}
        <div className="relative flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-sm font-bold text-slate-800 leading-tight">Administrator</span>
            <span className="text-[10px] text-[#f26522] font-semibold">System Manager</span>
          </div>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="cursor-pointer h-10 w-10 shrink-0 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white hover:opacity-90 transition-all focus:outline-none"
          >
            AD
          </button>

          {isDropdownOpen && (
            <>
              {/* Lớp overlay trong suốt để bấm ra ngoài là đóng menu */}
              <div className="fixed inset-0 z-30 bg-transparent cursor-default" onClick={() => setIsDropdownOpen(false)} />

              <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40">
                <Link
                  to="/admin/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors block rounded-t-xl"
                >
                  <Settings size={15} className="text-slate-400" />
                  Settings
                </Link>

                <div className="border-t border-slate-100 my-1.5"></div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogoutClick();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors rounded-b-xl cursor-pointer"
                >
                  <LogOut size={15} className="text-red-500" />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}