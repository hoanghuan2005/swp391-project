import React, { useEffect, useState } from "react";
import { getDocumentReports, resolveDocumentReport } from "@/api/documentApi";
import { Link } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, ShieldAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ReportListPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      const res = await getDocumentReports();
      setReports(res.data);
    } catch (e) {
      toast.error("Failed to load reports list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);



  const handleResolve = async (reportId) => {
    try {
      await resolveDocumentReport(reportId, "RESOLVED");
      toast.success("Report resolved successfully!");
      loadReports();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const pendingReports = reports.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          Document Reports
        </h1>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-10 text-slate-500 font-medium">
              Loading reports list...
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium">
              No pending reports found!
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center font-bold">No.</TableHead>
                    <TableHead className="w-[20%] font-bold">Document</TableHead>
                    <TableHead className="w-[25%] font-bold">Reason</TableHead>
                    <TableHead className="w-[20%] font-bold">Reporter</TableHead>
                    <TableHead className="w-[20%] font-bold">Uploader</TableHead>
                    <TableHead className="text-right font-bold pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReports.map((report, index) => (
                    <TableRow key={report.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-center text-slate-500">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        <div className="max-w-[200px] truncate" title={report.documentTitle}>
                          <Link
                            to={`/admin/documents/${report.documentId}`}
                            className="text-slate-700 hover:text-[#f26522] transition-colors cursor-pointer"
                          >
                            {report.documentTitle || "Untitled"}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {report.reason}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        <div className="font-semibold">
                          {report.reporterId ? (
                            <Link
                              to={`/admin/users/${report.reporterId}`}
                              className="text-slate-700 hover:text-[#f26522] transition-colors cursor-pointer"
                            >
                              {report.reporterUsername || "User"}
                            </Link>
                          ) : (
                            report.reporterUsername || "User"
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{report.reporterEmail}</div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold">
                            {report.uploaderId ? (
                              <Link
                                  to={`/admin/users/${report.uploaderId}`}
                                  className="text-slate-700 hover:text-[#f26522] transition-colors cursor-pointer"
                              >
                                {report.uploaderUsername || "User"}
                              </Link>
                            ) : (
                              report.uploaderUsername || "User"
                            )}{" "}
                            {report.isUploaderBanned && (
                              <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0">
                                Banned
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{report.uploaderEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl h-8 text-xs font-semibold text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleResolve(report.id)}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Resolve
                          </Button>
                        </div>
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
