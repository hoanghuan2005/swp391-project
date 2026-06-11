import React, { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Target,
  Settings2,
  ArrowLeft,
  Heart,
} from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import AIGeneratorInput from "@/components/ai-sidebar/AIGeneratorInput";
import AIToolHeader from "@/components/ai-sidebar/AIToolHeader";
import useMaterialPublish from "@/hooks/useMaterialPublish";
import QuizEditor from "./QuizEditor";
import { Input } from "@/components/ui/input";

export default function AIQuizGenerator() {
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [libraryDoc, setLibraryDoc] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sidebar states
  const [quizHistory, setQuizHistory] = useState([]);
  const {
    documents: uploadedDocuments,
    refreshDocuments,
  } = useDocuments();
  const [searchDocQuery, setSearchDocQuery] = useState("");
  const [openSettings, setOpenSettings] = useState(false);

  const VIEW_MODE = {
    GENERATE: "GENERATE",
    PREVIEW: "PREVIEW",
  };
  const [viewMode, setViewMode] = useState(VIEW_MODE.GENERATE);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [publishCourseId, setPublishCourseId] = useState("");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { publish, loading: publishing } = useMaterialPublish();

  // Fetch sidebar data
  const fetchSidebarData = async () => {
    try {
      const historyRes = await axiosClient.get("/api/quizzes/my-quizzes");
      setQuizHistory(historyRes.data || []);
    } catch (error) {
      console.error("Sidebar fetch error:", error);
    }
  };

  useEffect(() => {
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
      axiosClient.get("/api/courses/all")
        .then(res => setCourses(res.data))
        .catch(err => console.error("Failed to load courses", err));
    }
  }, [publishDialogOpen, courses.length]);

  const clearDocument = () => {
    setFile(null);
    setLibraryDoc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectQuiz = async (quiz) => {
    try {
      setIsGenerating(true);
      const response = await axiosClient.get(`/api/quizzes/${quiz.id}`);
      setSelectedQuiz(response.data);
      setViewMode(VIEW_MODE.PREVIEW);
    } catch (error) {
      console.error("Failed to load quiz details:", error);
      toast.error("Failed to load quiz details");
    } finally {
      setIsGenerating(false);
    }
  };

  // === ĐÃ VÁ LỖI: Thêm hàm xử lý xóa bài Quiz để tránh crash ứng dụng ===
  const handleDeleteQuiz = async (e, quizId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this quiz session?")) {
      return;
    }

    try {
      await axiosClient.delete(`/api/quizzes/${quizId}`);
      toast.success("Quiz deleted successfully");
      setQuizHistory((prev) => prev.filter((q) => q.id !== quizId));
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      toast.error("Failed to delete quiz session");
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedQuiz?.id) return;

    setIsSaving(true);
    try {
      const response = await axiosClient.put(`/api/quizzes/${selectedQuiz.id}`, {
        title: selectedQuiz.title,
        questions: selectedQuiz.questions,
      });
      setSelectedQuiz(response.data);
      setQuizHistory((current) =>
        current.map((quiz) =>
          quiz.id === response.data.id ? response.data : quiz,
        ),
      );
      toast.success("Quiz draft saved successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save quiz draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const waitForDocumentReady = async (documentId) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await axiosClient.get(`/api/documents/${documentId}`);
      const status = response.data?.aiParseStatus;

      if (status === "READY" || status === "UNSUPPORTED" || !status) {
        return;
      }
      if (status === "FAILED") {
        throw new Error(
          "Document text could not be extracted for AI quiz generation.",
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
      let finalDocumentId = libraryDoc ? libraryDoc.id : null;
      let documentTitle = libraryDoc
        ? libraryDoc.title || libraryDoc.name
        : null;

      if (libraryDoc?.aiParseStatus === "PENDING") {
        throw new Error(
          "Document is still being prepared for AI. Please try again shortly.",
        );
      }
      if (["FAILED", "UNSUPPORTED"].includes(libraryDoc?.aiParseStatus)) {
        throw new Error(
          "This document is not available for AI quiz generation.",
        );
      }

      if (file && !finalDocumentId) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        formData.append("visibility", "PRIVATE");
        formData.append("courseCode", "QUIZ");

        const token = localStorage.getItem("token");

        const uploadResponse = await fetch(
          `${backendBaseUrl}/api/documents/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (!uploadResponse.ok) {
          throw new Error(
            "Upload failed with status: " + uploadResponse.status,
          );
        }

        const data = await uploadResponse.json();
        finalDocumentId = data.id;
        documentTitle = file.name;

        await waitForDocumentReady(finalDocumentId);
        window.dispatchEvent(new CustomEvent("documents:uploaded"));
      }

      let title = "Custom Topic Quiz";
      if (documentTitle) {
        title = `Quiz: ${documentTitle}`;
      } else if (inputText) {
        const shortened = inputText.trim().slice(0, 30);
        title = `Quiz: ${shortened}${inputText.length > 30 ? "..." : ""}`;
      }

      const payload = {
        title: title,
        documentId: finalDocumentId,
        projectId: null,
        questionCount: questionCount,
        difficulty: difficulty,
        topic: inputText.trim() || null,
      };

      const response = await axiosClient.post("/api/quizzes/generate", payload);
      toast.success("Quiz generated successfully!");
      clearDocument();
      try {
        await refreshDocuments();
      } catch {
        // ignore
      }
      setSelectedQuiz(response.data);
      setViewMode(VIEW_MODE.PREVIEW);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
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
      toast.error("Please save or select a generated quiz first before publishing.");
      return;
    }
    setPublishCourseId(libraryDoc?.course?.id || "");
    setPublishDialogOpen(true);
  };

  const handlePublishQuiz = async () => {
    const courseId = publishCourseId || null;
    
    try {
      await publish({
        type: "QUIZ",
        id: selectedQuiz.id,
        courseId,
        visibility: "PUBLIC"
      });
      toast.success("Quiz published successfully!");
      setPublishDialogOpen(false);
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
          {isGenerating && (!selectedQuiz) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#f26522]" />
              <p className="font-medium text-slate-600">
                Generating your quiz...
              </p>
            </div>
          )}

          <AIToolHeader
            icon={Target}
            title="AI Quiz Generator"
            description="Create quizzes instantly from any topic or document. Perfect for study sessions and self-assessment."
          />

          {viewMode === VIEW_MODE.GENERATE && (
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
              disabled={!inputText.trim() && !file && !libraryDoc}
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
                      <Target className="w-7 h-7" />
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
                          {selectedQuiz.questions?.length || 0} questions generated successfully
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
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Draft
                          </Button>

                          <Button
                            variant="outline"
                            className="rounded-full border-orange-200 hover:bg-orange-50 h-9 px-4 text-sm cursor-pointer"
                            onClick={() => navigate(`/quiz/${selectedQuiz.id}`)}
                          >
                            Start Study
                          </Button>

                          <Button 
                            className="rounded-full bg-[#f26522] hover:bg-[#d95316] h-9 px-4 text-sm text-white cursor-pointer shadow-sm"
                            onClick={handlePublishQuizClick}
                            disabled={publishing}
                          >
                            {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Publish Material
                          </Button>

                          <Button
                            variant="outline"
                            className="rounded-full border-orange-200 hover:bg-orange-50 h-9 px-4 text-sm cursor-pointer"
                            onClick={() => toast.success("Quiz liked!")}
                          >
                            <Heart className="w-4 h-4 mr-1 text-slate-500 hover:text-red-500" /> Like
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

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Publish Material
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              Select a course to publish this quiz to. It will be visible to everyone in that course.
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
                {courses.map(c => (
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
    </div>
  );
}
