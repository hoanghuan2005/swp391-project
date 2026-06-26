import React, { useMemo, useState, useEffect, useCallback } from "react";
import axiosClient from "@/api/axiosClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Ban,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Shield,
  Unlock,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useModal } from "@/components/share/useModal";
import { toast } from "sonner";

const ALL_FILTER = "ALL";
const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const SORTABLE_COLUMNS = new Set([
  "username",
  "email",
  "role",
  "tier",
  "verified",
  "status",
  "documents",
  "aiUsage",
  "createdAt",
]);

const statConfig = [
  {
    key: "total",
    title: "Total",
    icon: Users,
    className: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    key: "active",
    title: "Active",
    icon: UserCheck,
    className: "bg-green-50 text-green-600 border-green-100",
  },
  {
    key: "banned",
    title: "Banned",
    icon: UserX,
    className: "bg-red-50 text-red-600 border-red-100",
  },
  {
    key: "free",
    title: "Free",
    icon: Shield,
    className: "bg-slate-50 text-slate-600 border-slate-200",
  },
  {
    key: "pro",
    title: "Pro",
    icon: CheckCircle2,
    className: "bg-orange-50 text-[#f26522] border-orange-100",
  },
  {
    key: "verified",
    title: "Verified",
    icon: Mail,
    className: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    key: "unverified",
    title: "Unverified",
    icon: AlertCircle,
    className: "bg-slate-50 text-slate-500 border-slate-200",
  },
];

function getRoleName(user) {
  return user.roleName || user.role?.name || "N/A";
}

function getTier(user) {
  return user.subscriptionTier || "N/A";
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return dateFormatter.format(date);
}

function getSortValue(user, key) {
  switch (key) {
    case "username":
      return user.username || "";
    case "email":
      return user.email || "";
    case "role":
      return getRoleName(user);
    case "tier":
      return getTier(user);
    case "verified":
      return user.emailVerified ? 1 : 0;
    case "status":
      return user.banned ? 1 : 0;
    case "documents":
      return user.totalDocuments ?? 0;
    case "aiUsage":
      return user.aiUsageToday ?? 0;
    case "createdAt":
      return user.createdAt ? new Date(user.createdAt).getTime() : 0;
    default:
      return "";
  }
}

function hasValue(value) {
  return value !== null && value !== undefined;
}

function formatBytes(bytes) {
  if (!hasValue(bytes)) return "N/A";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatAiUsage(user) {
  if (!hasValue(user.aiUsageToday)) return "N/A";
  if (user.aiDailyLimit === -1) return `${user.aiUsageToday} / Unlimited`;
  if (!hasValue(user.aiDailyLimit)) return String(user.aiUsageToday);
  return `${user.aiUsageToday} / ${user.aiDailyLimit}`;
}

function SortableHead({ sortKey, sortConfig, onSort, className, children }) {
  const isActive = sortConfig.key === sortKey;
  const Icon = isActive && sortConfig.direction === "desc" ? ChevronDown : ChevronUp;

  if (!SORTABLE_COLUMNS.has(sortKey)) {
    return <TableHead className={className}>{children}</TableHead>;
  }

  return (
    <TableHead className={className}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onSort(sortKey)}
        className="h-8 px-2 font-bold text-slate-700 hover:bg-slate-100 focus-visible:ring-[#f26522]/30"
      >
        {children}
        <Icon
          className={`ml-1 h-3.5 w-3.5 ${
            isActive ? "text-[#f26522]" : "text-slate-300"
          }`}
          aria-hidden="true"
        />
      </Button>
    </TableHead>
  );
}

function StatusBadge({ banned }) {
  return banned ? (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
      Banned
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200"
    >
      Active
    </Badge>
  );
}

function VerifiedBadge({ verified }) {
  return verified ? (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200"
    >
      Verified
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-500 border-slate-200"
    >
      Unverified
    </Badge>
  );
}

