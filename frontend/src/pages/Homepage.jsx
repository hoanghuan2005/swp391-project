import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UploadCloud,
  GraduationCap,
  Tags,
  BookOpen,
  Download,
  Eye,
  FileText
} from "lucide-react";
import axiosClient from "@/api/axiosClient";

export default function Homepage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy danh sách tài liệu từ Backend
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get("/api/documents");
      // Lọc ra những tài liệu PUBLIC để hiển thị trên Home
      const publicDocs = response.data.filter(doc => doc.visibility === "PUBLIC");
      setDocuments(publicDocs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Hàm xử lý tải file (Tăng view và tải về máy)
  const handleDownload = async (id) => {
    try {
      const res = await axiosClient.get(`/api/documents/${id}/download`);
      let url = res.data.fileUrl;

      // Ép Cloudinary tự động tải file xuống
      if (url.includes("/upload/")) {
        url = url.replace("/upload/", "/upload/fl_attachment/");
      }

      window.open(url, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Error downloading document!");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[26px] font-bold text-slate-800 tracking-tight font-sans">
          ShareDocs — Knowledge Base
        </h2>
      </div>

      {/* Modal Upload (Giữ nguyên UI của bạn) */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Upload Document</DialogTitle>
            <DialogDescription>
              Share your knowledge. Fill out the specific areas so others can easily find it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-4 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex justify-center">
                <div className="p-3 bg-[#f26522]/10 rounded-full text-[#f26522]">
                  <UploadCloud size={32} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">PDF, DOCX, PPTX or Text files (max. 10MB)</p>
              </div>
            </div>
            {/* Các Input Fields */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <GraduationCap size={16} className="text-[#f26522]" /> School
              </Label>
              <Input placeholder="Enter your school name" className="rounded-lg focus-visible:ring-[#f26522]" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <BookOpen size={16} className="text-[#f26522]" /> Subject
              </Label>
              <Input placeholder="Enter subject code or name" className="rounded-lg focus-visible:ring-[#f26522]" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <Tags size={16} className="text-[#f26522]" /> Tags
              </Label>
              <Input placeholder="Enter tags, separated by comma" className="rounded-lg focus-visible:ring-[#f26522]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)} className="rounded-lg font-semibold cursor-pointer">
              Cancel
            </Button>
            <Button className="rounded-lg bg-[#f26522] hover:bg-[#d95316] text-white font-semibold cursor-pointer">
              Upload Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Danh sách tài liệu Public MỚI NHẤT */}
      <section className="mb-10">
        <h3 className="text-xl font-bold mb-4 text-slate-800 tracking-tight">
          Explore Public Documents
        </h3>
        
        {isLoading ? (
          <div className="text-center py-10 text-slate-500 font-medium">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl text-slate-500 border border-slate-100">
            No public documents available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
              >
                <CardContent className="p-4 flex-1 flex flex-col">
                  {/* Thumbnail ảo mờ mờ cho đẹp */}
                  <div className="w-full aspect-[4/3] bg-slate-50 rounded-xl mb-4 border border-slate-100 group-hover:border-[#f26522]/20 transition-colors flex items-center justify-center text-slate-300">
                    <FileText className="w-12 h-12" />
                  </div>
                  
                  <CardTitle className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1" title={doc.title}>
                    {doc.title || "Untitled Document"}
                  </CardTitle>
                  
                  <CardDescription className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> {doc.subjectCode || "General"}
                  </CardDescription>
                  
                  <div className="text-[11px] text-slate-400 mt-auto flex justify-between items-center">
                    <span>{new Date(doc.createdAt).toLocaleDateString("en-GB")}</span>
                    <span>{doc.downloadCount || 0} downloads</span>
                  </div>
                </CardContent>
                
                {/* Khu vực nút bấm */}
                <CardFooter className="px-4 pb-4 pt-0 mt-auto flex gap-2">
                  <Button
                    asChild
                    variant="secondary"
                    className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs rounded-xl h-9 cursor-pointer"
                  >
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                    </a>
                  </Button>
                  
                  <Button
                    onClick={() => handleDownload(doc.id)}
                    className="flex-1 bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white font-semibold text-xs rounded-xl h-9 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-16 text-center text-[13px] text-slate-400 font-medium pb-8 border-t border-gray-100 pt-8">
        © 2026 ShareDocs — Modern Document Sharing Platform
      </footer>
    </>
  );
}