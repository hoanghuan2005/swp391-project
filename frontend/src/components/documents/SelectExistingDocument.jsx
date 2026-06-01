import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, Loader2, Check } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import useDocuments from "@/hooks/useDocuments";
import { toast } from "react-hot-toast";

export default function SelectExistingDocumentModal({
  open,
  onOpenChange,
  projectId, // Optional: if provided, works as multi-select project linker
  onSuccess, // Passes data back to parent component upon completion
}) {
  const { documents, loading, refreshDocuments } = useDocuments();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [isLinking, setIsLinking] = useState(false);

  // If projectId is missing, we are using this modal as a single-file picker (e.g., for Quizzes)
  const isSelectionOnlyMode = !projectId;

  // Fetch user's existing documents when the modal opens
  useEffect(() => {
    if (open) {
      refreshDocuments();
      setSelectedDocIds([]); // Reset selection on open
      setSearchQuery("");
    }
  }, [open]);

  const toggleSelection = (docId) => {
    setSelectedDocIds((prev) => {
      if (isSelectionOnlyMode) {
        // Single selection behavior: clicking toggles or replaces
        return prev.includes(docId) ? [] : [docId];
      } else {
        // Multi selection behavior (original project workspace logic)
        return prev.includes(docId)
          ? prev.filter((id) => id !== docId)
          : [...prev, docId];
      }
    });
  };

  const handleAction = async () => {
    if (selectedDocIds.length === 0) {
      toast.error("Please select a document.");
      return;
    }

    if (isSelectionOnlyMode) {
      // Flow for AI Quiz Generator: Just return the document object back to the form
      const chosenDoc = documents.find((d) => d.id === selectedDocIds[0]);
      if (onSuccess && chosenDoc) {
        onSuccess(chosenDoc);
      }
      onOpenChange(false);
    } else {
      // Flow for Workspace Page: Run the bulk project-linking API loop
      setIsLinking(true);
      try {
        for (const docId of selectedDocIds) {
          await axiosClient.post(
            `/api/projects/${projectId}/documents/${docId}`,
          );
        }
        toast.success("Documents successfully added to workspace!");
        if (onSuccess) onSuccess();
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to link documents", error);
        toast.error(
          "Failed to add some documents. They might already be in this workspace.",
        );
      } finally {
        setIsLinking(false);
      }
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    (doc.title || doc.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Choose from Library
          </DialogTitle>
          <DialogDescription>
            {isSelectionOnlyMode
              ? "Select a document from your library to generate an AI quiz."
              : "Select existing documents from your library to add to this workspace."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200"
            />
          </div>

          <ScrollArea className="h-[300px] border border-slate-100 rounded-xl bg-slate-50/50 overflow-hidden">
            <div className="p-2">
              {loading ? (
                <div className="flex justify-center items-center h-[280px]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#f26522]" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No documents found.
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredDocuments.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => toggleSelection(doc.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#f26522] bg-orange-50/50"
                            : "border-transparent hover:border-slate-200 hover:bg-white"
                        }`}
                      >
                        {/* Custom Radio / Checkbox UI */}
                        <div
                          className={`w-5 h-5 flex items-center justify-center shrink-0 transition-colors ${
                            isSelectionOnlyMode ? "rounded-full" : "rounded"
                          } ${
                            isSelected
                              ? "bg-[#f26522] border-[#f26522]"
                              : "border-2 border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          )}
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-700 text-sm truncate">
                            {doc.title}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {doc.fileType || "Document"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-10 font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={isLinking || selectedDocIds.length === 0}
            className="rounded-xl h-10 bg-[#f26522] hover:bg-[#de5b0b] text-white font-bold px-6"
          >
            {isLinking && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isSelectionOnlyMode
              ? "Select Document"
              : `Add (${selectedDocIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
