import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forceDownload } from "@/lib/downloadHelper";
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
  FileText,
  Heart,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import RecentDocuments from "@/components/documents/RecentDocuments";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";

export default function Homepage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/courses", {
        params: {
          t: Date.now(),
        },
      });

      setCourses(response.data?.content || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    }
  }, []);

  // Lấy danh sách tài liệu từ Backend
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await axiosClient.get("/api/documents", {
        params: {
          t: Date.now(),
        },
      });

      const publicDocs = (response.data || []).filter(
        (doc) => doc.visibility === "PUBLIC",
      );

      setDocuments(publicDocs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchCourses();

    const handleUploaded = async () => {
      await fetchDocuments();
    };

    window.addEventListener("documents:uploaded", handleUploaded);

    return () => {
      window.removeEventListener("documents:uploaded", handleUploaded);
    };
  }, [fetchDocuments, fetchCourses]);

  // Hàm xử lý tải file (Tăng view và tải về máy)
  const handleDownload = async (id, title) => {
    try {
      const res = await axiosClient.get(`/api/documents/${id}/download`);
      const url = res.data.downloadUrl;
      if (url) {
        await forceDownload(url, title || "document");
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Error downloading document!");
    }
  };

  return (
    <>
      <main className="flex-1">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[26px] font-bold text-slate-800 tracking-tight font-sans">
            ShareDocs — Knowledge Base
          </h2>
        </div>

        <RecentDocuments />

        <UploadDocumentDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUploadSuccess={(newDoc) => {
            setDocuments((prev) => [newDoc, ...prev]);
          }}
        />

        {/* Danh sách tài liệu Public MỚI NHẤT */}
        <section className="mb-10">
          <h3 className="text-xl font-bold mb-4 text-slate-800 tracking-tight">
            Explore Public Documents
          </h3>

          {isLoading ? (
            <div className="text-center text-slate-500 font-medium">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center bg-slate-50 rounded-2xl text-slate-500 border border-slate-100">
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
                    <div className="w-full aspect-[4/3] bg-slate-50 rounded-xl mb-3 -mt-4 border border-slate-200 group-hover:border-[#f26522]/20 transition-colors flex items-center justify-center text-slate-300">
                      <FileText className="w-12 h-12" />
                    </div>

                    <CardTitle
                      className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                      title={doc.title}
                    >
                      {doc.title || "Untitled Document"}
                    </CardTitle>

                    <CardDescription className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />{" "}
                      {doc.course?.code || "General"}
                    </CardDescription>

                    <div className="text-[11px] text-slate-400 -mt-1 flex justify-between items-center">
                      <span>
                        {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                      </span>
                      <span>{doc.downloadCount || 0} downloads</span>
                    </div>
                  </CardContent>

                  {/* Khu vực nút bấm */}
                  <CardFooter className="-mt-3 px-4 py-3 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => alert("Added to favorites")}
                      className="flex-none px-2.5 rounded-xl border-slate-200 text-slate-500 hover:text-[#f22222] hover:bg-[#f22222]/10 transition-colors cursor-pointer h-9"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>

                    <Button
                      asChild
                      variant="secondary"
                      className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs rounded-xl h-9 cursor-pointer"
                    >
                      <Link to={`/documents/${doc.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                      </Link>
                    </Button>

                    <Button
                      onClick={() => handleDownload(doc.id, doc.title)}
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

        {/* COURSES SECTION */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                Courses
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Explore documents by course
              </p>
            </div>

            <Button variant="outline" className="rounded-xl border-slate-200">
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="group"
              >
                <Card className="rounded-xl border border-slate-100 hover:shadow-sm transition-all overflow-hidden h-full flex flex-col">
                  {/* Banner */}
                  <div className="-mt-4 h-22 bg-gradient-to-r from-[#f26522]/10 to-orange-100 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-[#f26522]" />
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between -mt-2">
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">
                          {course.code}
                        </h4>

                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {course.name}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 -mb-3 flex items-center justify-between text-xs text-slate-400">
                      <span>{course.documentCount || 0} documents</span>

                      <span className="border px-2 py-1 rounded-full group-hover:text-[#f26522] transition-colors">
                        Open
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="text-center text-[13px] text-slate-400 font-medium border-t border-gray-100 py-6 -mb-6">
        © 2026 ShareDocs — Modern Document Sharing Platform
      </footer>
    </>
  );
}
