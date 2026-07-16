import React, { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Sparkles,
  Heart,
  Layers,
} from "lucide-react";
import { toast } from "react-hot-toast"; // Đã thêm import toast
import axiosClient from "@/api/axiosClient";
import useDocuments from "@/hooks/useDocuments";
import useMaterialPublish from "@/hooks/useMaterialPublish";
import useStudyTimer from "@/hooks/useStudyTimer";

const formatSessionTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mStr = m.toString().padStart(2, "0");
  const sStr = s.toString().padStart(2, "0");
  if (h > 0) {
    return `${h}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
};
import FlashcardItem from "./FlashcardItem";
import AISidebar from "@/components/ai-sidebar/sidebar/AISidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AIGeneratorInput from "@/components/ai-sidebar/AIGeneratorInput";
import AIToolHeader from "@/components/ai-sidebar/AIToolHeader";
import FlashcardEditor from "./FlashcardEditor";
import { Input } from "@/components/ui/input";
import {
  generateFlashcards,
  generateFlashcardsFromDocument,
  getFlashcardSet,
  getFlashcardSets,
  updateFlashcardSet,
  deleteFlashcardSet,
  renameFlashcardSet,
} from "@/api/flashcardApi";
import AiUsageBadge from "@/components/ai-usage/AiUsageBadge";
import useAiUsage from "@/hooks/useAiUsage";
import { isAiQuotaExceeded } from "@/api/aiUsageApi";

export default function AIFlashcardGenerator({ contextData }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useStudyTimer(setElapsedSeconds);
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeSetTitle, setActiveSetTitle] = useState(
    "Generate AI Flashcards"
  );

  const [searchParams] = useSearchParams();
  const setIdParam = searchParams.get("id");
  const modeParam = searchParams.get("mode");

  useEffect(() => {
    if (setIdParam) {
      loadFlashcardSet(setIdParam);
    }
  }, [setIdParam]);

  // State Tracking
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTrackingProgress, setIsTrackingProgress] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // State Like Flashcard
  const [isLiked, setIsLiked] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [setToRename, setSetToRename] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const fileInputRef = useRef(null);

  const [flashcardHistory, setFlashcardHistory] = useState([]);
  const { documents: uploadedDocuments, refreshDocuments } = useDocuments();
  const {
    subscriptionTier,
    remainingUsage,
    loading: aiUsageLoading,
    refreshAiUsage,
  } = useAiUsage();

  const { publish, loading: publishing } = useMaterialPublish();

  const VIEW_MODE = {
    GENERATE: "GENERATE",
    PREVIEW: "PREVIEW",
    STUDY: "STUDY",
  };

  const [viewMode, setViewMode] = useState(VIEW_MODE.GENERATE);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [publishCourseId, setPublishCourseId] = useState("");

  useEffect(() => {
    if (contextData && contextData.id) {
      loadFlashcardSet(contextData.id);
    }
  }, [contextData]);

  // Đồng bộ trạng thái Like khi load Flashcard
  useEffect(() => {
    if (selectedFlashcardSet) {
      setIsLiked(selectedFlashcardSet.isFavorite || false);
    } else {
      setIsLiked(false);
    }
  }, [selectedFlashcardSet]);

  const fetchSidebarData = async () => {
    try {
      const historyResponse = await getFlashcardSets();
      setFlashcardHistory(historyResponse || []);
      const historyData = await getFlashcardSets();
      setFlashcardHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error("Sidebar fetch error:", error);
    }
  };

  useEffect(() => {
    fetchSidebarData();
  }, []);

  const loadFlashcardSet = async (setId) => {
    try {
      setIsGenerating(true);
      const data = await getFlashcardSet(setId);
      setActiveSetTitle(data.title);
      setFlashcards(data.flashcards || []);
      setSelectedFlashcardSet(data);
      if (modeParam === "study") {
        setViewMode(VIEW_MODE.STUDY);
      } else {
        setViewMode(VIEW_MODE.PREVIEW);
      }
      const savedPercent = localStorage.getItem(`flashcard_progress_${setId}`);
      if (savedPercent) {
        const percent = parseInt(savedPercent, 10);
        const idx = Math.min(Math.floor((percent / 100) * (data.flashcards?.length || 0)), (data.flashcards?.length || 1) - 1);
        setCurrentIndex(isNaN(idx) || idx < 0 ? 0 : idx);
        setIsCompleted(percent === 100);
      } else {
        resetProgress();
      }
    } catch (error) {
      console.error("Load set error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectFlashcardSet = (set) => {
    setSelectedFlashcardSet(set);
    if (set && set.id) loadFlashcardSet(set.id);
  };

  const handleDeleteFlashcardSet = (e, id) => {
    e.stopPropagation();
    setSetToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteFlashcardSet = async () => {
    if (!setToDelete) return;
    try {
      await deleteFlashcardSet(setToDelete);
      toast.success("Flashcard set deleted successfully");
      setFlashcardHistory((prev) => prev.filter((s) => s.id !== setToDelete));
      if (selectedFlashcardSet?.id === setToDelete) {
        setSelectedFlashcardSet(null);
        setFlashcards([]);
        setViewMode(VIEW_MODE.GENERATE);
      }
    } catch (error) {
      console.error("Failed to delete flashcard set:", error);
      toast.error("Failed to delete flashcard set");
    } finally {
      setDeleteConfirmOpen(false);
      setSetToDelete(null);
    }
  };

  const handleEditFlashcardSetClick = (e, set) => {
    e.stopPropagation();
    setSetToRename(set);
    setNewTitle(set.title);
    setRenameDialogOpen(true);
  };

  const handleRenameFlashcardSet = async () => {
    if (!setToRename || !newTitle.trim()) return;
    setIsRenaming(true);
    try {
      const updatedSet = await renameFlashcardSet(setToRename.id, newTitle.trim());
      toast.success("Flashcard set renamed successfully!");
      setFlashcardHistory((current) =>
        current.map((s) =>
          s.id === setToRename.id ? { ...s, title: newTitle.trim() } : s
        )
      );
      if (selectedFlashcardSet?.id === setToRename.id) {
        setActiveSetTitle(newTitle.trim());
        setSelectedFlashcardSet((prev) => ({ ...prev, title: newTitle.trim() }));
      }
      setRenameDialogOpen(false);
    } catch (error) {
      console.error("Failed to rename flashcard set:", error);
      toast.error(error.response?.data?.message || "Failed to rename flashcard set.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedFlashcardSet?.id) return;

    setIsSaving(true);
    try {
      const updatedSet = await updateFlashcardSet(selectedFlashcardSet.id, {
        title: activeSetTitle,
        flashcards,
      });
      const updatedSet = response;
      setFlashcards(updatedSet.flashcards || []);
      setActiveSetTitle(updatedSet.title);
      setSelectedFlashcardSet((current) => ({ ...current, ...updatedSet }));
      setFlashcardHistory((current) =>
        current.map((set) =>
          set.id === updatedSet.id
            ? {
                ...set,
                title: updatedSet.title,
                cards: updatedSet.flashcards?.length || 0,
              }
            : set
        )
      );
      toast.success("Flashcard draft saved successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save flashcard draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!selectedFlashcardSet?.id) return;

    setIsSaving(true);
    try {
      const updatedSet = await updateFlashcardSet(selectedFlashcardSet.id, {
        title: activeSetTitle,
        flashcards,
        savedToLibrary: true,
      });
      const updatedSet = response;
      setFlashcards(updatedSet.flashcards || []);
      setActiveSetTitle(updatedSet.title);
      setSelectedFlashcardSet((current) => ({ ...current, ...updatedSet }));
      setFlashcardHistory((current) =>
        current.map((set) =>
          set.id === updatedSet.id
            ? {
                ...set,
                title: updatedSet.title,
                cards: updatedSet.flashcards?.length || 0,
              }
            : set
        )
      );
      toast.success("Saved to Library successfully!");
      fetchSidebarData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save to Library.");
    } finally {
      setIsSaving(false);
    }
  };

  // Hàm xử lý Like
  const handleLikeFlashcard = async () => {
    if (!selectedFlashcardSet || !selectedFlashcardSet.id) {
      toast.error("Please save the flashcard set first!");
      return;
    }
    
    try {
      await axiosClient.post(`/api/ai_flashcard/${selectedFlashcardSet.id}/favorite`);
      setIsLiked(!isLiked);
      if (!isLiked) {
        toast.success("Added to favorites!");
      } else {
        toast.success("Removed from favorites!");
      }
    } catch (error) {
      console.error("Like error:", error);
      toast.error("Failed to update favorite status!");
    }
  };

  useEffect(() => {
    if (publishDialogOpen && courses.length === 0) {
      axiosClient
        .get("/api/courses/all")
        .then((res) => setCourses(res.data))
        .catch((err) => console.error("Failed to load courses", err));
    }
  }, [publishDialogOpen, courses.length]);

  // Derive detected course from the selected flashcard set's source document
  const detectedCourse = selectedFlashcardSet?.documentCourseId
    ? {
        id: selectedFlashcardSet.documentCourseId,
        name: selectedFlashcardSet.documentCourseName,
        code: selectedFlashcardSet.documentCourseCode,
      }
    : null;

  const handleCreateFlashcardSet = () => {
    setSelectedFlashcardSet(null);
    setFlashcards([]);
    setInputText("");
    setFile(null);
    setSelectedDoc(null);
    setActiveSetTitle("Generate AI Flashcards");
    setIsCompleted(false);
    setViewMode(VIEW_MODE.GENERATE);
  };

  const handlePublishClick = () => {
    if (!selectedFlashcardSet || !selectedFlashcardSet.id) {
      toast.error("Please save or select a generated set first before publishing.");
      return;
    }

    if (detectedCourse) {
      // Smart publish: document belongs to a course — show confirmation
      setPublishCourseId(detectedCourse.id);
      setPublishConfirmOpen(true);
    } else {
      // No course detected — show course selection dropdown
      setPublishCourseId("");
      setPublishDialogOpen(true);
    }
  };

  const handlePublish = async () => {
    const courseId = publishCourseId || null;

    try {
      await publish({
        type: "FLASHCARD",
        id: selectedFlashcardSet.id,
        courseId,
        visibility: "PUBLIC",
      });
      toast.success("Flashcard set published successfully!");
      setPublishDialogOpen(false);
      setPublishConfirmOpen(false);
    } catch (e) {
      toast.error("Failed to publish flashcard set.");
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!inputText && !file && !selectedDoc) return;
    setIsGenerating(true);
    try {
      let result;
      if (selectedDoc) {
        result = await generateFlashcardsFromDocument(selectedDoc.id);
      } else {
        const formData = new FormData();
        if (file) formData.append("document", file);
        if (inputText) formData.append("text", inputText);
        result = await generateFlashcards(formData);
      }
      await refreshAiUsage();
      if (Array.isArray(result) || result.id) {
        setFlashcards(result.flashcards || result);
        if (result.id) {
          setSelectedFlashcardSet(result);
          const rawTitle = selectedDoc?.title || file?.name || "New Generated Set";
          const formattedTitle = rawTitle.startsWith("Flashcard: ") ? rawTitle : `Flashcard: ${rawTitle}`;
          setFlashcardHistory((prev) => [
            {
              id: result.id,
              title: formattedTitle,
              cards: result.flashcards?.length || result.length || 0,
            },
            ...prev,
          ]);
        }

        const rawTitle = selectedDoc?.title || file?.name || "New Generated Set";
        setActiveSetTitle(rawTitle.startsWith("Flashcard: ") ? rawTitle : `Flashcard: ${rawTitle}`);

        resetProgress();
        setViewMode(VIEW_MODE.PREVIEW);
        fetchSidebarData();
        try {
          await refreshDocuments();
        } catch {
          /* ignore */
        }
      } else {
        toast.error("Data returned is not correct!");
      }
    } catch (error) {
      console.error(error);
      if (isAiQuotaExceeded(error)) {
        toast.error(
          error.response?.data?.message || "Daily AI request limit reached."
        );
        await refreshAiUsage();
      } else {
        toast.error("Error generating flashcards!");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setViewMode(VIEW_MODE.GENERATE);
    setFlashcards([]);
    setInputText("");
    setFile(null);
    setSelectedDoc(null);
    setSelectedFlashcardSet(null);
    setActiveSetTitle("Generate AI Flashcards");
    setCurrentIndex(0);
    setIsCompleted(false);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSelectedDoc(null);
    }
  };

  const handleSelectDocument = (doc) => {
    setSelectedDoc(doc);
    setFile(null);
    setInputText("");
  };

  const resetProgress = () => {
    setCurrentIndex(0);
    setIsCompleted(false);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) setCurrentIndex((p) => p + 1);
    else setIsCompleted(true);
  };

  const handlePrev = () => {
    if (isCompleted) setIsCompleted(false);
    else setCurrentIndex((p) => Math.max(0, p - 1));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (flashcards.length > 0) {
        if (e.key === "ArrowRight") handleNext();
        else if (e.key === "ArrowLeft") handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isCompleted, flashcards.length]);

  useEffect(() => {
    if (selectedFlashcardSet?.id && flashcards.length > 0) {
      const percentage = isCompleted ? 100 : Math.round((currentIndex / flashcards.length) * 100);
      localStorage.setItem(`flashcard_progress_${selectedFlashcardSet.id}`, percentage.toString());
    }
  }, [currentIndex, isCompleted, selectedFlashcardSet, flashcards]);

  return (
    <div className="h-[calc(100vh-68px)] overflow-hidden bg-white shadow-sm -mx-8 -my-6">
      <div className="flex h-full">
        <AISidebar
          type="flashcard"
          histories={flashcardHistory}
          documents={uploadedDocuments}
          selectedItem={selectedFlashcardSet}
          selectedDoc={selectedDoc}
          onSelectItem={handleSelectFlashcardSet}
          onDeleteItem={handleDeleteFlashcardSet}
          onEditItem={handleEditFlashcardSetClick}
          onCreate={handleCreateFlashcardSet}
          onSelectDocument={handleSelectDocument}
          searchDocQuery={searchQuery}
          setSearchDocQuery={setSearchQuery}
          fileInputRef={fileInputRef}
          handleUpload={handleFileSelect}
          isUploading={false}
        />

        <div className="relative flex-1 overflow-y-auto bg-slate-50/50">
          <div className="mx-auto max-w-5xl px-6 py-8">
            {isGenerating && flashcards.length === 0 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#f26522]" />
                <p className="font-medium text-slate-600">
                  Loading your study set...
                </p>
              </div>
            )}
            <AIToolHeader
              icon={Layers}
              title="AI Flashcards Generator"
              description="Create flashcards to enhance your learning and retention."
              rightElement={
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#f26522] bg-orange-50 border border-orange-100 rounded-xl px-2.5 py-1">
                    <span>⏱️ {formatSessionTime(elapsedSeconds)}</span>
                  </div>
                  <AiUsageBadge
                    subscriptionTier={subscriptionTier}
                    remainingUsage={remainingUsage}
                    loading={aiUsageLoading}
                  />
                </div>
              }
            />

            {/* Generate View */}
            {viewMode === VIEW_MODE.GENERATE && (
              <AIGeneratorInput
                value={inputText}
                onChange={setInputText}
                placeholder="Paste your lesson content..."
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                activeDocument={selectedDoc || file}
                clearDocument={() => {
                  setFile(null);
                  setSelectedDoc(null);
                }}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                disabled={!inputText && !file && !selectedDoc}
              />
            )}

            {/* Preview */}
            {viewMode === VIEW_MODE.PREVIEW && (
              <div className="space-y-5">
                <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-[#fffaf7] to-[#fff3eb] overflow-hidden mb-5">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        onClick={() => setViewMode(VIEW_MODE.GENERATE)}
                        className="text-slate-500 hover:text-[#f26522] -ml-2 rounded-xl"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <div className="rounded-2xl bg-orange-100 px-4 py-1.5 text-orange-700 backdrop-blur">
                        <span className="text-sm font-medium">Draft</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#f66810] flex items-center justify-center text-white shadow-sm shrink-0">
                        <Layers className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div>
                          <Input
                            value={activeSetTitle}
                            onChange={(event) =>
                              setActiveSetTitle(event.target.value)
                            }
                            className="h-11 rounded-xl text-2xl font-bold"
                            aria-label="Flashcard set title"
                          />
                          <p className="mt-1 text-sm text-slate-500">
                            {flashcards.length} flashcards generated successfully
                          </p>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-5">
                          <div className="flex flex-wrap gap-3">
                            <Button
                              variant="outline"
                              className="rounded-full border-orange-200 hover:bg-orange-50 h-9 px-4 text-sm cursor-pointer"
                              onClick={handleSaveDraft}
                              disabled={isSaving || !selectedFlashcardSet?.id}
                            >
                              {isSaving && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Save Draft
                            </Button>

                            <Button
                              variant="outline"
                              className="rounded-full border-orange-200 hover:bg-orange-50 h-9 px-4 text-sm cursor-pointer"
                              onClick={() => setViewMode(VIEW_MODE.STUDY)}
                            >
                              Start Study
                            </Button>

                            <Button
                              className="rounded-full bg-orange-100 hover:bg-orange-200 h-9 px-4 text-sm text-orange-700 cursor-pointer font-semibold"
                              onClick={handleSaveToLibrary}
                              disabled={isSaving || !selectedFlashcardSet?.id}
                            >
                              {isSaving && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Save to Library
                            </Button>

                            <Button
                              className="rounded-full bg-[#f26522] hover:bg-[#d95316] h-9 px-4 text-sm text-white cursor-pointer shadow-sm font-semibold"
                              onClick={handlePublishClick}
                              disabled={publishing}
                            >
                              {publishing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Publish Material
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <FlashcardEditor cards={flashcards} setCards={setFlashcards} />
              </div>
            )}

            {/* Study View */}
            {viewMode === VIEW_MODE.STUDY && flashcards.length > 0 && (
              <div className="mt-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setViewMode(VIEW_MODE.PREVIEW)}
                    >
                      Back
                    </Button>
                    <span className="text-[15px] font-medium text-slate-600">
                      Track Progress
                    </span>
                    <button
                      onClick={() => setIsTrackingProgress(!isTrackingProgress)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isTrackingProgress ? "bg-[#f26522]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          isTrackingProgress
                            ? "translate-x-5"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePrev}
                      className="flex h-10 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
                      disabled={currentIndex === 0 && !isCompleted}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-lg font-bold text-slate-800 min-w-[70px] text-center">
                      {isCompleted ? flashcards.length : currentIndex + 1} /{" "}
                      {flashcards.length}
                    </span>
                    <button
                      onClick={handleNext}
                      disabled={isCompleted}
                      className="flex h-10 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    onClick={handleReset}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    New Set
                  </button>
                </div>

                {isTrackingProgress && (
                  <div className="mb-10 w-full overflow-hidden rounded-full bg-slate-200 h-1.5">
                    <div
                      className="h-full bg-[#f26522] transition-all duration-300 ease-out"
                      style={{
                        width: `${
                          isCompleted
                            ? 100
                            : ((currentIndex + 1) / flashcards.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                )}

                {isCompleted ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95 duration-500 rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-[#f26522] mb-6 shadow-sm">
                      <Trophy className="h-12 w-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">
                      Congratulations!
                    </h2>
                    <p className="text-slate-500 max-w-md mb-8 text-lg">
                      You have successfully completed all {flashcards.length} cards in this deck. Keep up the great work!
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={resetProgress}
                        className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50 shadow-sm"
                      >
                        Restart Study
                      </button>
                      <button
                        onClick={handleReset}
                        className="rounded-xl bg-[#f26522] px-6 py-3 font-medium text-white transition hover:bg-[#d95316] shadow-md shadow-orange-500/20"
                      >
                        Create New Set
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center w-full max-w-2xl mx-auto min-h-[350px]">
                    <div className="w-full h-full animate-in slide-in-from-right-8 duration-300">
                      {flashcards[currentIndex] && (
                        <FlashcardItem
                          key={currentIndex}
                          term={flashcards[currentIndex].term}
                          definition={flashcards[currentIndex].definition}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Publish: Confirmation Dialog (when course is auto-detected) */}
      <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Publish Material
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              This flashcard set was created from a document in course{" "}
              <span className="font-semibold text-slate-700">
                {detectedCourse?.code} - {detectedCourse?.name}
              </span>
              . Would you like to publish it to this course?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex items-center gap-3 rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
            <div className="w-10 h-10 rounded-lg bg-[#f26522] flex items-center justify-center text-white shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {detectedCourse?.code} - {detectedCourse?.name}
              </p>
              <p className="text-xs text-slate-500">Auto-detected from source document</p>
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                // User wants to pick a different course
                setPublishConfirmOpen(false);
                setPublishCourseId("");
                setPublishDialogOpen(true);
              }}
              className="rounded-xl"
              disabled={publishing}
            >
              Choose Another Course
            </Button>
            <Button
              onClick={handlePublish}
              className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white"
              disabled={publishing}
            >
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish: Course Selection Dialog (when no course auto-detected) */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Publish Material
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              Select a course to publish this flashcard set to. It will be
              visible to everyone in that course.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Select Course
            </label>
            <Select
              value={publishCourseId}
              onValueChange={setPublishCourseId}
            >
              <SelectTrigger className="w-full h-10 rounded-xl px-3 border-slate-200">
                <SelectValue placeholder="Select a course to publish to" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(false)}
              className="rounded-xl"
              disabled={publishing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white"
              disabled={publishing}
            >
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-3xl max-w-sm bg-white border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Delete Flashcard Set?</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to delete this flashcard set? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="rounded-xl cursor-pointer">
              Cancel
            </Button>
            <Button onClick={confirmDeleteFlashcardSet} className="bg-red-500 hover:bg-red-600 text-white rounded-xl cursor-pointer">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm bg-white border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Rename Flashcard Set</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Enter a new name for this flashcard set.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Flashcard Set Title"
              className="rounded-xl border-slate-200"
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} className="rounded-xl cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleRenameFlashcardSet} disabled={isRenaming} className="bg-[#f26522] hover:bg-[#d95316] text-white rounded-xl cursor-pointer">
              {isRenaming ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}