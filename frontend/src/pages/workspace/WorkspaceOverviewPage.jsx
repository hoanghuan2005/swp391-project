import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  Copy,
  Trash2,
  ArrowLeft,
  Eye,
  Calendar,
  BookOpen,
  ChevronLeft,
  Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProjectDetail, getSharedProject, removeDocumentFromProject } from "@/api/projectApi";
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
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import axiosClient from "@/api/axiosClient";
import { forceDownload } from "@/lib/downloadHelper";
import { getFileExtension } from "@/lib/utils";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";
import SelectExistingDocument from "@/components/documents/SelectExistingDocument";

export default function WorkspaceOverviewPage() {
  const { projectId, token } = useParams();
  const navigate = useNavigate();

  const isSharedView = !!token;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const data = isSharedView 
        ? await getSharedProject(token) 
        : await getProjectDetail(projectId);
      setProject(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load workspace data");
    } finally {
      setLoading(false);
    }
  }, [projectId, token, isSharedView]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleRemoveDocument = async (documentId, title) => {
    if (isSharedView) return;

    if (!window.confirm(`Are you sure you want to remove "${title}" from this workspace?`)) {
      return;
    }

    try {
      await removeDocumentFromProject(projectId, documentId);
      toast.success("Document removed from workspace");
      fetchProject();
    } catch (error) {
      console.error("Failed to remove document", error);
      toast.error("Failed to remove document");
    }
  };

  const handleDownload = async (id, title) => {
    try {
      const res = await axiosClient.get(`/api/documents/${id}/download`);
      const url = res.data.downloadUrl;
      if (url) {
        await forceDownload(url, title || "document");
      }
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Error downloading document!");
    }
  };

  const handleNavigateToAI = () => {
    if (isSharedView) {
      navigate(`/workspace/shared/${token}/ai`);
    } else {
      navigate(`/workspace/${project.id}/ai`);
    }
  };

  const copyShareLink = async () => {
    if (!project?.shareToken) return;
    const link = `${window.location.origin}/workspace/shared/${project.shareToken}`;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f26522]" />
      </div>
    );
  }

  const filteredDocuments = project?.documents?.filter((doc) => {
    const searchTarget = [
      doc.title,
      doc.description,
      doc.course?.code,
      doc.course?.name
    ].filter(Boolean).join(" ").toLowerCase();
    
    return searchTarget.includes((searchQuery || "").toLowerCase());
  }) || [];

  const getFileIconAndColor = (fileType) => {
    const type = (fileType || "").toLowerCase();
    if (type.includes("pdf")) {
      return { 
        icon: <FileText className="w-5 h-5 text-rose-500" />, 
        bg: "bg-rose-50 border-rose-100" 
      };
    }
    if (type.includes("doc") || type.includes("docx")) {
      return { 
        icon: <FileText className="w-5 h-5 text-blue-500" />, 
        bg: "bg-blue-50 border-blue-100" 
      };
    }
    if (type.includes("xls") || type.includes("xlsx")) {
      return { 
        icon: <FileText className="w-5 h-5 text-emerald-500" />, 
        bg: "bg-emerald-50 border-emerald-100" 
      };
    }
    if (type.includes("ppt") || type.includes("pptx")) {
      return { 
        icon: <FileText className="w-5 h-5 text-amber-500" />, 
        bg: "bg-amber-50 border-amber-100" 
      };
    }
    return { 
      icon: <FileText className="w-5 h-5 text-slate-500" />, 
      bg: "bg-slate-50 border-slate-100" 
    };
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1700px] w-full mx-auto py-4">
        {/* WORKSPACE HEADER */}
