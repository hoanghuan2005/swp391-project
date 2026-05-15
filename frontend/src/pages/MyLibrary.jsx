import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axiosClient from "@/api/axiosClient";
import { FileText } from "lucide-react";

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
                        {doc.subject?.name || doc.subject?.code || "No subject"}
                      </p>
                      {doc.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {doc.tags.map((tag) => (
                            <Badge
                              key={tag.id || tag.name}
                              variant="secondary"
                              className="rounded-full bg-slate-100 text-slate-600"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {doc.fileUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full text-xs"
                    >
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </Button>
                  )}
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
