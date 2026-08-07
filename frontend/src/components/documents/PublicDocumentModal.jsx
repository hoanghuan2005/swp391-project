import { useEffect, useState } from "react";
import { Search, Loader2, FileText, Globe, CheckCircle2, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchPublicDocuments } from "@/api/documentApi";

export default function PublicDocumentModal({
  open,
  onOpenChange,
  userDocuments = [],
  alreadySelectedDocs = [],
  onAddPublicDocs,
  maxSelectedDocs = 2,
  onPreviewDocument,
}) {
  const [publicDocs, setPublicDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedDocs, setLocalSelectedDocs] = useState([]);

  useEffect(() => {
    if (!open) return;

    const loadPublicDocs = async () => {
      setLoading(true);
      try {
        const docs = await fetchPublicDocuments(0, 100);
        // Exclude user's own uploaded documents so they don't appear in public library
        const userDocIds = new Set(userDocuments.map((d) => d.id));
        const filtered = (docs || []).filter((d) => !userDocIds.has(d.id));
        setPublicDocs(filtered);

        // Pre-select any public docs that are already in selectedDocs
        const preSelected = filtered.filter((pd) =>
          alreadySelectedDocs.some((sd) => sd.id === pd.id),
        );
        setLocalSelectedDocs(preSelected);
      } catch (err) {
        console.error("Failed to load public documents:", err);
        toast.error("Failed to load public documents");
      } finally {
        setLoading(false);
      }
    };

    loadPublicDocs();
  }, [open, userDocuments, alreadySelectedDocs]);

  const handleToggleSelect = (doc) => {
    setLocalSelectedDocs((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      if (exists) {
        return prev.filter((d) => d.id !== doc.id);
      } else {
        // Calculate existing non-public selected docs + localSelectedDocs
        const userSelectedCount = alreadySelectedDocs.filter(
          (sd) => !publicDocs.some((pd) => pd.id === sd.id),
        ).length;

        if (userSelectedCount + prev.length >= maxSelectedDocs) {
          toast.error(`You can select at most ${maxSelectedDocs} document${maxSelectedDocs > 1 ? "s" : ""} total for AI context.`);
          return prev;
        }
        return [...prev, doc];
      }
    });
  };

  const handleConfirm = () => {
    onAddPublicDocs(localSelectedDocs);
    onOpenChange(false);
  };

  const filteredDocs = publicDocs.filter((doc) => {
    const title = (doc.title || doc.name || "").toLowerCase();
    const course = (doc.courseCode || doc.course?.code || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return title.includes(q) || course.includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col rounded-3xl bg-white border border-slate-100 shadow-2xl p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-[#f26522] border border-orange-100">
              <Globe className="w-4 h-4" />
            </span>
            Browse Public Library
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Search and add public study documents to your collection (Up to {maxPersonalDocs} total).
          </DialogDescription>
        </DialogHeader>

        {/* SEARCH INPUT */}
        <div className="mt-3 px-1 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, subject, or course code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-xs flex-1 text-slate-700 font-medium"
            />
          </div>
        </div>

        {/* DOCUMENT LIST */}
        <div className="flex-1 overflow-y-auto px-1 py-3 my-2 space-y-2 min-h-[240px]">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-xs text-[#f26522] gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading public library...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Globe className="w-8 h-8 opacity-30 mb-2 text-slate-400" />
              No public documents found
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = localSelectedDocs.some((d) => d.id === doc.id);
              const title = doc.title || doc.name || "Untitled Document";

              return (
                <div
                  key={doc.id}
                  onClick={() => handleToggleSelect(doc)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-orange-50/80 border-[#f26522]/40 ring-1 ring-[#f26522]/20"
                      : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-[#f26522] border-[#f26522] text-white"
                          : "bg-orange-50 border-orange-100 text-[#f26522]"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="font-semibold uppercase tracking-wider text-[#f26522]">
                          {doc.courseCode || doc.course?.code || "Public Study"}
                        </span>
                        <span>•</span>
                        <span>
                          Uploaded by {doc.uploadedBy?.username || "Community"}
                        </span>
                      </div>
                      {doc.description ? (
                        <p className="mt-1 text-[10px] text-slate-500 line-clamp-1 italic text-left">
                          {doc.description}
                        </p>
                      ) : (
                        <p className="mt-1 text-[10px] text-slate-400 line-clamp-1 italic text-left opacity-70">
                          No description available
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {onPreviewDocument && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewDocument(doc);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#f26522] hover:bg-orange-100 transition-colors cursor-pointer border border-transparent hover:border-orange-200"
                        title="Preview Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-[#f26522]" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300 hover:border-[#f26522]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="shrink-0 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold">
            {localSelectedDocs.length} public doc{localSelectedDocs.length !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-slate-200 font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-[#f26522] hover:bg-[#e05411] text-white font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
            >
              <Plus className="w-4 h-4" />
              Add Selected Documents
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
