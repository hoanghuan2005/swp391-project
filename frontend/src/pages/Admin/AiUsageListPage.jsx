import React, { useEffect, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, Search, Sparkles, BarChart3, Database } from "lucide-react";
import AdminToolbar from "@/components/admin/AdminToolbar";

export default function AiUsageListPage() {
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsages = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/api/admin/ai-usages");
      setUsages(response.data || []);
    } catch (error) {
      console.error("Failed to fetch AI usages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsages();
  }, []);

  const filteredUsages = usages.filter((u) => {
    const keyword = searchQuery.trim().toLowerCase();
    return (
      u.username?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword)
    );
  });

  const stats = React.useMemo(() => {
    let totalLifetimeRequests = 0;
    usages.forEach((u) => {
      totalLifetimeRequests += u.totalRequests || 0;
    });

    const avgRequests = usages.length > 0 ? (totalLifetimeRequests / usages.length).toFixed(1) : 0;

    return { totalLifetimeRequests, avgRequests };
  }, [usages]);

  const columnsForExport = [
    { header: "User ID", render: (item) => item.userId || "" },
    { header: "Username", render: (item) => item.username || "" },
    { header: "Email", render: (item) => item.email || "" },
    { header: "Subscription Tier", render: (item) => item.subscriptionTier || "" },
    { header: "Remaining Monthly Quota", render: (item) => item.remainingUsage || 0 },
    { header: "Lifetime AI Requests", render: (item) => item.totalRequests || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f26522]">
              <Brain className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              AI Quota & Usage Tracker
            </h1>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Monitor monthly user API limits, remaining balance, and lifetime requests.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Lifetime Requests
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {stats.totalLifetimeRequests}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Global Groq calls recorded</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#f26522]">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Avg Requests per User
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {stats.avgRequests}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Average user engagement</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <BarChart3 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Users Tracked
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {usages.length}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Unique active accounts</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Database className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid List Card */}
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full pb-2 border-b border-slate-100">
            <h4 className="text-lg font-bold text-slate-700">AI usages directory</h4>
          </div>
          <div className="w-full pt-2">
            <AdminToolbar
              searchVal={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by user or email..."
              showImport={false}
              exportData={filteredUsages}
              exportColumns={columnsForExport}
              exportFilename="ai_usages_export.csv"
            />
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Loading AI usage logs...
            </div>
          ) : filteredUsages.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No users match the query.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-slate-600 font-bold text-xs uppercase w-[35%]">
                      User details
                    </TableHead>
                    <TableHead className="text-slate-600 font-bold text-xs uppercase w-[20%] text-center">
                      Subscription
                    </TableHead>
                    <TableHead className="text-slate-600 font-bold text-xs uppercase w-[25%] text-center">
                      Remaining Monthly Quota
                    </TableHead>
                    <TableHead className="text-slate-600 font-bold text-xs uppercase w-[20%] text-center">
                      Lifetime Requests
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsages.map((u) => {
                    const isPro = u.subscriptionTier === "PRO";

                    return (
                      <TableRow key={u.userId} className="hover:bg-slate-50/30">
                        <TableCell>
                          <div className="font-semibold text-slate-700">{u.username}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{u.email}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`rounded-full px-2.5 py-1 text-xs border-none font-bold shadow-none ${
                              isPro ? "bg-orange-50 text-[#f26522]" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {u.subscriptionTier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-700">
                          {u.remainingUsage === 999999999 ? "∞ (Pro Unlimited)" : u.remainingUsage}
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-700">
                          {u.totalRequests}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
