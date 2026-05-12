import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mic, Menu, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar({ onMenuClick }) {
  return (
    <div className="w-full bg-white border-b border-gray-100 py-2 sticky top-0 z-50">
      <div className="w-full pr-4 sm:pr-6 flex items-center justify-between gap-2">
        
        {/* Left Side: Hamburger & Logo */}
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
          
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-2xl text-slate-800 tracking-tight ml-2">
            <BookOpen className="h-7 w-7 text-[#f26522]" />
            <span className="hidden sm:inline-block">MinDoCu</span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl flex items-center gap-4 px-2">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <Input
              className="pl-12 h-11 bg-slate-50 border-transparent hover:border-slate-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/20 rounded-full shadow-none text-sm transition-all"
              placeholder="Search..."
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 h-11 w-11 shrink-0"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>

        {/* Right Side: Profile */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-sm font-bold text-slate-800 leading-tight">Huân Hoàng</span>
            <span className="text-[10px] text-[#f26522] font-semibold">Free Plan</span>
          </div>
          <div className="cursor-pointer h-10 w-10 shrink-0 rounded-full bg-[#f26522] text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white">
            H
          </div>
        </div>
      </div>
    </div>
  );
}
