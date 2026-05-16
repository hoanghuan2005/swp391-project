import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mic, Menu, BookOpen, LogOut, User, Settings } from "lucide-react";
import { Link } from "react-router-dom";
// FIX: Xóa bỏ dòng import LogoutModal không cần thiết ở đây nữa

export default function Navbar({ onMenuClick, onLogoutClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="w-full bg-white border-b border-gray-100 py-2.5 sticky top-0 z-50 shadow-sm/5 backdrop-blur-sm">
      <div className="w-full pr-4 sm:pr-6 flex items-center justify-between gap-2">

        {/* Logo & Menu Button */}
        <div className="flex items-center shrink-0">
          <div className="w-[72px] flex items-center justify-center shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:bg-slate-100 h-10 w-10 rounded-full"
              onClick={onMenuClick}
            >
              <Menu className="cursor-pointer size-6" />
            </Button>
          </div>

          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-[20px] text-slate-800 tracking-tight ml-2">
            <BookOpen className="h-7 w-7 text-[#f26522]" />
            <span className="hidden sm:inline-block">MinDoCu</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl flex items-center gap-4 px-2">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <Input
              className="pl-12 h-11 bg-slate-50 border-transparent hover:border-slate-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/20 rounded-full shadow-sm text-sm transition-all"
              placeholder="Search..."
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 h-11 w-11 shrink-0 shadow-sm"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-sm font-bold text-slate-800 leading-tight">Huân Hoàng</span>
            <span className="text-[10px] text-[#f26522] font-semibold">Free Plan</span>
          </div>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="cursor-pointer h-10 w-10 shrink-0 rounded-full bg-[#f26522] text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white hover:opacity-90 transition-all focus:outline-none"
          >
            H
          </button>

          {isDropdownOpen && (
            <>
              {/* Overlay ẩn để bấm ra ngoài dropdown thì tự đóng */}
              <div className="fixed inset-0 z-30 bg-transparent cursor-default" onClick={() => setIsDropdownOpen(false)} />

              {/* Menu con */}
              <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40">
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors block rounded-t-xl"
                >
                  <User size={15} className="text-slate-400" />
                  My Profile
                </Link>

                <button className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                  <Settings size={15} className="text-slate-400" />
                  Account Settings
                </button>

                <div className="border-t border-slate-100 my-1.5"></div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogoutClick(); // Kích hoạt hàm mở modal truyền từ MainLayout xuống
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
      
      {/* FIX: Đã xóa hoàn toàn component LogoutModal cũ bị thừa ở đây */}
    </div>
  );
}