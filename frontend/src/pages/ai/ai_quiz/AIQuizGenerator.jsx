import React, { useState, useRef, useEffect } from "react";
import {
  Loader2,
  ListChecks,
  Settings2,
  ArrowLeft,
  Heart,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AISidebar from "@/components/ai-sidebar/sidebar/AISidebar";
import axiosClient, { backendBaseUrl } from "@/api/axiosClient";
import useDocuments from "@/hooks/useDocuments";
import { toast } from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import AIGeneratorInput from "@/components/ai-sidebar/AIGeneratorInput";
import AIToolHeader from "@/components/ai-sidebar/AIToolHeader";
import useMaterialPublish from "@/hooks/useMaterialPublish";
import QuizEditor from "./QuizEditor";
import { Input } from "@/components/ui/input";
import {
  deleteQuiz,
  generateQuiz,
  getQuizById,
  getUserQuizzes,
  updateQuiz,
  renameQuiz,
  generateQuizFromFile,
} from "@/api/quizApi";
import AiUsageBadge from "@/components/ai-usage/AiUsageBadge";
import useAiUsage from "@/hooks/useAiUsage";
import { isAiQuotaExceeded } from "@/api/aiUsageApi";
import useDocumentQuota from "@/hooks/useDocumentQuota";
import { isDocumentQuotaExceeded } from "@/api/documentQuotaApi";
import QuotaExceededDialog from "@/components/quota/QuotaExceededDialog";

export default function AIQuizGenerator() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useStudyTimer(setElapsedSeconds);
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [libraryDoc, setLibraryDoc] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sidebar states
  const [quizHistory, setQuizHistory] = useState([]);
  const { documents: uploadedDocuments, refreshDocuments } = useDocuments();
  const {
    subscriptionTier,
    remainingUsage,
    loading: aiUsageLoading,
    refreshAiUsage,
  } = useAiUsage();
  const { refreshDocumentQuota } = useDocumentQuota();
  const [searchDocQuery, setSearchDocQuery] = useState("");
  const [openSettings, setOpenSettings] = useState(false);
  const [quotaDialog, setQuotaDialog] = useState({
    open: false,
    type: "AI",
    message: "",
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [quizToRename, setQuizToRename] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const VIEW_MODE = {
    GENERATE: "GENERATE",
    PREVIEW: "PREVIEW",
    STUDY: "STUDY",
  };
  const [viewMode, setViewMode] = useState(VIEW_MODE.GENERATE);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [publishCourseId, setPublishCourseId] = useState("");

  // Quiz study mode state
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizIdParam = searchParams.get("id");
  const modeParam = searchParams.get("mode");

  const loadQuiz = async (quizId) => {
    try {
      setIsGenerating(true);
      const quizDetails = await getQuizById(quizId);
      setSelectedQuiz(quizDetails);
      if (modeParam === "study") {
        setViewMode(VIEW_MODE.STUDY);
      } else {
        setViewMode(VIEW_MODE.PREVIEW);
      }
      setAnswers({});
      setIsSubmitted(false);
      setScore(0);
    } catch (error) {
      console.error("Failed to load quiz details:", error);
      toast.error("Failed to load quiz details");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId, option) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleRetake = () => {
    setAnswers({});
    setIsSubmitted(false);
    setScore(0);
    toast.success("Quiz reset. Good luck!");
  };

  const handleSubmit = () => {
    const totalQuestions = selectedQuiz?.questions?.length || 0;
    if (Object.keys(answers).length < totalQuestions) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    let calculatedScore = 0;
    selectedQuiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    setIsSubmitted(true);
  };

  useEffect(() => {
    if (quizIdParam) {
      loadQuiz(quizIdParam);
    }
  }, [quizIdParam]);
  const { publish, loading: publishing } = useMaterialPublish();

  // Fetch sidebar data
  const fetchSidebarData = async () => {
    try {
      const history = await getUserQuizzes();
      setQuizHistory(history || []);
    } catch (error) {
      console.error("Sidebar fetch error:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSidebarData();
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLibraryDoc(null);
    }
  };

  const handleLibrarySuccess = (selectedDoc) => {
    if (selectedDoc) {
      setLibraryDoc(selectedDoc);
      setFile(null);
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

  // Derive detected course from the selected quiz's source document
  const detectedCourse = selectedQuiz?.documentCourseId
    ? {
        id: selectedQuiz.documentCourseId,
        name: selectedQuiz.documentCourseName,
        code: selectedQuiz.documentCourseCode,
      }
    : null;

  const clearDocument = () => {
    setFile(null);
    setLibraryDoc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectQuiz = async (quiz) => {
    try {
      setIsGenerating(true);
      const quizDetails = await getQuizById(quiz.id);
      setSelectedQuiz(quizDetails);
      setViewMode(VIEW_MODE.PREVIEW);
    } catch (error) {
      console.error("Failed to load quiz details:", error);
      toast.error("Failed to load quiz details");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteQuiz = (e, quizId) => {
    e.stopPropagation();
    setQuizToDelete(quizId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    try {
      await deleteQuiz(quizToDelete);
      toast.success("Quiz deleted successfully");
      setQuizHistory((prev) => prev.filter((q) => q.id !== quizToDelete));
      if (selectedQuiz?.id === quizToDelete) {
        setSelectedQuiz(null);
        setViewMode(VIEW_MODE.GENERATE);
      }
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      toast.error("Failed to delete quiz session");
    } finally {
      setDeleteConfirmOpen(false);
      setQuizToDelete(null);
    }
  };

  const handleEditQuizClick = (e, quiz) => {
    e.stopPropagation();
    setQuizToRename(quiz);
    setNewTitle(quiz.title);
    setRenameDialogOpen(true);
  };

  const handleRenameQuiz = async () => {
    if (!quizToRename || !newTitle.trim()) return;
    setIsRenaming(true);
    try {
      const updatedQuiz = await renameQuiz(quizToRename.id, newTitle.trim());
      toast.success("Quiz renamed successfully!");
      setQuizHistory((current) =>
        current.map((q) =>
          q.id === quizToRename.id ? { ...q, title: newTitle.trim() } : q,
        ),
      );
      if (selectedQuiz?.id === quizToRename.id) {
        setSelectedQuiz((prev) => ({ ...prev, title: newTitle.trim() }));
      }
      setRenameDialogOpen(false);
    } catch (error) {
      console.error("Failed to rename quiz:", error);
      toast.error(error.response?.data?.message || "Failed to rename quiz.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedQuiz?.id) return;

    setIsSaving(true);
    try {
      const updatedQuiz = await updateQuiz(selectedQuiz.id, {
        title: selectedQuiz.title,
        questions: selectedQuiz.questions,
      });
      setSelectedQuiz(updatedQuiz);
      setQuizHistory((current) =>
        current.map((quiz) =>
          quiz.id === updatedQuiz.id ? updatedQuiz : quiz,
        ),
      );
      toast.success("Quiz draft saved successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save quiz draft.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!selectedQuiz?.id) return;

    setIsSaving(true);
    try {
      const updatedQuiz = await updateQuiz(selectedQuiz.id, {
        title: selectedQuiz.title,
        questions: selectedQuiz.questions,
        savedToLibrary: true,
      });
      setSelectedQuiz(updatedQuiz);
      setQuizHistory((current) =>
        current.map((quiz) =>
          quiz.id === updatedQuiz.id ? updatedQuiz : quiz,
        ),
      );
      toast.success("Saved to Library successfully!");
      fetchSidebarData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save to Library.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const waitForDocumentReady = async (documentId) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await axiosClient.get(`/api/documents/${documentId}`);
      const status = response.data?.aiParseStatus;

      if (status === "READY" || !status) {
        return;
      }
      if (status === "FAILED" || status === "UNSUPPORTED") {
        throw new Error(
          "This document failed to parse or is unsupported for AI quiz generation.",
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error(
      "Document is still being prepared for AI. Please try again shortly.",
    );
  };

  const handleGenerateQuiz = async () => {
    if (!inputText.trim() && !file && !libraryDoc) {
      toast.error("Please enter a topic, upload a file, or select a document.");
      return;
    }

    setIsGenerating(true);

    try {
      let generatedQuiz;
      if (libraryDoc) {
        if (libraryDoc.aiParseStatus === "PENDING") {
          throw new Error(
            "Document is still being prepared for AI. Please try again shortly.",
          );
        }
        if (["FAILED", "UNSUPPORTED"].includes(libraryDoc?.aiParseStatus)) {
          throw new Error(
            "This document is not available for AI quiz generation.",
          );
        }

        let title = `Quiz: ${libraryDoc.title || libraryDoc.name}`;
        const payload = {
          title: title,
          documentId: libraryDoc.id,
          projectId: null,
          questionCount: questionCount,
          difficulty: difficulty,
          topic: inputText.trim() || null,
        };
        generatedQuiz = await generateQuiz(payload);
      } else if (file) {
        const formData = new FormData();
        formData.append("file", file);
        if (inputText.trim()) {
          formData.append("text", inputText.trim());
        }
        formData.append("title", `Quiz: ${file.name}`);
        formData.append("questionCount", questionCount);
        formData.append("difficulty", difficulty);

        generatedQuiz = await generateQuizFromFile(formData);
      } else {
        const shortened = inputText.trim().slice(0, 30);
        let title = `Quiz: ${shortened}${inputText.length > 30 ? "..." : ""}`;
        const payload = {
          title: title,
          documentId: null,
          projectId: null,
          questionCount: questionCount,
          difficulty: difficulty,
          topic: inputText.trim(),
        };
        generatedQuiz = await generateQuiz(payload);
      }

      await refreshAiUsage();
      toast.success("Quiz generated successfully!");
      clearDocument();
      try {
        await refreshDocuments();
      } catch {
        // ignore
      }
      setSelectedQuiz(generatedQuiz);
      setViewMode(VIEW_MODE.PREVIEW);
      fetchSidebarData();
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      if (isDocumentQuotaExceeded(error)) {
        const message = error.response?.data?.message;
        setQuotaDialog({
          open: true,
          type: message?.toLowerCase().includes("file size")
            ? "FILE_SIZE"
            : "DOCUMENT",
          message,
        });
        await refreshDocumentQuota();
        return;
      }
      if (isAiQuotaExceeded(error)) {
        setQuotaDialog({
          open: true,
          type: "AI",
          message: error.response?.data?.message,
        });
        await refreshAiUsage();
        return;
      }
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to generate your quiz. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishQuizClick = () => {
    if (!selectedQuiz || !selectedQuiz.id) {
      toast.error(
        "Please save or select a generated quiz first before publishing.",
      );
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

  const handlePublishQuiz = async () => {
    const courseId = publishCourseId || null;

    try {
      await publish({
        type: "QUIZ",
        id: selectedQuiz.id,
        courseId,
        visibility: "PUBLIC",
      });
      toast.success("Quiz published successfully!");
      setPublishDialogOpen(false);
      setPublishConfirmOpen(false);
    } catch (e) {
      toast.error("Failed to publish quiz.");
      console.error(e);
    }
  };

  const activeDocument = file || libraryDoc;

  return (
    <div className="h-[calc(100vh-68px)] overflow-hidden bg-white shadow-sm -mx-8 -my-6 flex">
      {/* SIDEBAR */}
      <AISidebar
        type="quiz"
        histories={quizHistory}
        documents={uploadedDocuments}
        onSelectItem={handleSelectQuiz}
        onDeleteItem={handleDeleteQuiz}
        onEditItem={handleEditQuizClick}
        onCreate={() => {
          setInputText("");
          clearDocument();
          setViewMode(VIEW_MODE.GENERATE);
          setSelectedQuiz(null);
        }}
        onSelectDocument={handleLibrarySuccess}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        fileInputRef={fileInputRef}
        handleUpload={handleFileSelect}
        isUploading={false}
      />

      {/* MAIN CONTENT */}
      <div className="relative flex-1 overflow-y-auto bg-slate-50/50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* Header */}
          {isGenerating && !selectedQuiz && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#f26522]" />
              <p className="font-medium text-slate-600">
                Generating your quiz...
              </p>
            </div>
          )}

          <AIToolHeader
            icon={ListChecks}
            title="AI Quiz Generator"
            description="Create quizzes instantly from any topic or document. Perfect for study sessions and self-assessment."
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

          {viewMode === VIEW_MODE.GENERATE && (
            <>
              {libraryDoc &&
                ["FAILED", "UNSUPPORTED"].includes(
                  libraryDoc.aiParseStatus,
                ) && (
                  <div className="mb-4 p-4 border border-red-200 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">
                        Quiz Generation Disabled
                      </h4>
                      <p className="text-xs text-red-700 mt-1">
                        This document ({libraryDoc.title || libraryDoc.name})
                        failed to parse or is unsupported. Quiz generation is
                        disabled for this file.
                      </p>
                    </div>
                  </div>
                )}
              <AIGeneratorInput
                value={inputText}
                onChange={setInputText}
                placeholder="Enter a topic or paste your notes..."
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                activeDocument={activeDocument}
                clearDocument={clearDocument}
                onGenerate={handleGenerateQuiz}
                isGenerating={isGenerating}
                disabled={
                  (!inputText.trim() && !file && !libraryDoc) ||
                  (libraryDoc &&
                    ["FAILED", "UNSUPPORTED"].includes(
                      libraryDoc.aiParseStatus,
                    ))
                }
                footerLeft={
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpenSettings(true)}
                      className="rounded-full"
                    >
                      <Settings2 className="w-5 h-5" />
                    </Button>

                    <span className="text-xs text-slate-500 ml-2">
                      {questionCount} Questions • {difficulty}
                    </span>
                  </>
                }
              />
            </>
          )}

          {viewMode === VIEW_MODE.PREVIEW && selectedQuiz && (
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
                      <ListChecks className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div>
                        <Input
                          value={selectedQuiz.title}
                          onChange={(event) =>
                            setSelectedQuiz((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          className="h-11 rounded-xl text-2xl font-bold"
                          aria-label="Quiz title"
                        />
                        <p className="mt-1 text-sm text-slate-500">
                          {selectedQuiz.questions?.length || 0} questions
                          generated successfully
                        </p>
                      </div>

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-5">
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            className="rounded-full border-orange-200 hover:bg-orange-50 h-9 px-4 text-sm cursor-pointer"
                            onClick={handleSaveDraft}
                            disabled={isSaving}
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
                            disabled={isSaving}
                          >
                            {isSaving && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save to Library
                          </Button>

                          <Button
                            className="rounded-full bg-[#f26522] hover:bg-[#d95316] h-9 px-4 text-sm text-white cursor-pointer shadow-sm font-semibold"
                            onClick={handlePublishQuizClick}
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

              <QuizEditor
                questions={selectedQuiz.questions || []}
                setQuestions={(update) =>
                  setSelectedQuiz((current) => ({
                    ...current,
                    questions:
                      typeof update === "function"
                        ? update(current.questions || [])
                        : update,
                  }))
                }
              />
            </div>
          )}

          {viewMode === VIEW_MODE.STUDY && selectedQuiz && (
            <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-[#fffaf7] to-[#fff3eb] overflow-hidden mb-5">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setViewMode(VIEW_MODE.PREVIEW)}
                      className="rounded-xl"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back to Edit
                    </Button>
                    {isSubmitted && (
                      <div className="text-center px-6 py-2 bg-white/80 rounded-xl border border-orange-200 shadow-sm shrink-0">
                        <span className="text-xs font-bold text-[#f26522] uppercase tracking-widest mr-2">
                          Score:
                        </span>
                        <span className="text-lg font-black text-[#f26522]">
                          {score} / {selectedQuiz.questions?.length || 0}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#f66810] flex items-center justify-center text-white shadow-sm shrink-0">
                      <ListChecks className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">
                        {selectedQuiz.title}
                      </h1>
                      <p className="text-sm text-slate-505 mt-1">
                        {selectedQuiz.questions?.length || 0} Questions •
                        Practice Mode
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {selectedQuiz.questions?.map((q, index) => {
                  const selectedAnswer = answers[q.id];
                  const isCorrect = selectedAnswer === q.correctAnswer;

                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-[24px] p-6 shadow-xs border border-slate-200"
                    >
                      <h3 className="text-lg font-bold text-slate-800 mb-5 leading-relaxed">
                        <span className="text-[#f26522] mr-3 text-xl font-black opacity-20">
                          {index + 1}
                        </span>
                        {q.content}
                      </h3>

                      <div className="space-y-3">
                        {q.options?.map((option, optIdx) => {
                          const isSelected = selectedAnswer === option;
                          const isActuallyCorrect =
                            isSubmitted && option === q.correctAnswer;
                          const isWrongSelection =
                            isSubmitted && isSelected && !isCorrect;

                          let boxStyles =
                            "border-slate-200 bg-white hover:border-[#f26522]/30 hover:bg-orange-50/20";
                          if (isSelected && !isSubmitted)
                            boxStyles =
                              "border-[#f26522] bg-orange-50/50 ring-1 ring-[#f26522] shadow-sm";
                          if (isActuallyCorrect)
                            boxStyles =
                              "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500 shadow-sm";
                          if (isWrongSelection)
                            boxStyles =
                              "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500 shadow-sm";

                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, option)}
                              className={`p-4.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${boxStyles} ${isSubmitted ? "cursor-default" : ""}`}
                            >
                              <span className="font-semibold text-[15px]">
                                {option}
                              </span>

                              {isActuallyCorrect && (
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                              )}
                              {isWrongSelection && (
                                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {isSubmitted && q.explanation && (
                        <div className="mt-6 p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50 text-blue-900 animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                              Explanation
                            </p>
                          </div>
                          <p className="text-[15px] leading-relaxed font-medium">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 mb-12 flex justify-end gap-4">
                {!isSubmitted ? (
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    className="rounded-xl bg-[#f26522] hover:bg-[#de5b0b] text-white font-bold px-6 h-12 text-md shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setViewMode(VIEW_MODE.PREVIEW)}
                      className="rounded-xl border-slate-205 bg-white text-slate-700 h-12 px-6 font-bold hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
                    >
                      Back to Edit
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleRetake}
                      className="rounded-xl bg-[#f26522] hover:bg-[#de5b0b] text-white h-12 px-6 font-bold shadow-lg shadow-[#f26522]/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Retake Quiz
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quiz Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Question Count */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Number of Questions
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((num) => (
                  <Button
                    key={num}
                    variant={questionCount === num ? "default" : "outline"}
                    onClick={() => setQuestionCount(num)}
                    className={
                      questionCount === num
                        ? "bg-[#f26522] hover:bg-[#de5b0b]"
                        : ""
                    }
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Difficulty
              </label>

              <div className="grid grid-cols-3 gap-2">
                {["Easy", "Medium", "Hard"].map((level) => (
                  <Button
                    key={level}
                    variant={difficulty === level ? "default" : "outline"}
                    onClick={() => setDifficulty(level)}
                    className={
                      difficulty === level
                        ? "bg-[#f26522] hover:bg-[#de5b0b]"
                        : ""
                    }
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Smart Publish: Confirmation Dialog (when course is auto-detected) */}
      <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Publish Material
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              This quiz was created from a document in course{" "}
              <span className="font-semibold text-slate-700">
                {detectedCourse?.code} - {detectedCourse?.name}
              </span>
              . Would you like to publish it to this course?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex items-center gap-3 rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
            <div className="w-10 h-10 rounded-lg bg-[#f26522] flex items-center justify-center text-white shrink-0">
              <ListChecks className="w-5 h-5" />
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
              onClick={handlePublishQuiz}
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
              Select a course to publish this quiz to. It will be visible to
              everyone in that course.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Select Course
            </label>
            <Select value={publishCourseId} onValueChange={setPublishCourseId}>
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
              onClick={handlePublishQuiz}
              className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white"
              disabled={publishing}
            >
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <QuotaExceededDialog
        open={quotaDialog.open}
        onOpenChange={(open) =>
          setQuotaDialog((current) => ({ ...current, open }))
        }
        type={quotaDialog.type}
        message={quotaDialog.message}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-3xl max-w-sm bg-white border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              Delete Quiz Session?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to delete this quiz session? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteQuiz}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl cursor-pointer"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm bg-white border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              Rename Quiz
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Enter a new name for this quiz.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Quiz Title"
              className="rounded-xl border-slate-200"
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              className="rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameQuiz}
              disabled={isRenaming}
              className="bg-[#f26522] hover:bg-[#d95316] text-white rounded-xl cursor-pointer"
            >
              {isRenaming ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
