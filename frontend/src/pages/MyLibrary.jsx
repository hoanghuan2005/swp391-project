import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axiosClient from "@/api/axiosClient";
import { FileText, Download, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { forceDownload } from "@/lib/downloadHelper";

export default function MyLibrary() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUploads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/api/documents/my-uploads");
      setUploads(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load uploads", error);
      setUploads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUploads();

    const handleUploaded = () => fetchUploads();
    window.addEventListener("documents:uploaded", handleUploaded);

    return () => {
      window.removeEventListener("documents:uploaded", handleUploaded);
    };
  }, [fetchUploads]);

  const handleDownload = async (id, title) => {
    try {
      // 1. Gọi API Backend để tăng lượt download
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

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this document? This action cannot be undone.",
      )
    )
      return;
    try {
      await axiosClient.delete(`/api/documents/${id}`);
      setUploads(uploads.filter((doc) => doc.id !== id));
      alert("Document deleted successfully!");
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document.");
    }
  };

  return (
    <div className="space-y-9 m-1">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">My Uploads</h2>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading uploads...</p>
        ) : uploads.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
            You have not uploaded any documents yet.
          </div>
        ) : (
          <div className="space-y-0">
            {uploads.map((doc, index) => (
              <React.Fragment key={doc.id}>
                <div className="flex items-start justify-between gap-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f26522]/10 text-[#f26522]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {doc.title || "Untitled document"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {doc.course?.name || doc.course?.code || "No course"}
                      </p>
                      {doc.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {doc.tags.map((tag) => (
                            <Badge
                              key={
                                typeof tag === "string"
                                  ? tag
                                  : tag.id || tag.name
                              }
                              variant="secondary"
                              className="rounded-full bg-slate-100 text-slate-600"
                            >
                              {typeof tag === "string" ? tag : tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.id && (
                      <>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        >
                          <Link to={`/documents/${doc.id}`}>
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Link>
                        </Button>

                        <Button
                          onClick={() => handleDownload(doc.id, doc.title)}
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs text-[#f26522] border-[#f26522]/20 hover:bg-[#f26522] hover:text-white cursor-pointer transition-all"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> Download
                        </Button>

                        <Button
                          onClick={() => handleDelete(doc.id)}
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {index < uploads.length - 1 && (
                  <Separator className="bg-slate-100" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      <Separator className="bg-slate-100" />

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-slate-800">My Quiz</h2>
        <p className="text-sm text-slate-500">You have no quizzes yet.</p>
      </section>

      <Separator className="bg-slate-100" />

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-slate-800">My Flashcard</h2>
        <p className="text-sm text-slate-500">You have no flashcards yet.</p>
      </section>

      <Separator className="bg-slate-100" />

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-slate-800">My Notes</h2>
        <p className="text-sm text-slate-500">You have no notes yet.</p>
      </section>
    </div>
  );
}
