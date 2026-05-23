import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Globe,
  LayoutDashboard,
  Tags,
  Users,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalDocuments: 0,
    totalSchools: 0,
    totalTags: 0,
    totalLanguages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosClient.get("/api/admin/dashboard/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Bổ sung Icon trên Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="w-8 h-8 text-[#f26522]" />
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          Admin Dashboard
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Total Users Card */}
        <Link to="/admin/users" className="block outline-none focus-visible:ring-2 focus-visible:ring-[#f26522] rounded-2xl">
          <Card className="rounded-2xl shadow-sm border-slate-100 hover:shadow-md hover:border-[#f26522]/30 transition-all cursor-pointer h-full group bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#f26522] transition-colors">
                Total Users
              </CardTitle>
              {/* Đóng khung icon để tạo điểm nhấn Wow */}
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-[#f26522]/10 group-hover:text-[#f26522] transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">
                {isLoading ? "..." : stats.totalUsers}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Registered accounts
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Total Courses Card */}
        <Link to="/admin/courses" className="block outline-none focus-visible:ring-2 focus-visible:ring-[#f26522] rounded-2xl">
          <Card className="rounded-2xl shadow-sm border-slate-100 hover:shadow-md hover:border-[#f26522]/30 transition-all cursor-pointer h-full group bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#f26522] transition-colors">
                Total Courses
              </CardTitle>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-[#f26522]/10 group-hover:text-[#f26522] transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">
                {isLoading ? "..." : stats.totalCourses}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Active courses
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Total Documents Card */}
        <Link to="/admin/documents" className="block outline-none focus-visible:ring-2 focus-visible:ring-[#f26522] rounded-2xl">
          <Card className="rounded-2xl shadow-sm border-slate-100 hover:shadow-md hover:border-[#f26522]/30 transition-all cursor-pointer h-full group bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#f26522] transition-colors">
                Total Documents
              </CardTitle>
              <div className="p-2.5 bg-orange-50 text-[#f26522] rounded-xl group-hover:bg-[#f26522]/10 group-hover:text-[#f26522] transition-colors">
                <FileText className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">
                {isLoading ? "..." : stats.totalDocuments}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Uploaded materials
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Total Schools Card */}
        <Link to="/admin/catalog/schools" className="block outline-none focus-visible:ring-2 focus-visible:ring-[#f26522] rounded-2xl">
          <Card className="rounded-2xl shadow-sm border-slate-100 hover:shadow-md hover:border-[#f26522]/30 transition-all cursor-pointer h-full group bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#f26522] transition-colors">
                Total Schools
              </CardTitle>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-[#f26522]/10 group-hover:text-[#f26522] transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">
                {isLoading ? "..." : stats.totalSchools}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Partner universities
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Total Tags Card */}
        <Link to="/admin/catalog/tags" className="block outline-none focus-visible:ring-2 focus-visible:ring-[#f26522] rounded-2xl">
          <Card className="rounded-2xl shadow-sm border-slate-100 hover:shadow-md hover:border-[#f26522]/30 transition-all cursor-pointer h-full group bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#f26522] transition-colors">
                Total Tags
              </CardTitle>
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-[#f26522]/10 group-hover:text-[#f26522] transition-colors">
                <Tags className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">
                {isLoading ? "..." : stats.totalTags}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Search labels
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Total Languages Card */}
        <Link to="/admin/catalog/languages" className="block outline-none focus-visible:ring-2 focus-visible:ring-[#f26522] rounded-2xl">
          <Card className="rounded-2xl shadow-sm border-slate-100 hover:shadow-md hover:border-[#f26522]/30 transition-all cursor-pointer h-full group bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#f26522] transition-colors">
                Total Languages
              </CardTitle>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-[#f26522]/10 group-hover:text-[#f26522] transition-colors">
                <Globe className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">
                {isLoading ? "..." : stats.totalLanguages}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Survey options
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
