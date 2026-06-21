import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  FileText,
  ChevronRight,
  BookOpen,
  Heart,
  Eye,
  Download,
  Star,
} from "lucide-react";

import { getRecentDocuments } from "@/api/documentApi";
import { ScrollArea, ScrollAreaViewport, ScrollAreaScrollbar, Scroll } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import axiosClient from "@/api/axiosClient";
import { forceDownload } from "@/lib/downloadHelper";
import { getFileExtension } from "@/lib/utils";

export default function RecentDocuments({ favoritedIds = [], onToggleFavorite }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRecentDocuments(8);
      setDocuments(data || []);
    } catch (error) {
      console.error("Failed to fetch recent documents:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

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

  if (!loading && documents.length === 0) {
    return null;
  }

  return (
    <section className="mb-10" aria-labelledby="recent-docs-title">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#f26522]" />
            <h2
              id="recent-docs-title"
              className="text-xl font-bold text-slate-800 tracking-tight"
            >
              Recent Documents
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-7">
            The documents you have viewed recently
          </p>
        </div>

        <Link
          to="/my-library"
          className="text-sm font-medium text-[#f26522] hover:text-[#de5b0b] transition-colors flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-xl">
        <div className="flex w-max space-x-4 p-1 pb-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[275px] space-y-3">
                  <Skeleton className="h-[140px] w-full rounded-[20px]" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[180px]" />
                    <Skeleton className="h-3 w-[120px]" />
                  </div>
                </div>
              ))
            : documents.map((doc) => (
                <div key={doc.id} className="w-[275px]">
                  <Card className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white">
                    <CardContent className="p-4 flex-1 flex flex-col">
                      {/* Thumbnail */}
                      <div className="w-full aspect-[4/3] bg-slate-50 rounded-xl mb-3 -mt-4 border border-slate-200 group-hover:border-[#f26522]/20 transition-colors flex items-center justify-center text-slate-300">
                        <FileText className="w-12 h-12" />
                      </div>

                      <CardTitle
                        className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                        title={doc.title}
                      >
                        {doc.title || "Untitled Document"}
                      </CardTitle>

                      <div className="flex items-center justify-between mb-3">
                        <CardDescription className="text-xs text-slate-500 font-medium flex items-center gap-1.5 m-0">
                          <BookOpen className="w-3.5 h-3.5" />
                          {doc.course?.code || "General"}
                        </CardDescription>

                        {/* Rating Stars */}
                        <div className="flex items-center gap-1">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= Math.round(doc.averageRating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          {doc.reviewCount > 0 && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              ({doc.reviewCount})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 -mt-1 flex justify-between items-center">
                        <span>
                          {doc.lastViewedAt
                            ? new Date(doc.lastViewedAt).toLocaleDateString(
                                "en-GB",
                              )
                            : "Recently viewed"}
                        </span>

                        <span>{doc.downloadCount || 0} downloads</span>
                      </div>
                    </CardContent>

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
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Link>
                      </Button>

                      <Button
                        onClick={() => handleDownload(doc.id, doc.title)}
                        className="flex-1 bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white font-semibold text-xs rounded-xl h-9 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4.5">
          {documents.map((doc) => {
            const isFavorited = favoritedIds.includes(doc.id);
            return (
              <Card
                key={doc.id}
                className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
              >
                <CardContent className="p-3.5 flex-1 flex flex-col">
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-[4/3] bg-slate-50 rounded-xl mb-3 -mt-4 border border-slate-200 group-hover:border-[#f26522]/20 transition-colors flex items-center justify-center overflow-hidden">
                    {/* Simulated Paper Sheet */}
                    <div className="w-[85%] h-[80%] bg-white rounded-lg shadow-sm border border-slate-100 p-2.5 flex flex-col gap-1 transform rotate-1 group-hover:rotate-0 transition-transform duration-200 select-none overflow-hidden">
                      {/* Top bar representing header */}
                      <div className="flex items-center gap-1 pb-1 border-b border-slate-100/70">
                        <FileText className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-[9px] font-extrabold text-[#f26522] uppercase tracking-wider">
                          {getFileExtension(doc)}
                        </span>
                      </div>
                      
                      {/* Body showing document content snippet */}
                      <p className="text-[9.5px] text-slate-400 font-serif leading-relaxed line-clamp-3 text-left whitespace-normal break-words">
                        {doc.description || doc.title || "No description provided for this document. Open to view full study guide content."}
                      </p>
                      
                      {/* Simulated lines decoration if description is short */}
                      <div className="mt-auto flex flex-col gap-1 opacity-50">
                        <div className="w-[90%] h-0.5 bg-slate-100 rounded-full" />
                        <div className="w-[70%] h-0.5 bg-slate-100 rounded-full" />
                      </div>
                    </div>

                    {onToggleFavorite && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleFavorite(doc);
                        }}
                        className={`absolute top-1 right-1 w-7.5 h-7.5 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90 hover:scale-105 z-10 ${
                          isFavorited
                            ? "bg-red-50 text-red-500 border-red-100"
                            : "bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white border-slate-100"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`}
                        />
                      </button>
                    )}
                  </div>

                  <CardTitle
                    className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                    title={doc.title}
                  >
                    {doc.title || "Untitled Document"}
                  </CardTitle>

                  <CardDescription className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {doc.course?.code || "General"}
                  </CardDescription>

                  <div className="text-[11px] text-slate-400 mt-auto flex justify-between items-center">
                    <span>
                      {doc.lastViewedAt
                        ? new Date(doc.lastViewedAt).toLocaleDateString(
                            "en-GB",
                          )
                        : "Recently viewed"}
                    </span>

                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> {doc.downloadCount || 0}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="-mt-5 px-3.5 py-2.5 flex gap-2">
                  <Button
                    asChild
                    variant="secondary"
                    className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl h-9 cursor-pointer"
                  >
                    <Link to={`/documents/${doc.id}`}>
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Link>
                  </Button>

                  <Button
                    onClick={() => handleDownload(doc.id, doc.title)}
                    className="w-9 h-9 rounded-xl bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white flex items-center justify-center transition-colors shrink-0 p-0 cursor-pointer"
                    title="Download Document"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
