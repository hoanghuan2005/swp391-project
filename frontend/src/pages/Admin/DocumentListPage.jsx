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
import { Trash2, Eye, Search, Plus, FileText, Pencil } from "lucide-react";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";
import EditDocumentModal from "@/components/share/EditDocumentModal";
import { useModal } from "@/components/share/useModal";
import { toast } from "sonner";
import AdminToolbar from "@/components/admin/AdminToolbar";

const ALL_FILTER = "ALL";

export default function DocumentListPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState(ALL_FILTER);
  const [parseStatusFilter, setParseStatusFilter] = useState(ALL_FILTER);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { confirm } = useModal();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [editingDocId, setEditingDocId] = useState(null);

  useEffect(() => {
    axiosClient.get("/api/profile")
      .then((res) => setCurrentAdmin(res.data))
      .catch((err) => console.error("Error loading admin profile:", err));
  }, []);

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

  const columnsForExport = [
    { header: "Title", render: (item) => item.title || "" },
    { header: "Description", render: (item) => item.description || "" },
    { header: "File URL", render: (item) => item.fileUrl || "" },
    { header: "Visibility", render: (item) => item.visibility || "PUBLIC" },
    { header: "Uploaded By Email", render: (item) => item.uploadedBy?.email || "" },
  ];

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f26522]">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Document Management
            </h1>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Monitor, audit, and manage user-uploaded learning materials and files.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100">
        {/* Thanh công cụ (Toolbar) theo chuẩn Base CRUD của Leader */}
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <CardTitle className="text-lg text-slate-700 whitespace-nowrap shrink-0">
            All Documents
          </CardTitle>

          <div className="w-full pt-4">
            <AdminToolbar
              searchVal={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by title or course..."
              importUrl="/api/admin/documents/import"
              importMapping={{
                title: "Title",
                description: "Description",
                fileUrl: "File URL",
                visibility: "Visibility",
                uploadedByEmail: "Uploaded By Email"
              }}
              importRequiredFields={["title", "fileUrl", "uploadedByEmail"]}
              onImportSuccess={fetchDocuments}
              exportData={filteredDocuments}
              exportColumns={columnsForExport}
              exportFilename="documents_export.csv"
              activeFiltersCount={
                (visibilityFilter !== ALL_FILTER ? 1 : 0) +
                (parseStatusFilter !== ALL_FILTER ? 1 : 0)
              }
              onClearFilters={() => {
                setVisibilityFilter(ALL_FILTER);
                setParseStatusFilter(ALL_FILTER);
              }}
              filters={
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visibility</label>
                    <select
                      value={visibilityFilter}
                      onChange={(event) => setVisibilityFilter(event.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600 outline-none focus:border-[#f26522]/40 focus:ring-1 focus:ring-[#f26522]/20 cursor-pointer"
                    >
                      <option value={ALL_FILTER}>All visibility</option>
                      {visibilityOptions.map((visibility) => (
                        <option key={visibility} value={visibility}>
                          {visibility}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Status</label>
                    <select
                      value={parseStatusFilter}
                      onChange={(event) => setParseStatusFilter(event.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600 outline-none focus:border-[#f26522]/40 focus:ring-1 focus:ring-[#f26522]/20 cursor-pointer"
                    >
                      <option value={ALL_FILTER}>All AI status</option>
                      {parseStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              }
              onAddClick={() => setIsUploadDialogOpen(true)}
              addLabel="Add Document"
            />
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

                            {/* Nút Sửa (Edit - Chỉ hiển thị nếu tài liệu của chính Admin) */}
                            {currentAdmin?.id && doc.uploadedBy?.id && doc.uploadedBy.id === currentAdmin.id && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditingDocId(doc.id)}
                                className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                title="Edit Document"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}

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
      {editingDocId && (
        <EditDocumentModal
          open={Boolean(editingDocId)}
          documentId={editingDocId}
          onClose={() => setEditingDocId(null)}
          onSuccess={() => {
            setEditingDocId(null);
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
}
