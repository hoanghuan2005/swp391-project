import React, { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Target,
  Send,
  FileText,
  X,
  Plus,
  Settings2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AISidebar from "@/components/ai-sidebar/AISidebar";
import axiosClient from "@/api/axiosClient";
import useDocuments from "@/hooks/useDocuments";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function AIQuizGenerator() {
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [libraryDoc, setLibraryDoc] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);

  // Sidebar states
  const [quizHistory, setQuizHistory] = useState([]);
  const {
    documents: uploadedDocuments,
    loading: documentsLoading,
    refreshDocuments,
  } = useDocuments();
  const [searchDocQuery, setSearchDocQuery] = useState("");
  const [openSettings, setOpenSettings] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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

  const clearDocument = () => {
    setFile(null);
    setLibraryDoc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectQuiz = (quiz) => {
    navigate(`/quiz/${quiz.id}`);
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
          "http://localhost:8080/api/documents/upload",
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
      } catch (e) {
        // ignore
      }
      navigate(`/quiz/${response.data.id}`);
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

  const activeDocument = file || libraryDoc;

  return (
    <div className="h-[calc(100vh-68px)] overflow-hidden bg-white shadow-sm -mx-8 -my-6 flex">
      {/* SIDEBAR */}
      <AISidebar
        type="quiz"
        histories={quizHistory}
        documents={uploadedDocuments}
        onSelectItem={handleSelectQuiz}
        onDeleteItem={handleDeleteQuiz} // Chạy mượt mà, không lo bị undefined
        onCreate={() => {
          setInputText("");
          clearDocument();
        }}
        onSelectDocument={handleLibrarySuccess}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        fileInputRef={fileInputRef}
        handleUpload={handleFileSelect}
        isUploading={false}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto bg-slate-50 flex justify-center px-6 py-8">
        <div className="w-full max-w-4xl flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-[#f26522]">
              <Target className="w-5 h-5" />
              <h1 className="text-xl font-semibold text-slate-800">
                AI Quiz Generator
              </h1>
            </div>

            <p className="text-sm text-slate-500">
              Create quizzes from topics, notes, or uploaded documents.
            </p>
          </div>

          {/* Chat-style Input */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter a topic or paste your notes..."
              className="w-full min-h-[180px] resize-none border-0 outline-none bg-transparent p-5 text-slate-700"
            />

            {/* Active Document */}
            {activeDocument && (
              <div className="px-5 pb-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                  <FileText className="w-4 h-4 text-[#f26522]" />

                  <span className="max-w-[220px] truncate text-sm">
                    {activeDocument.title || activeDocument.name}
                  </span>

                  <X
                    className="w-4 h-4 cursor-pointer text-slate-400 hover:text-red-500"
                    onClick={clearDocument}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 p-4">
              <div className="flex items-center gap-2">
                {/* Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full"
                >
                  <Plus className="w-5 h-5" />
                </Button>

                {/* Settings */}
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
              </div>

              {/* Create Button */}
              <Button
                onClick={handleGenerateQuiz}
                disabled={
                  (!inputText.trim() && !file && !libraryDoc) || isGenerating
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f26522] text-white hover:bg-[#de5b0b] disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
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
    </div>
  );
}
