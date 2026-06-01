import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

const numberFormatter = new Intl.NumberFormat("en-US");

const defaultStats = {
  totalUsers: 0,
  totalCourses: 0,
  totalDocuments: 0,
  totalSchools: 0,
  totalTags: 0,
  totalLanguages: 0,
};

const statCards = [
  {
    key: "totalUsers",
    title: "Total Users",
    caption: "Registered accounts",
    href: "/admin/users",
    icon: Users,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    key: "totalCourses",
    title: "Total Courses",
    caption: "Active courses",
    href: "/admin/courses",
    icon: BookOpen,
    iconClassName: "bg-purple-50 text-purple-600",
  },
  {
    key: "totalDocuments",
    title: "Total Documents",
    caption: "Uploaded materials",
    href: "/admin/documents",
    icon: FileText,
    iconClassName: "bg-orange-50 text-[#f26522]",
  },
  {
    key: "totalSchools",
    title: "Total Schools",
    caption: "Partner universities",
    href: "/admin/catalog/schools",
    icon: GraduationCap,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "totalTags",
    title: "Total Tags",
    caption: "Search labels",
    href: "/admin/catalog/tags",
    icon: Tags,
    iconClassName: "bg-slate-100 text-slate-600",
  },
  {
    key: "totalLanguages",
    title: "Total Languages",
    caption: "Survey options",
    href: "/admin/catalog/languages",
    icon: Globe,
    iconClassName: "bg-indigo-50 text-indigo-600",
  },
];

function StatCard({ stat, value, isLoading }) {
  const Icon = stat.icon;

  return (
    <Link
      to={stat.href}
      className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#f26522] focus-visible:ring-offset-2"
    >
      <Card className="group h-full rounded-2xl border-slate-100 bg-white shadow-sm hover:border-[#f26522]/30 hover:shadow-md">
        <CardContent className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-wide text-slate-500 group-hover:text-[#f26522]">
                {stat.title}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                {stat.caption}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconClassName}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-9 w-24 rounded-lg" />
          ) : (
            <div className="text-3xl font-bold tabular-nums tracking-tight text-slate-800">
              {numberFormatter.format(value || 0)}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosClient.get("/api/admin/dashboard/stats");
        setStats({ ...defaultStats, ...response.data });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f26522]">
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Admin Dashboard
            </h1>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Quick overview of platform data and catalog totals.
          </p>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => (
          <StatCard
            key={stat.key}
            stat={stat}
            value={stats[stat.key]}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
