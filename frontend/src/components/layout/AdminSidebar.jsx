import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  GraduationCap,
  Tags,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tách riêng NavItem giống Vercel Best Practices (Rerender optimization)
function AdminNavItem({ to, icon: Icon, label, isOpen, pathname }) {
  // Check active state
  const isActive = pathname === to || pathname.startsWith(`${to}/`);

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

export default function AdminSidebar({ isOpen = true }) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "h-[calc(100vh-68px)] overflow-y-auto pb-10 bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-r border-gray-100 transition-all duration-300 ease-in-out shadow-sm",
        isOpen ? "w-[280px] px-3 pt-3" : "w-[72px] px-2 pt-3",
        "hidden lg:block shrink-0 transition-all duration-300 ease-in-out",
      )}
    >
      {/* Header riêng cho Admin */}
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
          <div className="h-[42px] w-[42px] shrink-0 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            AD
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 whitespace-nowrap",
              isOpen ? "w-auto opacity-100 pr-4" : "w-0 opacity-0",
            )}
          >
            <div className="text-sm font-bold text-slate-800 uppercase tracking-tight">
              Admin Panel
            </div>
            <div className="text-xs text-[#f26522] font-semibold flex items-center gap-1 mt-0.5">
              Management
            </div>
          </div>
        </div>
      </div>

      {/* Điều hướng */}
      <nav className={cn("w-full flex flex-col", !isOpen && "items-center")}>
        <AdminNavItem
          to="/admin/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <AdminNavItem
          to="/admin/users"
          icon={Users}
          label="Users"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <AdminNavItem
          to="/admin/documents"
          icon={FileText}
          label="Documents"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <AdminNavItem
          to="/admin/courses"
          icon={BookOpen}
          label="Courses"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <AdminNavItem
          to="/admin/catalog/schools"
          icon={GraduationCap}
          label="Schools"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <AdminNavItem
          to="/admin/catalog/tags"
          icon={Tags}
          label="Tags"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <AdminNavItem
          to="/admin/catalog/languages"
          icon={Globe}
          label="Languages"
          isOpen={isOpen}
          pathname={location.pathname}
        />
      </nav>
    </aside>
  );
}
