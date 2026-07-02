import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, BookOpen, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";

function getEmailPrefix(email) {
  return email?.includes("@") ? email.split("@")[0] : "";
}

function getInitials(fullName, email) {
  const source = fullName || getEmailPrefix(email) || "Admin";
  const words = source.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return (words[0]?.[0] || "A").toUpperCase();
}

export default function AdminNavbar({
  onMenuClick,
  onLogoutClick,
  currentUser = {},
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const displayName =
    currentUser.fullName || getEmailPrefix(currentUser.email) || "Admin";
  const secondaryLabel = currentUser.email || currentUser.role || "ADMIN";
  const initials = getInitials(currentUser.fullName, currentUser.email);

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
            <span className="max-w-[180px] truncate text-sm font-bold text-slate-800 leading-tight">
              {displayName}
            </span>
            <span className="max-w-[220px] truncate text-[10px] text-[#f26522] font-semibold">
              {secondaryLabel}
            </span>
          </div>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="cursor-pointer h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f26522]/40"
            aria-label="Open admin account menu"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={`${displayName} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
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
