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
} from "lucide-react";
import { cn } from "@/lib/utils";

function NavItem({ to, icon: Icon, label, isOpen, pathname }) {
  const isActive = pathname === to || (to === "/" && pathname === "/");

  return (
    <Link
      to={to}
      title={!isOpen ? label : undefined}
      className="block w-full mb-1"
    >
      <Button
        variant="ghost"
        className={cn(
          "w-full h-12 rounded-xl transition-all duration-300 flex items-center",
          isOpen ? "justify-start px-4" : "justify-center px-0",
          isActive
            ? "bg-[#fff0e5] text-[#f26522] hover:bg-[#ffe1cc] hover:text-[#f26522]"
            : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900",
        )}
      >
        <Icon
          size={30}
          className={cn(
            "!w-[22px] !h-[22px] shrink-0 transition-all duration-300",
            isOpen ? "mr-4" : "-mr-1.5",
          )}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <div
          className={cn(
            "transition-all duration-300 whitespace-nowrap overflow-hidden text-left",
            isOpen
              ? "w-auto opacity-100 text-[15px] font-semibold"
              : "w-0 opacity-0 text-[0px]",
          )}
        >
          {label}
        </div>
      </Button>
    </Link>
  );
}

export default function Sidebar({ isOpen = true }) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "h-[calc(100vh-68px)] overflow-y-auto pb-10 bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-r border-gray-100 transition-all duration-300 ease-in-out",
        isOpen ? "w-[280px] px-3 pt-3" : "w-[72px] px-2 pt-3",
        "hidden lg:block shrink-0 transition-all duration-300 ease-in-out",
      )}
    >
      {/* User Profile Block */}
      <div
        className={cn(
          "mb-6 mt-2 transition-all duration-300 ease-in-out overflow-hidden flex flex-col items-center",
          isOpen ? "px-2" : "",
        )}
      >
        <div
          className={cn(
            "flex items-center w-full transition-all duration-300",
            isOpen ? "justify-start gap-4 mb-5" : "justify-center",
          )}
        >
          <div className="h-[42px] w-[42px] shrink-0 rounded-full bg-[#f26522] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            H
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 whitespace-nowrap",
              isOpen ? "w-auto opacity-100 pr-4" : "w-0 opacity-0",
            )}
          >
            <div className="text-sm font-bold text-slate-800">Huân Hoàng</div>
            <div className="text-xs text-[#f26522] font-semibold flex items-center gap-1 mt-0.5">
              <House className="w-3 h-3 shrink-0" />
              <span>FPT</span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-between text-center w-full transition-all duration-300 overflow-hidden whitespace-nowrap",
            isOpen ? "h-[50px] opacity-100 px-2 mb-4" : "h-0 opacity-0 m-0",
          )}
        >
          <div className="flex flex-col items-center">
            <div className="text-base font-extrabold text-slate-800">0</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
              Followers
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-base font-extrabold text-slate-800">3</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
              Uploads
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-base font-extrabold text-slate-800">0</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
              Upvotes
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex justify-center transition-all duration-300",
            isOpen ? "w-full" : "w-10 pt-4",
          )}
        >
          {isOpen ? (
            <Button className="w-full rounded-full bg-[#f26522] hover:bg-[#d9541a] text-white shadow-sm h-11 text-sm font-bold transition-all flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" strokeWidth={2.5} /> New Create
            </Button>
          ) : (
            <Button className="w-10 h-10 rounded-full p-0 bg-[#f26522] hover:bg-[#d9541a] text-white shadow-sm shrink-0 flex items-center justify-center transition-transform hover:scale-105">
              <Plus className="h-5 w-5" strokeWidth={3} />
            </Button>
          )}
        </div>
      </div>

      <nav className={cn("w-full flex flex-col", !isOpen && "items-center")}>
        <NavItem
          to="/dashboard"
          icon={House}
          label="Home"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/my-library"
          icon={LibraryBig}
          label="Library"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/ai-notes"
          icon={FileText}
          label="AI Notes"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/ask-ai"
          icon={MessageSquare}
          label="Ask AI"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/ai-quiz"
          icon={BadgeCheck}
          label="AI Quiz"
          isOpen={isOpen}
          pathname={location.pathname}
        />
      </nav>

      <Separator className="bg-slate-100 w-full my-2" />

      {/* Explorer heading gracefully fades out */}
      <div
        className={cn(
          "px-4 font-bold text-slate-800 mb-2 transition-all duration-300 whitespace-nowrap overflow-hidden",
          isOpen ? "h-6 opacity-100 text-sm mt-3" : "h-0 opacity-0 m-0",
        )}
      >
        Explore
      </div>
      <nav className={cn("w-full flex flex-col", !isOpen && "items-center")}>
        <NavItem
          to="/courses"
          icon={FolderOpen}
          label="Courses"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/projects"
          icon={BookMarked}
          label="Projects"
          isOpen={isOpen}
          pathname={location.pathname}
        />
      </nav>
    </aside>
  );
}
