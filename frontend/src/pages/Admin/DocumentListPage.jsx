import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { Trash2, Eye, Search, Plus, FileText } from "lucide-react";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";
import { useModal } from "@/components/share/useModal";
import { toast } from "sonner";

const ALL_FILTER = "ALL";

export default function DocumentListPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState(ALL_FILTER);
  const [parseStatusFilter, setParseStatusFilter] = useState(ALL_FILTER);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { confirm } = useModal();

  // Lấy danh sách tài liệu từ Backend
  const fetchDocuments = async () => {
    try {
      const response = await axiosClient.get("/api/admin/documents");
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    axiosClient
      .get("/api/admin/documents")
      .then((response) => {
        if (isMounted) setDocuments(response.data);
      })
      .catch((error) => {
        console.error("Error fetching documents:", error);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Xử lý xóa tài liệu
  const handleDelete = async (id, title) => {
    const confirmed = await confirm({
      title: "Delete Document",
      message: `Are you sure you want to delete the document: "${title}"?`,
    });

    if (!confirmed) return;

    try {
      await axiosClient.delete(`/api/admin/documents/${id}`);
      fetchDocuments(); // Tải lại danh sách sau khi xóa
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document!");
    }
  };

  const visibilityOptions = useMemo(
    () =>
      Array.from(
        new Set(documents.map((doc) => doc.visibility).filter(Boolean)),
      ).sort(),
    [documents],
  );

  const parseStatusOptions = useMemo(
    () =>
      Array.from(
        new Set(documents.map((doc) => doc.aiParseStatus).filter(Boolean)),
      ).sort(),
    [documents],
  );

  // Tính năng tìm kiếm trên Frontend (Lọc theo tên hoặc mã môn)
  const filteredDocuments = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return documents.filter((doc) => {
      const matchesSearch =
        !keyword ||
        doc.title?.toLowerCase().includes(keyword) ||
        doc.course?.code?.toLowerCase().includes(keyword) ||
        doc.course?.name?.toLowerCase().includes(keyword);
      const matchesVisibility =
        visibilityFilter === ALL_FILTER || doc.visibility === visibilityFilter;
      const matchesParseStatus =
        parseStatusFilter === ALL_FILTER ||
        doc.aiParseStatus === parseStatusFilter;

      return matchesSearch && matchesVisibility && matchesParseStatus;
    });
  }, [documents, parseStatusFilter, searchQuery, visibilityFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#f26522]" />
          Document Management
        </h1>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100">
        {/* Thanh công cụ (Toolbar) theo chuẩn Base CRUD của Leader */}
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <CardTitle className="text-lg text-slate-700">
            All Documents
          </CardTitle>

          <div className="flex flex-col gap-3 w-full lg:w-auto">
            {/* Ô tìm kiếm */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by title or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-transparent focus-visible:ring-[#f26522]/20 focus-visible:border-[#f26522] rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={visibilityFilter}
                onChange={(event) => setVisibilityFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/20"
              >
                <option value={ALL_FILTER}>All visibility</option>
                {visibilityOptions.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {visibility}
                  </option>
                ))}
              </select>
              <select
                value={parseStatusFilter}
                onChange={(event) => setParseStatusFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/20"
              >
                <option value={ALL_FILTER}>All AI status</option>
                {parseStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {/* Nút Thêm mới */}
              <Button
                className="bg-[#f26522] hover:bg-[#d9541a] text-white rounded-xl flex items-center gap-2 shadow-md shadow-[#f26522]/20 transition-all cursor-pointer"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Add New
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="text-center py-10 text-slate-500 font-medium">
              Loading documents...
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center font-bold">
                      No.
                    </TableHead>
                    <TableHead className="w-[25%] font-bold">Title</TableHead>
                    <TableHead className="w-[15%] text-center font-bold">
                      Course Code
                    </TableHead>
                    <TableHead className="w-[15%] text-center font-bold">
                      Visibility
                    </TableHead>
                    <TableHead className="w-[14%] text-center font-bold">
                      AI Status
                    </TableHead>
                    <TableHead className="w-[10%] text-center font-bold">
                      Downloads
                    </TableHead>
                    <TableHead className="w-[12%] text-center font-bold">
                      Date
                    </TableHead>
                    <TableHead className="text-right font-bold pr-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-slate-500"
                      >
                        No documents found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc, index) => (
                      <TableRow
                        key={doc.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="font-medium text-center text-slate-500">
                          {index + 1}
                        </TableCell>

                        <TableCell className="font-semibold text-slate-700">
                          {doc.title || "Untitled Document"}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-600 border-blue-200"
                          >
                            {doc.course?.code || "N/A"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          {doc.visibility === "PUBLIC" ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-600 border-green-200"
                            >
                              Public
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-slate-100 text-slate-600 border-slate-200"
                            >
                              Private
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              doc.aiParseStatus === "READY"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : doc.aiParseStatus === "FAILED"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : doc.aiParseStatus === "PENDING"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                            }
                          >
                            {doc.aiParseStatus || "N/A"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center text-sm font-semibold text-slate-600">
                          {doc.downloadCount ?? 0}
                        </TableCell>

                        <TableCell className="text-center text-sm text-slate-500">
                          {doc.createdAt
                            ? new Date(doc.createdAt).toLocaleDateString(
                                "en-GB",
                              )
                            : "N/A"}
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            {/* Nút Xem (View) */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-500 hover:text-[#f26522] hover:bg-[#f26522]/10 rounded-lg cursor-pointer transition-colors"
                              title="View Document"
                              asChild
                            >
                              <Link to={`/admin/documents/${doc.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>

                            {/* Nút Xóa (Delete) */}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(doc.id, doc.title)}
                              className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
      <UploadDocumentDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadSuccess={fetchDocuments}
      />
    </div>
  );
}
