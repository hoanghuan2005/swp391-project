import React, { useRef, useState, useEffect } from "react";
import {
  FileText,
  X,
  Plus,
  Send,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Sparkles,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import useDocuments from "@/hooks/useDocuments";
import FlashcardItem from "./FlashcardItem";
import AISidebar from "@/components/ai-sidebar/AISidebar";
import { Button } from "@/components/ui/button";

export default function AIFlashcardGenerator({ contextData }) {
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeSetTitle, setActiveSetTitle] = useState(
    "Generate AI Flashcards",
  );

  // State Tracking
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTrackingProgress, setIsTrackingProgress] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const fileInputRef = useRef(null);

  const [flashcardHistory, setFlashcardHistory] = useState([]);
  const {
    documents: uploadedDocuments,
    loading: documentsLoading,
    refreshDocuments,
  } = useDocuments();

  useEffect(() => {
    if (contextData && contextData.id) {
      loadFlashcardSet(contextData.id);
    }
  }, [contextData]);

  const fetchSidebarData = async () => {
    try {
      const historyRes = await axiosClient.get("/api/ai_flashcard/sets");
      setFlashcardHistory(historyRes.data.data || []);
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
      const response = await axiosClient.get(`/api/ai_flashcard/sets/${setId}`);
      const data = response.data.data;
      setActiveSetTitle(data.title);
      setFlashcards(data.flashcards || []);
      resetProgress();
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
    console.log("Delete flashcard set:", id);
  };

  const handleCreateFlashcardSet = () => {
    setSelectedFlashcardSet(null);
    setFlashcards([]);
    setInputText("");
    setFile(null);
    setSelectedDoc(null);
    setActiveSetTitle("Generate AI Flashcards");
    setIsCompleted(false);
  };

  const handleGenerate = async () => {
    if (!inputText && !file && !selectedDoc) return;
    setIsGenerating(true);
    try {
      let response;
      if (selectedDoc) {
        response = await axiosClient.post(
          "/api/ai_flashcard/generate-from-document",
          { documentId: selectedDoc.id },
        );
      } else {
        const formData = new FormData();
        if (file) formData.append("document", file);
        if (inputText) formData.append("text", inputText);
        response = await axiosClient.post(
          "/api/ai_flashcard/generate",
          formData,
        );
      }
      const result = response.data.data || response.data;
      if (Array.isArray(result)) {
        setFlashcards(result);
        setActiveSetTitle(
          selectedDoc?.title || file?.name || "New Generated Set",
        );
        resetProgress();
        try {
          await refreshDocuments();
        } catch (e) {
          /* ignore */
        }
      } else {
        alert("Data returned is not correct!");
      }
    } catch (error) {
      console.error(error);
      alert("Error generating flashcards!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setFlashcards([]);
    setInputText("");
    setFile(null);
    setSelectedDoc(null);
    setActiveSetTitle("Generate AI Flashcards");
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
          onCreate={handleCreateFlashcardSet}
          onSelectDocument={handleSelectDocument}
          searchDocQuery={searchQuery}
          setSearchDocQuery={setSearchQuery}
          fileInputRef={fileInputRef}
          handleUpload={handleFileSelect}
          isUploading={false}
        />

        <div className="relative flex-1 overflow-y-auto bg-slate-50/50">
          {isGenerating && flashcards.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#f26522]" />
              <p className="font-medium text-slate-600">
                Loading your study set...
              </p>
            </div>
          )}

          <div className="mx-auto max-w-5xl p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2 text-[#f26522]">
                <Sparkles className="w-5 h-5" />
                <h1 className="text-xl font-semibold text-slate-800">
                  AI Flashcards
                </h1>
              </div>
              <p className="text-sm text-slate-500">
                Create flashcards from notes or uploaded documents.
              </p>
            </div>

            {flashcards.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your lesson content..."
                  className="w-full min-h-[180px] resize-none border-0 outline-none p-5 text-slate-700"
                />

                {(file || selectedDoc) && (
                  <div className="px-5 pb-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                      <FileText className="h-4 w-4 text-[#f26522]" />
                      <span className="max-w-[220px] truncate text-sm">
                        {selectedDoc?.title || selectedDoc?.name || file?.name}
                      </span>
                      <button
                        onClick={() => {
                          setFile(null);
                          setSelectedDoc(null);
                        }}
                      >
                        <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 p-4">
                  <div>
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
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f26522] text-white hover:bg-[#de5b0b] disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {flashcards.length > 0 && (
              <div className="mt-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-medium text-slate-600">
                      Theo dõi tiến độ
                    </span>
                    <button
                      onClick={() => setIsTrackingProgress(!isTrackingProgress)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTrackingProgress ? "bg-[#f26522]" : "bg-slate-300"}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isTrackingProgress ? "translate-x-5" : "translate-x-1"}`}
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
                        width: `${isCompleted ? 100 : ((currentIndex + 1) / flashcards.length) * 100}%`,
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
                      Chúc mừng! 🎉
                    </h2>
                    <p className="text-slate-500 max-w-md mb-8 text-lg">
                      Bạn đã hoàn thành xuất sắc {flashcards.length} thẻ trong
                      bộ bài này. Hãy tiếp tục duy trì phong độ nhé!
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={resetProgress}
                        className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50 shadow-sm"
                      >
                        Học lại từ đầu
                      </button>
                      <button
                        onClick={handleReset}
                        className="rounded-xl bg-[#f26522] px-6 py-3 font-medium text-white transition hover:bg-[#d95316] shadow-md shadow-orange-500/20"
                      >
                        Tạo bộ thẻ mới
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
    </div>
  );
}
