import React, { useMemo, useState, useEffect } from "react";
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
import { Ban, Unlock, Users, Search } from "lucide-react";
import { useModal } from "@/components/share/useModal";
import { toast } from "sonner";

const ALL_FILTER = "ALL";

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [tierFilter, setTierFilter] = useState(ALL_FILTER);
  const [emailFilter, setEmailFilter] = useState(ALL_FILTER);
  const { confirm } = useModal();

  const fetchUsers = async () => {
    try {
      const response = await axiosClient.get("/api/admin/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching user list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    axiosClient
      .get("/api/admin/users")
      .then((response) => {
        if (isMounted) setUsers(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user list:", error);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleBan = async (userId, isCurrentlyBanned) => {
    const actionText = isCurrentlyBanned ? "UNBAN" : "BAN";
    
    const confirmed = await confirm({
      title: "Confirm Action",
      message: `Are you sure you want to ${actionText} this user?`,
    });

    if (!confirmed) return;

    try {
      await axiosClient.put(`/api/admin/users/${userId}/ban`);
      fetchUsers();
      toast.success(`User ${actionText.toLowerCase()}ned successfully`);
    } catch (error) {
      console.error("Error toggling ban status:", error);
      toast.error("Error updating user status!");
    }
  };

  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set(users.map((user) => user.role?.name).filter(Boolean)),
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

  const filteredUsers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const roleName = user.role?.name || "N/A";
      const tier = user.subscriptionTier || "N/A";
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
  }, [emailFilter, roleFilter, searchQuery, statusFilter, tierFilter, users]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
          <Users className="w-8 h-8 text-[#f26522]" />
          User Management
        </h1>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100">
        
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <CardTitle className="text-lg text-slate-700">Account List</CardTitle>
          
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-transparent focus-visible:ring-[#f26522]/20 focus-visible:border-[#f26522] rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <select
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
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/20"
              >
                <option value={ALL_FILTER}>All status</option>
                <option value="ACTIVE">Active</option>
                <option value="BANNED">Banned</option>
              </select>
              <select
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
              <select
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
          {isLoading ? (
            <div className="text-center py-10 text-slate-500 font-medium">Loading data...</div>
          ) : (
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center font-bold">No.</TableHead>
                    <TableHead className="w-[20%] font-bold">Username</TableHead>
                    <TableHead className="w-[25%] font-bold">Email</TableHead>
                    <TableHead className="w-[12%] text-center font-bold">Role</TableHead>
                    <TableHead className="w-[10%] text-center font-bold">Tier</TableHead>
                    <TableHead className="w-[12%] text-center font-bold">Verified</TableHead>
                    <TableHead className="w-[10%] text-center font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold pr-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-center text-slate-500">{index + 1}</TableCell>
                        <TableCell className="font-semibold text-slate-700">{user.username}</TableCell>
                        <TableCell className="text-slate-600">{user.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={user.role?.name === "ADMIN" ? "destructive" : "default"}>
                            {user.role?.name || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              user.subscriptionTier === "PRO"
                                ? "bg-orange-50 text-[#f26522] border-orange-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            }
                          >
                            {user.subscriptionTier || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.emailVerified ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {user.banned ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Banned</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          {user.role?.name !== "ADMIN" && (
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant={user.banned ? "outline" : "destructive"}
                                onClick={() => handleToggleBan(user.id, user.banned)}
                                className="flex items-center gap-2 transition-all cursor-pointer rounded-lg"
                              >
                                {user.banned ? (
                                  <>
                                    <Unlock className="w-4 h-4" /> Unban
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-4 h-4" /> Ban User
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
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
    </div>
  );
}
