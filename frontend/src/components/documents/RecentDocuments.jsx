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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

export default function RecentDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRecentDocuments(8);
      setDocuments(data);
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
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#f26522]" />
          <h2
            id="recent-docs-title"
            className="text-xl font-bold text-slate-800 tracking-tight"
          >
            Recently Viewed
          </h2>
        </div>

        <Link
          to="/my-library"
          className="text-sm font-medium text-[#f26522] hover:text-[#de5b0b] transition-colors flex items-center gap-1"
        >
          View all <ChevronRight className="w-4 h-4" />
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
