import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  House,
  BookMarked,
  FileText,
  MessageSquare,
  BadgeCheck,
  FolderOpen,
  LibraryBig,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

function NavItem({ to, icon: Icon, label, isOpen, pathname }) {
  const isActive = pathname === to || (to === '/' && pathname === '/');
  
  if (!isOpen) {
    return (
      <Link to={to} title={label} className={cn(
        "w-full flex flex-col items-center justify-center py-4 px-1 mb-1 rounded-xl transition-colors",
        isActive ? "text-[#f26522]" : "text-slate-500 hover:bg-slate-100"
      )}>
        <Icon className={cn("h-6 w-6 mb-1.5", isActive ? "text-[#f26522]" : "")} strokeWidth={isActive ? 2.5 : 2} />
        <span className={cn("text-[10px] w-full text-center truncate px-1", isActive ? "font-bold text-[#f26522]" : "font-medium")}>
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link to={to} className="block w-full mb-1">
      <Button
        variant="ghost"
        className={cn(
          "justify-start w-full h-11 px-4 font-semibold rounded-xl transition-colors",
          isActive 
            ? "bg-[#fff0e5] text-[#f26522] hover:bg-[#ffe1cc] hover:text-[#f26522]" 
            : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <Icon className="mr-4 h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} /> 
        <span className="truncate">{label}</span>
      </Button>
    </Link>
  );
}

export default function Sidebar({ isOpen = true }) {
  const location = useLocation();

  return (
    <aside className={cn(
      "h-[calc(100vh-68px)] overflow-y-auto pb-10 bg-white custom-scrollbar",
      isOpen ? "w-[240px] px-3 pt-3" : "w-[72px] px-1 pt-1",
      "hidden lg:block shrink-0 transition-all duration-300 ease-in-out"
    )}>
      
      {isOpen && (
        <div className="px-1 mb-4 hidden">
          <Button className="w-full rounded-full bg-[#f26522] hover:bg-[#d9541a] text-white shadow-sm h-10 text-sm font-bold transition-all flex items-center justify-center gap-2">
            <Plus className="h-5 w-5" strokeWidth={2.5} /> New Create
          </Button>
        </div>
      )}

      <nav className={cn("w-full flex flex-col", !isOpen && "items-center")}>
        <NavItem to="/dashboard" icon={House} label="Home" isOpen={isOpen} pathname={location.pathname} />
        <NavItem to="/my-library" icon={LibraryBig} label="Library" isOpen={isOpen} pathname={location.pathname} />
        <NavItem to="/ai-notes" icon={FileText} label="AI Notes" isOpen={isOpen} pathname={location.pathname} />
        <NavItem to="/ask-ai" icon={MessageSquare} label="Ask AI" isOpen={isOpen} pathname={location.pathname} />
        <NavItem to="/ai-quiz" icon={BadgeCheck} label="AI Quiz" isOpen={isOpen} pathname={location.pathname} />
      </nav>

      <Separator className="bg-slate-100 w-full my-3" />

      {isOpen && <div className="px-4 text-sm font-bold text-slate-800 mb-2 mt-2">Explore</div>}
      <nav className={cn("w-full flex flex-col", !isOpen && "items-center")}>
        <NavItem to="/courses" icon={FolderOpen} label="Courses" isOpen={isOpen} pathname={location.pathname} />
        <NavItem to="/projects" icon={BookMarked} label="Projects" isOpen={isOpen} pathname={location.pathname} />
      </nav>
    </aside>
  );
}
