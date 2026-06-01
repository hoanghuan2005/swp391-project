import React, { useState, useEffect, useCallback } from "react";
import { FolderPlus, Loader2, Search, CheckCircle2, LayoutDashboard } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyProjects, addDocumentToProject } from "@/api/projectApi";
import { cn } from "@/lib/utils";

export default function AddToProjectModal({ documentId, open, onOpenChange }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Could not load your workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProjects();
      setSelectedProjectId(null);
    }
  }, [open, fetchProjects]);

  const handleSave = async () => {
    if (!selectedProjectId || !documentId) return;

    try {
      setIsSaving(true);
      await addDocumentToProject(selectedProjectId, documentId);
      toast.success("Document added to workspace!");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add document:", error);
      toast.error("Failed to save to workspace");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Save to Study Workspace
            </DialogTitle>
            <DialogDescription>
              Select a workspace to add this document.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-2">
          <ScrollArea className="h-[300px] pr-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <LayoutDashboard className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm text-slate-500">No workspaces found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                      selectedProjectId === project.id
                        ? "bg-[#f26522]/10 border-[#f26522]/30 ring-2 ring-[#f26522]/10"
                        : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        selectedProjectId === project.id ? "bg-[#f26522] text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-800 text-sm truncate">
                          {project.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {project.documents?.length || 0} Documents
                        </p>
                      </div>
                    </div>
                    {selectedProjectId === project.id && (
                      <CheckCircle2 className="w-5 h-5 text-[#f26522] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <DialogFooter className="flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedProjectId || isSaving}
              className="flex-1 rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white font-semibold shadow-lg shadow-orange-100"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Project"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