<div className="rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50/60 to-white overflow-hidden mb-6 shadow-sm transition-all px-2">
  <div className="p-7 px-8">
    
    {/* BREADCRUMB & BACK BUTTON */}
    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center -ml-1 rounded-full text-slate-450 hover:text-[#f66810] hover:bg-orange-50 transition-colors cursor-pointer shrink-0"
        title="Back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <Link
        to={isSharedView ? "#" : "/home"}
        className="hover:text-[#f66810] transition-colors font-medium"
      >
        {isSharedView ? "Shared Workspace" : "Workspace"}
      </Link>
      <span className="text-slate-300">/</span>
      <span className="text-[#f66810] font-semibold truncate max-w-[250px]">
        {project?.name}
      </span>
    </div>

    {/* MAIN CONTENT AREA */}
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
      
      {/* LEFT COLUMN: Icon + Title + Description + Badges */}
      <div className="flex items-start gap-4.5 flex-1 min-w-0">
        {/* ICON (Phóng to lên w-16 h-16) */}
        <div className="w-14 h-14 rounded-2xl bg-[#f66810] flex items-center justify-center text-white shadow-md shadow-orange-500/10 shrink-0">
          <FolderKanban className="w-8 h-8" />
        </div>

        {/* TEXT CONTENT */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            {/* TITLE (Phóng to lên text-3xl) */}
            <h1 className="text-2xl font-extrabold text-slate-850 tracking-tight leading-tight">
              {project?.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-2xl line-clamp-2">
              {project?.description || "No description provided for this workspace."}
            </p>
          </div>

          {/* STATS BADGES (To và rõ ràng hơn) */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <div className="flex items-center gap-2 bg-white border border-orange-100/90 rounded-full px-3.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <FileText className="w-4 h-4 text-[#f66810]" />
              <span>{project?.documents?.length || 0} documents</span>
            </div>

            <div className="flex items-center gap-2 bg-white border border-orange-100/90 rounded-full px-3.5 py-1 text-xs font-medium text-slate-650 shadow-sm">
              <Bot className="w-4 h-4 text-[#f66810]" />
              <span className="flex items-center gap-1.5">
                AI Ready 
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIONS & SEARCH (Gộp chung thành 1 hàng ngang cân đối) */}
      <div className="flex flex-col items-center gap-3 w-full xl:w-auto justify-start xl:justify-end shrink-0 pt-2 xl:pt-0">
        
        
<div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end shrink-0 pt-2 xl:pt-0">

        {/* BUTTONS GROUP (Chiều cao h-11, chữ text-sm) */}
        {!isSharedView && (
          <>
            <Button
              variant="outline"
              onClick={() => setShareOpen(true)}
              className="rounded-2xl border-orange-200/80 hover:bg-orange-50/40 h-11 px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all"
            >
              <Share2 className="w-4 h-4 mr-2 text-slate-500" />
              Share
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  className="rounded-2xl bg-orange-100/70 hover:bg-orange-200/70 text-[#f66810] h-11 px-5 text-sm font-bold border-0 outline-none focus:ring-0 cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-orange-100 bg-white text-slate-750 shadow-xl p-2 mt-1">
                <DropdownMenuItem
                  onClick={() => setIsUploadOpen(true)}
                  className="cursor-pointer rounded-xl hover:bg-orange-50 hover:text-[#f26522] font-semibold transition-colors p-3"
                >
                  <UploadCloud className="w-5 h-5 mr-2.5 text-[#f26522]" />
                  Upload new file
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsLibraryModalOpen(true)}
                  className="cursor-pointer rounded-xl hover:bg-orange-50 hover:text-[#f26522] font-semibold transition-colors p-3 mt-1"
                >
                  <Library className="w-5 h-5 mr-2.5 text-slate-455" />
                  Select from Library
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <Button
          onClick={handleNavigateToAI}
          className="rounded-2xl bg-[#f66810] hover:bg-[#de5b0b] text-white h-11 px-5 text-sm font-bold shadow-md shadow-orange-500/15 flex items-center cursor-pointer transition-all"
        >
          <Bot className="w-4 h-4 mr-2 animate-pulse" />
          AI Workspace
        </Button>
        </div>
        {/* SEARCH INPUT (Chiều cao h-11 đồng bộ) */}
        <div className="relative w-full sm:w-[260px] md:w-[469px] pt-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 rounded-2xl border-orange-200/60 bg-white focus-visible:ring-[#f66810] w-full text-sm shadow-sm"
          />
        </div>


        
      </div>

    </div>
  </div>
</div>
      </div>

      {/* Documents */}
      <div className="max-w-[1700px] w-full mx-auto">
        <div className="pb-3 border-b border-slate-200/60 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <Library className="w-5.5 h-5.5 text-[#f66810]" />
            <span>Workspace Documents</span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
              {filteredDocuments.length}
            </span>
          </h2>
        </div>

        <ScrollArea className="h-[600px] px-1">
          <div className="py-5 px-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4.5">
            {filteredDocuments.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-500 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                <FileText className="w-10 h-10 text-slate-350" />
                {searchQuery ? (
                  <p>No documents match "{searchQuery}"</p>
                ) : (
                  <p>No documents in this workspace yet.</p>
                )}
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
                >
                  <CardContent className="p-3.5 flex-1 flex flex-col">
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
                        
                        {/* Simulated lines decoration */}
                        <div className="mt-auto flex flex-col gap-1 opacity-50">
                          <div className="w-[90%] h-0.5 bg-slate-100 rounded-full" />
                          <div className="w-[70%] h-0.5 bg-slate-100 rounded-full" />
                        </div>
                      </div>

                      {!isSharedView && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveDocument(doc.id, doc.title);
                          }}
                          className="absolute top-1.5 right-1.5 w-7.5 h-7.5 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-200 flex items-center justify-center cursor-pointer bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white border-slate-100 opacity-0 group-hover:opacity-100"
                          title="Remove document from workspace"
                        >
                          <Trash2 className="w-4 h-4" />
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
                      <BookOpen className="w-3.5 h-3.5" />{" "}
                      {doc.course?.code || "General"}
                    </CardDescription>
                    <div className="text-[11px] text-slate-400 mt-auto flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-GB") : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5 text-slate-300" /> {doc.downloadCount || 0}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="-mt-5 px-3.5 py-2.5 flex gap-2">
                    <Button
                      onClick={() => {
                        if (isSharedView) {
                          toast.error("Anonymous views cannot inspect document files directly.");
                        } else {
                          navigate(`/documents/${doc.id}`);
                        }
                      }}
                      className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl h-9 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> View
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
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {!isSharedView && (
        <>
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

          <Dialog open={shareOpen} onOpenChange={setShareOpen}>
            <DialogContent className="sm:max-w-xl rounded-[28px] border-0 p-0 overflow-hidden">
              <div className="p-8">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-slate-800">
                    Share Workspace
                  </DialogTitle>
                </DialogHeader>

                <p className="text-slate-500 mt-3 leading-relaxed">
                  Invite friends to collaborate in this study workspace. Anyone with this link can view the documents and chat with the AI.
                </p>

                <div className="mt-8">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Secure Share URL
                  </p>

                  <div className="flex gap-3">
                    <Input
                      readOnly
                      value={project?.shareToken ? `${window.location.origin}/workspace/shared/${project.shareToken}` : "Generating link..."}
                      className="rounded-full h-12 bg-slate-50 border-slate-200 text-slate-600 focus-visible:ring-0"
                    />

                    <Button
                      onClick={copyShareLink}
                      className="rounded-full bg-[#f66810] hover:bg-[#de5b0b] h-12 px-6 min-w-[120px]"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}