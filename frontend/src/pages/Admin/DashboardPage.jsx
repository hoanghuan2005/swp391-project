import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BadgeCheck,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  GraduationCap,
  Globe,
  LayoutDashboard,
  Lock,
  ShieldAlert,
  Tags,
  UserCheck,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";

const numberFormatter = new Intl.NumberFormat("en-US");

const defaultStats = {
  totalUsers: 0,
  activeUsers: 0,
  bannedUsers: 0,
  freeUsers: 0,
  proUsers: 0,
  totalCourses: 0,
  totalMajors: 0,
  totalDocuments: 0,
  publicDocuments: 0,
  privateDocuments: 0,
  documentsPendingParse: 0,
  documentsReadyForAi: 0,
  documentsFailedParse: 0,
  documentsUnsupportedForAi: 0,
  totalSchools: 0,
  totalTags: 0,
  totalLanguages: 0,
};

const statGroups = [
  {
    title: "Accounts",
    cards: [
      {
        key: "totalUsers",
        title: "Total Users",
        caption: "Registered accounts",
        href: "/admin/users",
        icon: Users,
        iconClassName: "bg-blue-50 text-blue-600",
      },
      {
        key: "activeUsers",
        title: "Active Users",
        caption: "Non-banned accounts",
        href: "/admin/users",
        icon: UserCheck,
        iconClassName: "bg-green-50 text-green-600",
      },
      {
        key: "bannedUsers",
        title: "Banned Users",
        caption: "Restricted accounts",
        href: "/admin/users",
        icon: UserX,
        iconClassName: "bg-red-50 text-red-600",
      },
      {
        key: "freeUsers",
        title: "Free Users",
        caption: "Free subscription tier",
        href: "/admin/users",
        icon: ShieldAlert,
        iconClassName: "bg-slate-100 text-slate-600",
      },
      {
        key: "proUsers",
        title: "Pro Users",
        caption: "Paid subscription tier",
        href: "/admin/users",
        icon: BadgeCheck,
        iconClassName: "bg-orange-50 text-[#f26522]",
      },
    ],
  },
  {
    title: "Documents",
    cards: [
      {
        key: "totalDocuments",
        title: "Total Documents",
        caption: "Uploaded materials",
        href: "/admin/documents",
        icon: FileText,
        iconClassName: "bg-orange-50 text-[#f26522]",
      },
      {
        key: "publicDocuments",
        title: "Public Documents",
        caption: "Visible in discovery",
        href: "/admin/documents",
        icon: Globe,
        iconClassName: "bg-green-50 text-green-600",
      },
      {
        key: "privateDocuments",
        title: "Private Documents",
        caption: "Owner-only materials",
        href: "/admin/documents",
        icon: Lock,
        iconClassName: "bg-slate-100 text-slate-600",
      },
      {
        key: "documentsReadyForAi",
        title: "AI Ready",
        caption: "Parsed for AI features",
        href: "/admin/documents",
        icon: Brain,
        iconClassName: "bg-emerald-50 text-emerald-600",
      },
      {
        key: "documentsPendingParse",
        title: "AI Pending",
        caption: "Waiting for parsing",
        href: "/admin/documents",
        icon: CheckCircle2,
        iconClassName: "bg-amber-50 text-amber-600",
      },
      {
        key: "documentsFailedParse",
        title: "AI Failed",
        caption: "Parsing failed",
        href: "/admin/documents",
        icon: XCircle,
        iconClassName: "bg-red-50 text-red-600",
      },
      {
        key: "documentsUnsupportedForAi",
        title: "AI Unsupported",
        caption: "Unsupported file type",
        href: "/admin/documents",
        icon: FileText,
        iconClassName: "bg-slate-100 text-slate-600",
      },
    ],
  },
  {
    title: "Catalog",
    cards: [
      {
        key: "totalCourses",
        title: "Total Courses",
        caption: "Active courses",
        href: "/admin/courses",
        icon: BookOpen,
        iconClassName: "bg-purple-50 text-purple-600",
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
    ],
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

      {statGroups.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-lg font-bold text-slate-700">{group.title}</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {group.cards.map((stat) => (
              <StatCard
                key={stat.key}
                stat={stat}
                value={stats[stat.key]}
                isLoading={isLoading}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
