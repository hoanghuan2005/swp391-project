import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    title: "Accounts Overview",
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
      <Card className="group h-full rounded-2xl border-slate-100 bg-white shadow-sm hover:border-[#f26522]/30 hover:shadow-md transition-all duration-300">
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

  // Hover states for interactive SVG charts
  const [hoveredTier, setHoveredTier] = useState(null);
  const [hoveredDoc, setHoveredDoc] = useState(null);

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

  // 1. Calculations for Subscription Doughnut Chart (Free vs Pro)
  const totalSub = (stats.freeUsers || 0) + (stats.proUsers || 0) || 1;
  const freePercent = Math.round(((stats.freeUsers || 0) / totalSub) * 100);
  const proPercent = Math.round(((stats.proUsers || 0) / totalSub) * 100);

  // 2. Calculations for Document Status Pie Chart (Ready, Pending, Failed, Unsupported)
  const totalDocs =
    (stats.documentsReadyForAi || 0) +
      (stats.documentsPendingParse || 0) +
      (stats.documentsFailedParse || 0) +
      (stats.documentsUnsupportedForAi || 0) || 1;

  const docSlices = [
    { label: "AI Ready", val: stats.documentsReadyForAi || 0, color: "#10b981" },
    { label: "AI Pending", val: stats.documentsPendingParse || 0, color: "#f59e0b" },
    { label: "AI Failed", val: stats.documentsFailedParse || 0, color: "#ef4444" },
    { label: "Unsupported", val: stats.documentsUnsupportedForAi || 0, color: "#64748b" },
  ];

  // Compute angles for pie chart
  let accumulatedAngle = 0;
  const pieSlices = docSlices.map((slice) => {
    const angle = (slice.val / totalDocs) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;
    return { ...slice, startAngle, angle };
  });

  // 3. Catalog counts for Bar Chart
  const catalogData = [
    { label: "Schools", val: stats.totalSchools || 0, color: "#10b981" },
    { label: "Majors", val: stats.totalMajors || 0, color: "#8b5cf6" },
    { label: "Courses", val: stats.totalCourses || 0, color: "#f26522" },
    { label: "Tags", val: stats.totalTags || 0, color: "#64748b" },
    { label: "Languages", val: stats.totalLanguages || 0, color: "#6366f1" },
  ];
  const maxCatalogVal = Math.max(...catalogData.map((d) => d.val), 5);

  return (
    <div className="space-y-6">
      {/* Header */}
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
            Realtime metrics, document parsing intelligence, and database aggregates.
          </p>
        </div>
      </header>

      {/* Numeric Stats */}
      {statGroups.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-lg font-bold text-slate-700">{group.title}</h2>
          <div className="grid gap-5 md:grid-cols-3">
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

      {/* Visual Analytics Section */}
      <h2 className="text-lg font-bold text-slate-700 mt-8">Visual Analytics</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {/* 1. Subscription Tier Doughnut Chart */}
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-700 flex items-center justify-between">
              Account Tiers
              <span className="text-xs font-medium text-slate-400">Doughnut Chart</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            {isLoading ? (
              <Skeleton className="w-[180px] h-[180px] rounded-full" />
            ) : (
              <div className="relative w-full flex flex-col items-center justify-center">
                <svg className="w-[180px] h-[180px]" viewBox="0 0 100 100">
                  {/* Outer circle track */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />

                  {/* Free slice - light grey */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth={hoveredTier === "FREE" ? "15" : "12"}
                    strokeDasharray={`${freePercent * 2.38} 238`}
                    transform="rotate(-90 50 50)"
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredTier("FREE")}
                    onMouseLeave={() => setHoveredTier(null)}
                  />

                  {/* Pro slice - Orange */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#f26522"
                    strokeWidth={hoveredTier === "PRO" ? "15" : "12"}
                    strokeDasharray={`${proPercent * 2.38} 238`}
                    strokeDashoffset={-freePercent * 2.38}
                    transform="rotate(-90 50 50)"
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredTier("PRO")}
                    onMouseLeave={() => setHoveredTier(null)}
                  />

                  {/* Center Text */}
                  <text x="50%" y="47%" textAnchor="middle" className="text-[7px] font-extrabold fill-slate-400 uppercase">
                    PRO TIER
                  </text>
                  <text x="50%" y="61%" textAnchor="middle" className="text-[14px] font-black fill-slate-800">
                    {proPercent}%
                  </text>
                </svg>

                {/* Legend */}
                <div className="flex gap-4 mt-6">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#cbd5e1]" />
                    <span className="text-xs font-semibold text-slate-500">Free ({stats.freeUsers})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#f26522]" />
                    <span className="text-xs font-semibold text-slate-800">Pro ({stats.proUsers})</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Document AI Processing Pie Chart */}
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-700 flex items-center justify-between">
              AI Document Status
              <span className="text-xs font-medium text-slate-400">Pie Chart</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            {isLoading ? (
              <Skeleton className="w-[180px] h-[180px] rounded-full" />
            ) : (
              <div className="relative w-full flex flex-col items-center justify-center">
                <svg className="w-[180px] h-[180px]" viewBox="0 0 100 100">
                  <g transform="rotate(-90 50 50)">
                    {pieSlices.map((slice, idx) => {
                      if (slice.val === 0) return null;

                      const isHovered = hoveredDoc === idx;

                      if (slice.angle >= 359.9) {
                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="40"
                            fill={slice.color}
                            className="cursor-pointer transition-all duration-300"
                            opacity={isHovered ? 0.9 : 0.75}
                            transform={isHovered ? "scale(1.05) translate(-2.4, -2.4)" : ""}
                            onMouseEnter={() => setHoveredDoc(idx)}
                            onMouseLeave={() => setHoveredDoc(null)}
                          />
                        );
                      }

                      // Draw SVG arc path for pie slice
                      const startRad = (slice.startAngle * Math.PI) / 180;
                      const endRad = ((slice.startAngle + slice.angle) * Math.PI) / 180;
                      const x1 = 50 + 40 * Math.cos(startRad);
                      const y1 = 50 + 40 * Math.sin(startRad);
                      const x2 = 50 + 40 * Math.cos(endRad);
                      const y2 = 50 + 40 * Math.sin(endRad);
                      const largeArc = slice.angle > 180 ? 1 : 0;
                      const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

                      return (
                        <path
                          key={idx}
                          d={pathData}
                          fill={slice.color}
                          className="cursor-pointer transition-all duration-300"
                          opacity={isHovered ? 0.9 : 0.75}
                          transform={isHovered ? "scale(1.05) translate(-2.4, -2.4)" : ""}
                          onMouseEnter={() => setHoveredDoc(idx)}
                          onMouseLeave={() => setHoveredDoc(null)}
                        />
                      );
                    })}
                  </g>
                </svg>

                {/* Dynamic Tooltip inside legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-6 w-full px-2">
                  {pieSlices.map((slice, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 transition-opacity ${
                        hoveredDoc !== null && hoveredDoc !== idx ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                      <span className="text-xs font-semibold text-slate-600 truncate">
                        {slice.label}: <span className="font-extrabold text-slate-800">{slice.val}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Catalog Distribution Bar Chart */}
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-700 flex items-center justify-between">
              Catalog Distribution
              <span className="text-xs font-medium text-slate-400">Bar Chart</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4 w-full h-[180px] flex flex-col justify-end">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="w-full h-[220px] flex flex-col justify-between">
                {/* Visual Bars */}
                <div className="flex-1 flex items-end justify-between px-2 gap-4 pb-4">
                  {catalogData.map((d, idx) => {
                    const barHeight = Math.max(10, Math.round((d.val / maxCatalogVal) * 130)); // max height 130px

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                        {/* Tooltip on Hover */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-10">
                          {d.val} items
                        </div>

                        {/* Bar */}
                        <div
                          className="w-full rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                          style={{
                            height: `${barHeight}px`,
                            backgroundColor: d.color,
                            boxShadow: `0 4px 6px -1px ${d.color}20`,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X Axis Labels */}
                <div className="flex justify-between border-t border-slate-100 pt-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">
                  {catalogData.map((d, idx) => (
                    <div key={idx} className="flex-1 text-center truncate px-0.5" style={{ color: d.color }}>
                      {d.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
