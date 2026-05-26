import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  FileText,
  Share2,
  Bot,
  Plus,
  Search,
  Check,
  Loader2,
  UploadCloud,
  Library,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getProjectDetail } from "@/api/projectApi";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";
import SelectExistingDocument from "@/components/documents/SelectExistingDocument";

export default function WorkspaceOverviewPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      const data = await getProjectDetail(projectId);
      setProject(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    if (!project?.shareToken) return;
    const link = `${window.location.origin}/workspace/shared/${project.shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f26522]" />
      </div>
    );
  }

  const filteredDocuments = project?.documents?.filter((doc) =>
    (doc.title || doc.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen">
      <div className="rounded-[26px] border border-orange-100 bg-gradient-to-br from-[#fffaf7] to-[#fff4ec] shadow-sm mb-5 overflow-hidden">
        <div className="px-6 py-5">
          {/* TOP BAR */}
          <div className="flex items-center justify-between gap-4 mb-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[12px] text-slate-400">
              <Link
                to="/home"
                className="hover:text-[#f66810] transition-colors"
              >
                Workspace
              </Link>
              <span>/</span>
              <span className="text-[#f66810] font-medium truncate max-w-[220px]">
                {project?.name}
              </span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={copyShareLink}
                className="rounded-full border-orange-200 bg-white/70 hover:bg-orange-50 h-9 px-4 text-sm shadow-sm"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-1.5 text-green-500" />
                ) : (
                  <Share2 className="w-4 h-4 mr-1.5" />
                )}
                {copied ? "Copied" : "Share"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    className="rounded-full bg-orange-100 hover:bg-orange-200 text-[#f66810] h-9 px-4 text-sm shadow-sm outline-none ring-0 focus:ring-0"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Document
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-lg p-2">
                  <DropdownMenuItem
                    onClick={() => setIsUploadOpen(true)}
                    className="cursor-pointer rounded-lg hover:bg-orange-50 hover:text-[#f66810] font-medium text-slate-600 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Upload New File
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsLibraryModalOpen(true)}
                    className="cursor-pointer rounded-lg hover:bg-slate-50 font-medium text-slate-600 mt-1 transition-colors"
                  >
                    <Library className="w-4 h-4 mr-2 text-slate-400" />
                    Choose from Library
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => navigate(`/workspace/${project.id}/ai`)}
                className="rounded-full bg-[#f66810] hover:bg-[#de5b0b] h-9 px-4 text-sm shadow-sm"
              >
                <Bot className="w-4 h-4 mr-1.5" />
                AI Workspace
              </Button>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex items-center gap-4">
            {/* ICON */}
            <div className="w-14 h-14 rounded-2xl bg-[#f66810] flex items-center justify-center text-white shadow-sm shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>

            {/* INFO */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {project?.name}
                </h1>

                {/* STATS */}
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white/80 border border-orange-100 rounded-full px-3 py-1 text-xs text-slate-600">
                    <FileText className="w-3 h-3 text-[#f66810]" />
                    <span>{project?.documents?.length || 0} docs</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white/80 border border-orange-100 rounded-full px-3 py-1 text-xs text-slate-600">
                    <Bot className="w-3 h-3 text-[#f66810]" />
                    <span>AI Ready</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white/80 border border-orange-100 rounded-full px-3 py-1 text-xs text-slate-600">
                    <Share2 className="w-3 h-3 text-[#f66810]" />
                    <span>Shared</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-3xl line-clamp-2">
                {project?.description ||
                  "No description provided for this workspace."}
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-[360px] shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search documents in workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-10 rounded-full border-orange-100 bg-white/90 shadow-sm text-sm focus-visible:ring-[#f66810]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white">
        <div className="pt-2 border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            Workspace Documents
          </h2>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="p-6 grid gap-4">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                {searchQuery ? (
                  <p>No documents found matching "{searchQuery}"</p>
                ) : (
                  <p>No documents added to this workspace yet.</p>
                )}
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-[#f26522]/40 hover:bg-orange-50/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-700">{doc.title}</h3>
                    <p className="text-sm text-slate-400">
                      {doc.fileType || "PDF"}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    Open
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <UploadDocumentDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUploadSuccess={() => {
          fetchProject();
          toast.success("Document added to workspace!");
        }}
        targetProjectId={projectId}
      />

      <SelectExistingDocument
        open={isLibraryModalOpen}
        onOpenChange={setIsLibraryModalOpen}
        projectId={projectId}
        onSuccess={fetchProject}
      />
    </div>
  );
}