function TierBadge({ tier }) {
  return (
    <Badge
      variant="outline"
      className={
        tier === "PRO"
          ? "bg-orange-50 text-[#f26522] border-orange-200"
          : "bg-slate-50 text-slate-600 border-slate-200"
      }
    >
      {tier || "N/A"}
    </Badge>
  );
}

function RoleBadge({ roleName }) {
  return (
    <Badge
      variant={roleName === "ADMIN" ? "destructive" : "default"}
      className={roleName === "ADMIN" ? "" : "bg-blue-50 text-blue-700"}
    >
      {roleName || "N/A"}
    </Badge>
  );
}

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [tierFilter, setTierFilter] = useState(ALL_FILTER);
  const [emailFilter, setEmailFilter] = useState(ALL_FILTER);
  const [sortConfig, setSortConfig] = useState({
    key: "username",
    direction: "asc",
  });
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const { confirm } = useModal();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError("");
      const response = await axiosClient.get("/api/admin/users");
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching user list:", error);
      setFetchError("Unable to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    axiosClient
      .get("/api/admin/users")
      .then((response) => {
        if (isMounted) {
          setUsers(response.data || []);
          setFetchError("");
        }
      })
      .catch((error) => {
        console.error("Error fetching user list:", error);
        if (isMounted) {
          setFetchError("Unable to load users. Please try again.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleBan = async (userId, isCurrentlyBanned) => {
    if (updatingUserId) return;

    const actionText = isCurrentlyBanned ? "UNBAN" : "BAN";
    
    const confirmed = await confirm({
      title: "Confirm Action",
      message: `Are you sure you want to ${actionText} this user?`,
    });

    if (!confirmed) return;

    try {
      setUpdatingUserId(userId);
      await axiosClient.put(`/api/admin/users/${userId}/ban`);
      await fetchUsers();
      toast.success(`User ${actionText.toLowerCase()}ned successfully`);
    } catch (error) {
      console.error("Error toggling ban status:", error);
      toast.error("Error updating user status!");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set(users.map((user) => getRoleName(user)).filter(Boolean)),
      ).sort(),
    [users],
  );

  const tierOptions = useMemo(
    () =>
      Array.from(
        new Set(users.map((user) => user.subscriptionTier).filter(Boolean)),
      ).sort(),
    [users],
  );

  const summaryStats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => !user.banned).length,
      banned: users.filter((user) => user.banned).length,
      free: users.filter((user) => user.subscriptionTier === "FREE").length,
      pro: users.filter((user) => user.subscriptionTier === "PRO").length,
      verified: users.filter((user) => user.emailVerified).length,
      unverified: users.filter((user) => !user.emailVerified).length,
    }),
    [users],
  );

  const hasCreatedAt = useMemo(
    () => users.some((user) => Boolean(user.createdAt)),
    [users],
  );

  const hasDocumentSummary = useMemo(
    () => users.some((user) => hasValue(user.totalDocuments)),
    [users],
  );

  const hasAiSummary = useMemo(
    () => users.some((user) => hasValue(user.aiUsageToday)),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    const filtered = users.filter((user) => {
      const roleName = getRoleName(user);
      const tier = getTier(user);
      const matchesSearch =
        !keyword ||
        user.username?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword);
      const matchesRole = roleFilter === ALL_FILTER || roleName === roleFilter;
      const matchesStatus =
        statusFilter === ALL_FILTER ||
        (statusFilter === "BANNED" ? user.banned : !user.banned);
      const matchesTier = tierFilter === ALL_FILTER || tier === tierFilter;
      const matchesEmail =
        emailFilter === ALL_FILTER ||
        (emailFilter === "VERIFIED" ? user.emailVerified : !user.emailVerified);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesTier &&
        matchesEmail
      );
    });

    return [...filtered].sort((a, b) => {
      const first = getSortValue(a, sortConfig.key);
      const second = getSortValue(b, sortConfig.key);
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      if (typeof first === "number" && typeof second === "number") {
        return (first - second) * direction;
      }

      return String(first).localeCompare(String(second), undefined, {
        sensitivity: "base",
        numeric: true,
      }) * direction;
    });
  }, [
    emailFilter,
    roleFilter,
    searchQuery,
    sortConfig,
    statusFilter,
    tierFilter,
    users,
  ]);

  const filtersActive =
    Boolean(searchQuery.trim()) ||
    roleFilter !== ALL_FILTER ||
    statusFilter !== ALL_FILTER ||
    tierFilter !== ALL_FILTER ||
    emailFilter !== ALL_FILTER;

  const tableColumnCount =
    8 +
    (hasDocumentSummary ? 1 : 0) +
    (hasAiSummary ? 1 : 0) +
    (hasCreatedAt ? 1 : 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#f26522]" aria-hidden="true" />
            User Management
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Review account status, membership tier, and access restrictions.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {statConfig.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.key}
              className="rounded-2xl border-slate-100 bg-white shadow-sm"
            >
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {stat.title}
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-7 w-14 rounded-lg" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">
                      {numberFormatter.format(summaryStats[stat.key] || 0)}
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${stat.className}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100">
        <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-lg text-slate-700">
              Account List
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Showing {numberFormatter.format(filteredUsers.length)} of{" "}
              {numberFormatter.format(users.length)} users
            </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <label htmlFor="admin-user-search" className="sr-only">
                Search users by username or email
              </label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="admin-user-search"
                name="adminUserSearch"
                placeholder="Search by username or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-transparent focus-visible:ring-[#f26522]/20 focus-visible:border-[#f26522] rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="sr-only" htmlFor="admin-user-role-filter">
                Filter users by role
              </label>
              <select
                id="admin-user-role-filter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/20"
              >
                <option value={ALL_FILTER}>All roles</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="admin-user-status-filter">
                Filter users by account status
              </label>
              <select
                id="admin-user-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/20"
              >
                <option value={ALL_FILTER}>All status</option>
                <option value="ACTIVE">Active</option>
                <option value="BANNED">Banned</option>
              </select>
              <label className="sr-only" htmlFor="admin-user-tier-filter">
                Filter users by subscription tier
              </label>
              <select
                id="admin-user-tier-filter"
                value={tierFilter}
                onChange={(event) => setTierFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/20"
              >
                <option value={ALL_FILTER}>All tiers</option>
                {tierOptions.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="admin-user-email-filter">
                Filter users by email verification
              </label>
              <select
                id="admin-user-email-filter"
                value={emailFilter}
                onChange={(event) => setEmailFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/20"
              >
                <option value={ALL_FILTER}>All email</option>
                <option value="VERIFIED">Verified</option>
                <option value="UNVERIFIED">Unverified</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {fetchError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
              <AlertCircle
                className="mx-auto h-10 w-10 text-red-500"
                aria-hidden="true"
              />
              <h2 className="mt-3 text-base font-bold text-red-700">
                Could Not Load Users
              </h2>
              <p className="mt-1 text-sm text-red-600">{fetchError}</p>
              <Button
                type="button"
                onClick={fetchUsers}
                className="mt-4 rounded-xl bg-[#f26522] text-white hover:bg-[#d95316]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Retry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table className="min-w-[980px]">
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[56px] text-center font-bold">
                      No.
                    </TableHead>
                    <SortableHead
                      sortKey="username"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="min-w-[170px] font-bold"
                    >
                      Username
                    </SortableHead>
                    <SortableHead
                      sortKey="email"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="min-w-[220px] font-bold"
                    >
                      Email
                    </SortableHead>
                    <SortableHead
                      sortKey="role"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[120px] text-center font-bold"
                    >
                      Role
                    </SortableHead>
                    <SortableHead
                      sortKey="tier"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[110px] text-center font-bold"
                    >
                      Tier
                    </SortableHead>
                    <SortableHead
                      sortKey="verified"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[130px] text-center font-bold"
                    >
                      Verified
                    </SortableHead>
                    <SortableHead
                      sortKey="status"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[120px] text-center font-bold"
                    >
                      Status
                    </SortableHead>
                    {hasDocumentSummary && (
                      <SortableHead
                        sortKey="documents"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        className="w-[120px] text-center font-bold"
                      >
                        Docs
                      </SortableHead>
                    )}
                    {hasAiSummary && (
                      <SortableHead
                        sortKey="aiUsage"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        className="w-[130px] text-center font-bold"
                      >
                        AI Today
                      </SortableHead>
                    )}
                    {hasCreatedAt && (
                      <SortableHead
                        sortKey="createdAt"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        className="w-[140px] text-center font-bold"
                      >
                        Created
                      </SortableHead>
                    )}
                    <TableHead className="w-[190px] text-right font-bold pr-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-5 w-6 rounded-md" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32 rounded-md" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-48 rounded-md" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-6 w-20 rounded-full" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-6 w-16 rounded-full" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-6 w-24 rounded-full" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-6 w-20 rounded-full" />
                        </TableCell>
                        {hasDocumentSummary && (
                          <TableCell className="text-center">
                            <Skeleton className="mx-auto h-5 w-12 rounded-md" />
                          </TableCell>
                        )}
                        {hasAiSummary && (
                          <TableCell className="text-center">
                            <Skeleton className="mx-auto h-5 w-20 rounded-md" />
                          </TableCell>
                        )}
                        {hasCreatedAt && (
                          <TableCell className="text-center">
                            <Skeleton className="mx-auto h-5 w-24 rounded-md" />
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-8 w-28 rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={tableColumnCount}
                        className="py-12 text-center"
                      >
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                            <Users className="h-6 w-6" aria-hidden="true" />
                          </div>
                          <h2 className="mt-3 text-base font-bold text-slate-700">
                            {users.length === 0
                              ? "No Users Loaded"
                              : "No Matching Users"}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            {users.length === 0
                              ? "There are no accounts to manage yet."
                              : filtersActive
                                ? "Adjust the search or filters to find a user."
                                : "No users are available for this view."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-slate-50/50"
                      >
                        <TableCell className="font-medium text-center text-slate-500">{index + 1}</TableCell>
                        <TableCell className="font-semibold text-slate-700">
                          <div className="max-w-[180px] truncate">
                            {user.username || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          <div className="max-w-[240px] truncate">
                            {user.email || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <RoleBadge roleName={getRoleName(user)} />
                        </TableCell>
                        <TableCell className="text-center">
                          <TierBadge tier={getTier(user)} />
                        </TableCell>
                        <TableCell className="text-center">
                          <VerifiedBadge verified={user.emailVerified} />
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge banned={user.banned} />
                        </TableCell>
                        {hasDocumentSummary && (
                          <TableCell className="text-center text-sm font-semibold tabular-nums text-slate-600">
                            {hasValue(user.totalDocuments)
                              ? numberFormatter.format(user.totalDocuments)
                              : "N/A"}
                          </TableCell>
                        )}
                        {hasAiSummary && (
                          <TableCell className="text-center text-sm font-semibold tabular-nums text-slate-600">
                            {formatAiUsage(user)}
                          </TableCell>
                        )}
                        {hasCreatedAt && (
                          <TableCell className="text-center text-sm text-slate-500">
                            {formatDate(user.createdAt)}
                          </TableCell>
                        )}
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                              className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#f26522]"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                              View
                            </Button>
                            {getRoleName(user) !== "ADMIN" && (
                              <Button
                                size="sm"
                                variant={user.banned ? "outline" : "destructive"}
                                onClick={() => handleToggleBan(user.id, user.banned)}
                                disabled={updatingUserId === user.id}
                                className="flex items-center gap-2 rounded-lg"
                              >
                                {updatingUserId === user.id ? (
                                  <>
                                    <Loader2
                                      className="w-4 h-4 animate-spin"
                                      aria-hidden="true"
                                    />
                                    Updating
                                  </>
                                ) : user.banned ? (
                                  <>
                                    <Unlock className="w-4 h-4" aria-hidden="true" /> Unban
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-4 h-4" aria-hidden="true" /> Ban
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl border border-slate-100 bg-white p-0 shadow-2xl shadow-slate-900/10 overflow-hidden">
          {selectedUser && (
            <>
              <div className="bg-gradient-to-br from-orange-50 via-white to-slate-50 px-6 pt-6 pb-5">
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f26522] text-xl font-bold uppercase text-white shadow-lg shadow-orange-500/20">
                      {selectedUser.avatarUrl ? (
                        <img
                          src={selectedUser.avatarUrl}
                          alt={`${selectedUser.username || "User"} avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        selectedUser.username?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-xl font-black text-slate-900">
                        {selectedUser.username || "User Detail"}
                      </DialogTitle>
                      <DialogDescription className="mt-1 break-words text-sm text-slate-500">
                        {selectedUser.email || "No email available"}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="flex flex-wrap gap-2">
                  <RoleBadge roleName={getRoleName(selectedUser)} />
                  <TierBadge tier={getTier(selectedUser)} />
                  <VerifiedBadge verified={selectedUser.emailVerified} />
                  <StatusBadge banned={selectedUser.banned} />
                  {selectedUser.surveyCompleted !== undefined && (
                    <Badge
                      variant="outline"
                      className={
                        selectedUser.surveyCompleted
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }
                    >
                      {selectedUser.surveyCompleted
                        ? "Survey Completed"
                        : "Survey Pending"}
                    </Badge>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Created
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Calendar className="h-4 w-4 text-[#f26522]" aria-hidden="true" />
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Updated
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Calendar className="h-4 w-4 text-[#f26522]" aria-hidden="true" />
                      {formatDate(selectedUser.updatedAt)}
                    </p>
                  </div>
                </div>

                {selectedUser.profile && (
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Profile
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600">
                      {selectedUser.profile.schoolName && (
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">School</span>
                          <span className="text-right font-semibold text-slate-700">
                            {selectedUser.profile.schoolName}
                          </span>
                        </div>
                      )}
                      {selectedUser.profile.major && (
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Major</span>
                          <span className="text-right font-semibold text-slate-700">
                            {selectedUser.profile.major}
                          </span>
                        </div>
                      )}
                      {selectedUser.profile.startYear && (
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Start Year</span>
                          <span className="text-right font-semibold text-slate-700">
                            {selectedUser.profile.startYear}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(hasValue(selectedUser.totalDocuments) ||
                  hasValue(selectedUser.storageUsedBytes)) && (
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Documents
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Total</span>
                        <span className="text-right font-semibold text-slate-700">
                          {hasValue(selectedUser.totalDocuments)
                            ? numberFormatter.format(selectedUser.totalDocuments)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Public</span>
                        <span className="text-right font-semibold text-slate-700">
                          {hasValue(selectedUser.publicDocuments)
                            ? numberFormatter.format(selectedUser.publicDocuments)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Private</span>
                        <span className="text-right font-semibold text-slate-700">
                          {hasValue(selectedUser.privateDocuments)
                            ? numberFormatter.format(selectedUser.privateDocuments)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Storage Used</span>
                        <span className="text-right font-semibold text-slate-700">
                          {formatBytes(selectedUser.storageUsedBytes)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {hasValue(selectedUser.aiUsageToday) && (
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      AI Usage
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Today</span>
                        <span className="text-right font-semibold text-slate-700">
                          {formatAiUsage(selectedUser)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Remaining</span>
                        <span className="text-right font-semibold text-slate-700">
                          {selectedUser.aiRemainingToday === -1
                            ? "Unlimited"
                            : hasValue(selectedUser.aiRemainingToday)
                              ? numberFormatter.format(selectedUser.aiRemainingToday)
                              : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {Array.isArray(selectedUser.languages) &&
                  selectedUser.languages.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Languages
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedUser.languages.map((language) => (
                          <Badge
                            key={language.id || language.name}
                            variant="outline"
                            className="bg-orange-50 text-[#f26522] border-orange-100"
                          >
                            {language.name || language.code || "Language"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <DialogFooter className="px-6 pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-xl"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
