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
  Plus,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

function NavItem({ to, icon: Icon, label, isOpen, pathname }) {
  const isActive = pathname === to || (to === '/' && pathname === '/');
  
  if (!isOpen) {
    return (
      <Link to={to} title={label} className="w-full flex justify-center mb-1">
        <Button
          variant="ghost"
          className={cn(
            "h-11 w-11 p-0 rounded-xl transition-colors flex items-center justify-center shrink-0",
            isActive 
              ? "bg-[#EAF4FF] text-[#1B89FC]" 
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
        </Button>
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
            ? "bg-[#EAF4FF] text-[#1B89FC] hover:bg-[#DDF0FF] hover:text-[#1B89FC]" 
            : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <Icon className="mr-3 h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} /> 
        <span className="truncate">{label}</span>
      </Button>
    </Link>
  );
}

export default function Sidebar({ isOpen = true, onToggle }) {
  const location = useLocation();

  return (
    <aside className={cn(
      "h-[calc(100vh-80px)] overflow-y-auto pb-10 border-r border-gray-100 custom-scrollbar transition-all duration-300 relative",
      isOpen ? "pr-4 w-[260px]" : "pr-0 w-[68px]"
    )}>
      {/* Menu Toggle inside Sidebar */}
      <div className={cn("absolute top-0 right-0 p-2 z-10", isOpen ? "" : "right-1")}>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:bg-slate-100 shrink-0 h-9 w-9"
            onClick={onToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
      </div>

      <div className={cn("pt-12", isOpen ? "space-y-6" : "flex flex-col items-center space-y-6")}>
        
        <div className={cn("flex items-center", isOpen ? "gap-4 px-2" : "justify-center w-full")}>
          <div className="h-[42px] w-[42px] shrink-0 rounded-full bg-[#6C3DE8] text-white flex items-center justify-center font-medium text-lg shadow-sm">
            H
          </div>
          {isOpen && (
            <div className="overflow-hidden pr-8">
              <div className="text-sm font-bold text-slate-800 truncate">Huân Hoàng</div>
              <div className="text-xs text-[#1B89FC] font-medium flex items-center gap-1">
                <House className="w-3 h-3 shrink-0" />
                <span className="truncate">FPT</span>
              </div>
            </div>
          )}
        </div>

        {isOpen && (
          <div className="flex items-center justify-between text-center px-4">
            <div className="flex flex-col items-center">
              <div className="text-base font-bold text-slate-800">0</div>
              <div className="text-[11px] text-slate-500 font-medium">Followers</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-base font-bold text-slate-800">3</div>
              <div className="text-[11px] text-slate-500 font-medium">Uploads</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-base font-bold text-slate-800">0</div>
              <div className="text-[11px] text-slate-500 font-medium">Upvotes</div>
            </div>
          </div>
        )}

        <div className={cn("flex justify-center", isOpen ? "w-full" : "w-11")}>
          {isOpen ? (
            <Button className="w-full rounded-full bg-[#1B89FC] hover:bg-[#1B89FC]/90 text-white shadow-sm h-11 text-sm font-semibold transition-all">
              <span className="text-lg mr-1 font-light">+</span> New
            </Button>
          ) : (
            <Button className="w-[42px] h-[42px] rounded-full p-0 bg-[#1B89FC] hover:bg-[#1B89FC]/90 text-white shadow-sm shrink-0 flex items-center justify-center">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </Button>
          )}
        </div>

        <nav className={cn("w-full mt-2", !isOpen && "flex flex-col items-center")}>
          <NavItem to="/dashboard" icon={House} label="Home" isOpen={isOpen} pathname={location.pathname} />
          <NavItem to="/my-library" icon={LibraryBig} label="My Library" isOpen={isOpen} pathname={location.pathname} />
          <NavItem to="/ai-notes" icon={FileText} label="AI Notes" isOpen={isOpen} pathname={location.pathname} />
          <NavItem to="/ask-ai" icon={MessageSquare} label="Ask AI" isOpen={isOpen} pathname={location.pathname} />
          <NavItem to="/ai-quiz" icon={BadgeCheck} label="AI Quiz" isOpen={isOpen} pathname={location.pathname} />
        </nav>

        {isOpen ? <Separator className="bg-slate-100 w-[calc(100%-32px)] mx-auto" /> : <div className="w-6 h-px bg-slate-200 mt-2 mb-4" />}

        {isOpen && <div className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">My Library</div>}
        <nav className={cn("w-full", !isOpen && "flex flex-col items-center")}>
          <NavItem to="/courses" icon={FolderOpen} label="Courses" isOpen={isOpen} pathname={location.pathname} />
          <NavItem to="/projects" icon={BookMarked} label="Projects" isOpen={isOpen} pathname={location.pathname} />
        </nav>

      </div>
    </aside>
  );
}
