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
import { Ban, Unlock } from "lucide-react";

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy danh sách user từ backend
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

  // Xử lý khóa/mở khóa tài khoản
  const handleToggleBan = async (userId, isCurrentlyBanned) => {
    const actionText = isCurrentlyBanned ? "UNBAN" : "BAN";
    
    // Xác nhận trước khi thực hiện
    if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) {
      return;
    }

    try {
      await axiosClient.put(`/api/admin/users/${userId}/ban`);
      fetchUsers(); // Load lại data
    } catch (error) {
      console.error("Error toggling ban status:", error);
      alert("Error updating user status!");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-800">
        User Management
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Account List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-slate-500">Loading data...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Chia tỉ lệ và căn lề cho các cột */}
                    <TableHead className="w-[50px] text-center">No.</TableHead>
                    <TableHead className="w-[20%]">Username</TableHead>
                    <TableHead className="w-[25%]">Email</TableHead>
                    <TableHead className="w-[15%] text-center">Role</TableHead>
                    <TableHead className="w-[10%] text-center">Survey</TableHead>
                    <TableHead className="w-[10%] text-center">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-center">{index + 1}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={user.role?.name === "ADMIN" ? "destructive" : "default"}
                        >
                          {user.role?.name || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.surveyCompleted ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-500">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.banned ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Banned</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Ẩn nút khóa nếu là ADMIN */}
                        {user.role?.name !== "ADMIN" && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant={user.banned ? "outline" : "destructive"}
                              onClick={() => handleToggleBan(user.id, user.banned)}
                              className="flex items-center gap-2 transition-all cursor-pointer"
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}