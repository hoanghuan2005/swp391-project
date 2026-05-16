import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FileText } from "lucide-react";
import axiosClient from "../../api/axiosClient"; 

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubjects: 0,
    totalDocuments: 0,
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
      <h1 className="text-3xl font-bold tracking-tight text-slate-800">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Users
            </CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {isLoading ? "..." : stats.totalUsers}
            </div>
          </CardContent>
        </Card>

        {/* Total Subjects Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Subjects
            </CardTitle>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {isLoading ? "..." : stats.totalSubjects}
            </div>
          </CardContent>
        </Card>

        {/* Total Documents Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Documents
            </CardTitle>
            <FileText className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {isLoading ? "..." : stats.totalDocuments}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}