import React, { useEffect, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, Search, Sparkles, BarChart3, Database, ChevronUp, ChevronDown } from "lucide-react";
import AdminToolbar from "@/components/admin/AdminToolbar";
import { Button } from "@/components/ui/button";

function SortableHead({ sortKey, sortConfig, onSort, className, children }) {
  const isActive = sortConfig.key === sortKey;
  const Icon = isActive && sortConfig.direction === "desc" ? ChevronDown : ChevronUp;

  return (
    <TableHead className={`${className} px-1 text-center`}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onSort(sortKey)}
        className="h-7 mx-auto flex items-center justify-center px-1 font-bold text-slate-700 hover:bg-slate-100 focus-visible:ring-[#f26522]/30 text-xs"
      >
        {children}
        <Icon
          className={`ml-0.5 h-3 w-3 ${
            isActive ? "text-[#f26522]" : "text-slate-300"
          }`}
          aria-hidden="true"
        />
      </Button>
    </TableHead>
  );
}

export default function AiUsageListPage() {
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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
    const matchesSearch = (
      u.username?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword)
    );
    const matchesSubscription = subscriptionFilter === "ALL" || u.subscriptionTier === subscriptionFilter;
    return matchesSearch && matchesSubscription;
  });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedUsages = React.useMemo(() => {
    const sortableItems = [...filteredUsages];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "subscriptionTier") {
          aVal = a.subscriptionTier || "";
          bVal = b.subscriptionTier || "";
        } else if (sortConfig.key === "remainingUsage") {
          aVal = a.remainingUsage ?? 0;
          bVal = b.remainingUsage ?? 0;
        } else if (sortConfig.key === "totalRequests") {
          aVal = a.totalRequests ?? 0;
          bVal = b.totalRequests ?? 0;
        }

        if (aVal < bVal) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredUsages, sortConfig]);

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
            <h4 className="text-lg font-bold text-slate-700 whitespace-nowrap">AI usages directory</h4>
          </div>
          <div className="w-full pt-2">
            <AdminToolbar
              searchVal={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by user or email..."
              showImport={false}
              exportData={sortedUsages}
              exportColumns={columnsForExport}
              exportFilename="ai_usages_export.csv"
              activeFiltersCount={subscriptionFilter !== "ALL" ? 1 : 0}
              onClearFilters={() => setSubscriptionFilter("ALL")}
              filters={
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subscription</label>
                  <select
                    id="admin-ai-subscription-filter"
                    value={subscriptionFilter}
                    onChange={(event) => setSubscriptionFilter(event.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600 outline-none focus:border-[#f26522]/40 focus:ring-1 focus:ring-[#f26522]/20 cursor-pointer"
                  >
                    <option value="ALL">All plans</option>
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                  </select>
                </div>
              }
            />
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Loading AI usage logs...
            </div>
          ) : sortedUsages.length === 0 ? (
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
                    <SortableHead
                      sortKey="subscriptionTier"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[20%] font-bold"
                    >
                      Subscription
                    </SortableHead>
                    <SortableHead
                      sortKey="remainingUsage"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[25%] font-bold"
                    >
                      Remaining Monthly Quota
                    </SortableHead>
                    <SortableHead
                      sortKey="totalRequests"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[20%] font-bold"
                    >
                      Lifetime Requests
                    </SortableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsages.map((u) => {
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
