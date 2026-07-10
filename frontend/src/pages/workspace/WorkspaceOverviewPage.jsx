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
  BookOpen,
  ChevronLeft,
  Download,
  Users,
  UserPlus,
  Edit2,
  Mail,
  Globe,
  Link as LinkIcon,
  Eye,
  ChevronDown,
  Lock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getProjectDetail,
  getSharedProject,
  removeDocumentFromProject,
  updateProjectVisibility,
  updateProjectInfo,
  inviteMember,
  changeMemberRole,
  removeMember
} from "@/api/projectApi";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
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

  // Collaboration State
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);

  // Invite states (now inside Share popup)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VIEWER");
  const [inviting, setInviting] = useState(false);

  // Edit details states
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updatingInfo, setUpdatingInfo] = useState(false);

  // Share visibility state
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { type: "REMOVE_DOCUMENT" | "REMOVE_MEMBER", id, name }
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchProject = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = isSharedView 
        ? await getSharedProject(token) 
        : await getProjectDetail(projectId);
      setProject(data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to load workspace data");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId, token, isSharedView]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProject();
  }, [fetchProject]);

  // Set up background polling every 15 seconds to sync members/documents when tab is focused
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchProject(true);
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchProject]);

  // Derived role checks
  const currentUserRole = project?.currentUserRole;
  const isOwner = currentUserRole === "OWNER";
  const canEditInfo = currentUserRole === "OWNER" || currentUserRole === "EDITOR";
  const canModifyDocs = currentUserRole === "OWNER" || currentUserRole === "EDITOR";

  const handleRemoveDocument = (documentId, title) => {
    if (isSharedView) return;
    setConfirmTarget({ type: "REMOVE_DOCUMENT", id: documentId, name: title });
    setConfirmDialogOpen(true);
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

  // Visibility, details and invitations
  const handleUpdateVisibility = async (newVisibility) => {
    try {
      setUpdatingVisibility(true);
      const updated = await updateProjectVisibility(project.id, newVisibility);
      setProject(updated);
      toast.success(`Visibility updated to ${newVisibility}!`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update visibility");
    } finally {
      setUpdatingVisibility(false);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      setUpdatingInfo(true);
      const updated = await updateProjectInfo(project.id, editName, editDescription);
      setProject(updated);
      toast.success("Workspace details updated successfully!");
      setIsEditInfoOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update details");
    } finally {
      setUpdatingInfo(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      setInviting(true);
      await inviteMember(project.id, inviteEmail, inviteRole);
      toast.success("Invitation sent successfully!");
      setInviteEmail("");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await changeMemberRole(project.id, userId, newRole);
      toast.success("Member role updated!");
      fetchProject(true);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleRemoveMember = (userId, memberName) => {
    setConfirmTarget({ type: "REMOVE_MEMBER", id: userId, name: memberName });
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;
    setIsConfirming(true);
    try {
      if (confirmTarget.type === "REMOVE_DOCUMENT") {
        await removeDocumentFromProject(projectId, confirmTarget.id);
        toast.success("Document removed from workspace");
        fetchProject(true);
      } else if (confirmTarget.type === "REMOVE_MEMBER") {
        await removeMember(project.id, confirmTarget.id);
        toast.success("Member removed from workspace");
        fetchProject(true);
      }
    } catch (error) {
      console.error(`Failed to perform action ${confirmTarget.type}:`, error);
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setIsConfirming(false);
      setConfirmDialogOpen(false);
      setConfirmTarget(null);
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



  return (
    <div className="min-h-screen">
      <div className="max-w-[1700px] w-full mx-auto py-4">
        {/* WORKSPACE HEADER */}
        <div className="rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50/60 to-white overflow-hidden mb-6 shadow-sm transition-all px-2">
          <div className="p-7 px-8">
            
            {/* BREADCRUMB & BACK BUTTON & MEMBER CORNER */}
            <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
              <div className="flex items-center gap-2">
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

              {/* Members Button at the top-right corner */}
              {currentUserRole && (
                <button
                  onClick={() => setIsMembersOpen(true)}
                  className="flex items-center gap-1.5 px-4.5 py-2 rounded-full border border-orange-200/80 bg-white hover:bg-orange-50 text-slate-700 text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#f66810]" />
                  <span>Members ({project?.members?.length || 0})</span>
                </button>
              )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
              
              {/* LEFT COLUMN: Icon + Title + Description + Badges */}
              <div className="flex items-start gap-4.5 flex-1 min-w-0">
                {/* ICON */}
                <div className="w-14 h-14 rounded-2xl bg-[#f66810] flex items-center justify-center text-white shadow-md shadow-orange-500/10 shrink-0">
                  <FolderKanban className="w-8 h-8" />
                </div>

                {/* TEXT CONTENT */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center flex-wrap">
                    {/* TITLE */}
                    <h1 className="text-2xl font-extrabold text-slate-850 tracking-tight leading-tight">
                      {project?.name}
                    </h1>
                    {canEditInfo && (
                      <button
                        onClick={() => {
                          setEditName(project?.name || "");
                          setEditDescription(project?.description || "");
                          setIsEditInfoOpen(true);
                        }}
                        className="p-1.5 hover:bg-orange-100/50 rounded-xl text-slate-400 hover:text-[#f66810] transition-colors ml-2 cursor-pointer border-0"
                        title="Edit workspace details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-[360px] line-clamp-1 break-all break-words">
                    {project?.description || "No description provided for this workspace."}
                  </p>

                  {/* STATS BADGES */}
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <div className="flex items-center gap-2 bg-white border border-orange-100/90 rounded-full px-3.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                      <FileText className="w-4 h-4 text-[#f66810]" />
                      <span>{project?.documents?.length || 0} documents</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-orange-100/90 rounded-full px-3.5 py-1 text-xs font-medium text-slate-655 shadow-sm">
                      <Bot className="w-4 h-4 text-[#f66810]" />
                      <span className="flex items-center gap-1.5">
                        AI Ready 
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </span>
                    </div>

                    {project?.visibility && (
                      <div className="flex items-center gap-2 bg-white border border-orange-100/90 rounded-full px-3.5 py-1 text-xs font-medium text-slate-655 shadow-sm">
                        {project.visibility === "PRIVATE" ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Private</span>
                          </>
                        ) : project.visibility === "LINK_SHARED" ? (
                          <>
                            <LinkIcon className="w-3.5 h-3.5 text-[#f66810]" />
                            <span>Link Shared</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Public</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ACTIONS & SEARCH */}
              <div className="flex flex-col items-center gap-3 w-full xl:w-auto justify-start xl:justify-end shrink-0 pt-2 xl:pt-0">
                
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end shrink-0 pt-2 xl:pt-0">
                  {currentUserRole && (
                    <>
                      {/* Share Button */}
                      <Button
                        variant="outline"
                        onClick={() => setShareOpen(true)}
                        className="rounded-2xl border-orange-200/80 hover:bg-orange-50/40 h-11 px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all"
                      >
                        <Share2 className="w-4 h-4 mr-2 text-slate-500" />
                        Share
                      </Button>
                    </>
                  )}

                  {/* Add Document Dropdown */}
                  {canModifyDocs && !isSharedView && (
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
                  )}

                  {/* AI Workspace Button */}
                  {(!isSharedView || project?.visibility === "LINK_SHARED" || project?.visibility === "PUBLIC") && (
                    <Button
                      onClick={handleNavigateToAI}
                      className="rounded-2xl bg-[#f66810] hover:bg-[#de5b0b] text-white h-11 px-5 text-sm font-bold shadow-md shadow-orange-500/15 flex items-center cursor-pointer transition-all"
                    >
                      <Bot className="w-4 h-4 mr-2 animate-pulse" />
                      AI Workspace
                    </Button>
                  )}
                </div>

                {/* SEARCH INPUT */}
                <div className="relative w-full sm:w-[260px] md:w-[471px] pt-1">
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
          {/* Changed grid layout to grid-cols-4 */}
          <div className="py-5 px-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4.5">
            {filteredDocuments.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-500 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                <FileText className="w-10 h-10 text-slate-355" />
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
                        <div className="flex items-center gap-1 pb-1 border-b border-slate-100/70">
                          <FileText className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[9px] font-extrabold text-[#f26522] uppercase tracking-wider">
                            {getFileExtension(doc)}
                          </span>
                        </div>
                        
                        <p className="text-[9.5px] text-slate-400 font-serif leading-relaxed line-clamp-3 text-left whitespace-normal break-words">
                          {doc.description || doc.title || "No description provided for this document. Open to view full study guide content."}
                        </p>
                        
                        <div className="mt-auto flex flex-col gap-1 opacity-50">
                          <div className="w-[90%] h-0.5 bg-slate-100 rounded-full" />
                          <div className="w-[70%] h-0.5 bg-slate-100 rounded-full" />
                        </div>
                      </div>

                      {canModifyDocs && !isSharedView && (
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

          {/* Share & Visibility Modal (with nested Invite option) */}
          <Dialog open={shareOpen} onOpenChange={setShareOpen}>
            <DialogContent className="sm:max-w-xl rounded-[28px] border-0 p-0 overflow-hidden bg-white shadow-2xl">
              <div className="p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <Share2 className="w-7 h-7 text-[#f66810]" />
                    Share Workspace
                  </DialogTitle>
                </DialogHeader>

                <p className="text-slate-500 leading-relaxed text-sm">
                  Configure who can see and collaborate on this study workspace.
                </p>

                {/* 1. Nested Invite collaborator Panel (For OWNER only) */}
                {isOwner && (
                  <div className="border border-orange-100 bg-orange-50/20 rounded-2xl p-4.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4.5 h-4.5 text-[#f66810]" />
                      <h3 className="text-sm font-bold text-slate-800">Invite Collaborators</h3>
                    </div>
                    <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="email"
                          required
                          placeholder="collaborator@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="pl-9 h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold focus-visible:ring-[#f66810]"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-750 flex items-center justify-between gap-1.5 min-w-[95px] shadow-sm hover:bg-slate-50 cursor-pointer"
                          >
                            <span>{inviteRole === "EDITOR" ? "Editor" : "Viewer"}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 rounded-xl border-orange-100 bg-white text-slate-750 shadow-xl p-1.5 z-[100]">
                          <DropdownMenuItem
                            onClick={() => setInviteRole("EDITOR")}
                            className="cursor-pointer rounded-lg hover:bg-orange-50 hover:text-[#f66810] font-semibold transition-colors p-2 text-xs"
                          >
                            Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setInviteRole("VIEWER")}
                            className="cursor-pointer rounded-lg hover:bg-orange-50 hover:text-[#f66810] font-semibold transition-colors p-2 text-xs mt-0.5"
                          >
                            Viewer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        type="submit"
                        disabled={inviting}
                        className="rounded-xl bg-[#f66810] hover:bg-[#de5b0b] text-white h-10 px-4 text-xs font-bold flex items-center justify-center shrink-0 min-w-[80px]"
                      >
                        {inviting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Invite"
                        )}
                      </Button>
                    </form>
                  </div>
                )}

                {/* 2. Visibility Settings */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Workspace Access
                  </label>
                  {isOwner ? (
                    <div className="flex gap-3 items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={updatingVisibility}>
                          <Button
                            variant="outline"
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-750 text-sm font-semibold justify-between flex items-center hover:bg-slate-50 shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            <span className="flex items-center gap-2">
                              {project?.visibility === "PRIVATE" ? (
                                <>
                                  <Lock className="w-4 h-4 text-slate-500" />
                                  <span>Private (Only Owner & Members)</span>
                                </>
                              ) : project?.visibility === "LINK_SHARED" ? (
                                <>
                                  <LinkIcon className="w-4 h-4 text-[#f66810]" />
                                  <span>Link Shared (Anyone with link can view)</span>
                                </>
                              ) : (
                                <>
                                  <Globe className="w-4 h-4 text-emerald-500" />
                                  <span>Public (Anyone can search & view)</span>
                                </>
                              )}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-80 rounded-2xl border-orange-100 bg-white text-slate-750 shadow-xl p-2 z-[100]">
                          <DropdownMenuItem
                            onClick={() => handleUpdateVisibility("PRIVATE")}
                            className="cursor-pointer rounded-xl hover:bg-orange-50 hover:text-[#f66810] font-semibold transition-colors p-2 flex items-center gap-3"
                          >
                            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="flex flex-col text-left">
                              <span className="text-sm">Private</span>
                              <span className="text-[11px] text-slate-450 font-normal">Only Owner & designated members can access</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateVisibility("LINK_SHARED")}
                            className="cursor-pointer rounded-xl hover:bg-orange-50 hover:text-[#f66810] font-semibold transition-colors p-2 flex items-center gap-3 mt-1"
                          >
                            <LinkIcon className="w-4 h-4 text-[#f66810] shrink-0" />
                            <div className="flex flex-col text-left">
                              <span className="text-sm">Link Shared</span>
                              <span className="text-[11px] text-slate-450 font-normal">Anyone with the link can view the workspace</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateVisibility("PUBLIC")}
                            className="cursor-pointer rounded-xl hover:bg-orange-50 hover:text-[#f66810] font-semibold transition-colors p-2 flex items-center gap-3 mt-1"
                          >
                            <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div className="flex flex-col text-left">
                              <span className="text-sm">Public</span>
                              <span className="text-[11px] text-slate-450 font-normal">Any logged in user can search and view</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {updatingVisibility && <Loader2 className="w-5 h-5 animate-spin text-[#f66810] shrink-0" />}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-600 font-medium">
                      {project?.visibility === "PRIVATE" ? (
                        <>
                          <Lock className="w-4 h-4 text-slate-500" />
                          <span>Private (Only Owner & Members)</span>
                        </>
                      ) : project?.visibility === "LINK_SHARED" ? (
                        <>
                          <LinkIcon className="w-4 h-4 text-[#f66810]" />
                          <span>Link Shared (Anyone with link can view)</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4 text-emerald-500" />
                          <span>Public (Anyone can search & view)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Share Link Generation */}
                {(project?.visibility === "LINK_SHARED" || project?.visibility === "PUBLIC") && (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4 text-[#f66810]" />
                      Secure Share URL
                    </p>

                    <div className="flex gap-3">
                      <Input
                        readOnly
                        value={project?.shareToken ? `${window.location.origin}/workspace/shared/${project.shareToken}` : "Generating link..."}
                        className="rounded-xl h-12 bg-slate-50 border-slate-200 text-slate-600 focus-visible:ring-0 text-sm font-medium"
                      />

                      <Button
                        onClick={copyShareLink}
                        className="rounded-xl bg-[#f66810] hover:bg-[#de5b0b] h-12 px-6 min-w-[120px] font-bold text-white shadow-sm"
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
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Members List Modal */}
          <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
            <DialogContent className="sm:max-w-xl rounded-[28px] border-0 p-0 overflow-hidden bg-white shadow-2xl">
              <div className="p-8">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-7 h-7 text-[#f66810]" />
                    Workspace Members
                  </DialogTitle>
                </DialogHeader>

                <p className="text-slate-500 mt-2 leading-relaxed text-sm">
                  Collaborators currently joined in this workspace.
                </p>

                <div className="mt-6">
                  <ScrollArea className="max-h-[350px] pr-2">
                    <div className="space-y-4">
                      {project?.members?.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.username} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-[#f66810] border border-orange-200">
                                {(member.username || member.email || "M").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">
                                {member.username || "Anonymous Collaborator"}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isOwner && member.role !== "OWNER" ? (
                              <>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 justify-between min-w-[85px] shadow-sm cursor-pointer"
                                    >
                                      <span>{member.role === "EDITOR" ? "Editor" : "Viewer"}</span>
                                      <ChevronDown className="w-3 h-3 text-slate-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-28 rounded-xl border-orange-100 bg-white text-slate-750 shadow-xl p-1.5 z-[100]">
                                    <DropdownMenuItem
                                      onClick={() => handleChangeRole(member.userId, "EDITOR")}
                                      className="cursor-pointer rounded-lg hover:bg-orange-50 hover:text-[#f66810] font-semibold transition-colors p-2 text-xs"
                                    >
                                      Editor
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleChangeRole(member.userId, "VIEWER")}
                                      className="cursor-pointer rounded-lg hover:bg-orange-50 hover:text-[#f66810] font-semibold transition-colors p-2 text-xs mt-0.5"
                                    >
                                      Viewer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <button
                                  onClick={() => handleRemoveMember(member.userId, member.username || member.email)}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors border-0 cursor-pointer"
                                  title="Remove collaborator"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100/75 text-[#f66810]">
                                {member.role}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Details Modal */}
          <Dialog open={isEditInfoOpen} onOpenChange={setIsEditInfoOpen}>
            <DialogContent className="sm:max-w-md rounded-[28px] border-0 p-0 overflow-hidden bg-white shadow-2xl">
              <form onSubmit={handleUpdateInfo} className="p-8">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <Edit2 className="w-6 h-6 text-[#f66810]" />
                    Edit Workspace Details
                  </DialogTitle>
                </DialogHeader>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                      Workspace Name
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Organic Chemistry Study Group"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#f66810]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter a description of this workspace..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-755 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f66810] resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditInfoOpen(false)}
                    className="rounded-xl h-11 font-semibold text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatingInfo}
                    className="rounded-xl bg-[#f66810] hover:bg-[#de5b0b] text-white h-11 px-6 font-bold shadow-md shadow-orange-500/10 flex items-center justify-center min-w-[120px]"
                  >
                    {updatingInfo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl bg-white border border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                <Trash2 className="w-5 h-5" />
              </span>
              Xác nhận gỡ bỏ
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-2">
              {confirmTarget?.type === "REMOVE_DOCUMENT"
                ? `Bạn có chắc chắn muốn gỡ bỏ tài liệu "${confirmTarget?.name}" khỏi workspace này?`
                : `Bạn có chắc chắn muốn gỡ bỏ thành viên "${confirmTarget?.name}" khỏi workspace này?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              disabled={isConfirming}
              onClick={() => setConfirmDialogOpen(false)}
              className="rounded-xl border-slate-200 font-semibold cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              disabled={isConfirming}
              onClick={handleConfirmAction}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer border-none"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gỡ...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}