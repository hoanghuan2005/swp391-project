import React, { useState, useEffect } from "react";
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
import { Ban, Unlock, Users, Search, UserPlus } from "lucide-react"; 
import { useModal } from "@/components/share/useModal";
import { toast } from "sonner";

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); 
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
    fetchUsers();
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

  const filteredUsers = users.filter((user) =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-transparent focus-visible:ring-[#f26522]/20 focus-visible:border-[#f26522] rounded-xl"
              />
            </div>
            
            <Button className="bg-[#f26522] hover:bg-[#d9541a] text-white rounded-xl flex items-center gap-2 shadow-md shadow-[#f26522]/20 transition-all cursor-pointer">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
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
                    <TableHead className="w-[15%] text-center font-bold">Role</TableHead>
                    <TableHead className="w-[10%] text-center font-bold">Survey</TableHead>
                    <TableHead className="w-[10%] text-center font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold pr-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
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
                          {user.surveyCompleted ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Pending</Badge>
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