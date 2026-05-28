import React, { useRef, useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  X,
  Send,
  BookOpen,
  Plus,
  Search,
  History,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";

import axiosClient from "@/api/axiosClient";
import FlashcardItem from "./FlashcardItem";

export default function AIFlashcardGenerator({ contextData }) {
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSetTitle, setActiveSetTitle] = useState(
    "Generate AI Flashcards"
  );

  const fileInputRef = useRef(null);

  // ================= SIDEBAR DATA =================
  const [flashcardHistory, setFlashcardHistory] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);

  // =================================================
  // LOAD FLASHCARD SET TỪ TRANG NGOÀI
  // =================================================
  useEffect(() => {
    if (contextData && contextData.id) {
      loadFlashcardSet(contextData.id);
    }
  }, [contextData]);

  // =================================================
  // FETCH SIDEBAR DATA
  // =================================================
  // Sửa lại hàm này trong file AIFlashcardGenerator.jsx
  const fetchSidebarData = async () => {
    try {
      setIsSidebarLoading(true);

      const [historyRes, documentsRes] = await Promise.all([
        // ĐÃ SỬA: Thêm /ai/ vào đường dẫn cho khớp với Controller
        axiosClient.get("/api/ai_flashcard/sets"),
        axiosClient.get("/api/ai_flashcard/my-documents"),
      ]);

      setFlashcardHistory(historyRes.data.data || []);
      setUploadedDocuments(documentsRes.data.data || []);
    } catch (error) {
      console.error("Sidebar fetch error:", error);
    } finally {
      setIsSidebarLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarData();
  }, []);

  // =================================================
  // LOAD FLASHCARD SET
  // =================================================
  const loadFlashcardSet = async (setId) => {
    try {
      setIsGenerating(true);

      // Sửa lại đoạn này
      const response = await axiosClient.get(`/api/ai_flashcard/sets/${setId}`);

      const data = response.data.data;

      setActiveSetTitle(data.title);
      setFlashcards(data.flashcards || []);
    } catch (error) {
      console.error("Load set error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // =================================================
  // GENERATE FLASHCARD
  // =================================================
  const handleGenerate = async () => {
    if (!inputText && !file) return;

    setIsGenerating(true);

    try {
      // =============================
      // STEP 1: Tạm tắt API upload để test AI trước
      // =============================
      /* if (file) {
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        uploadForm.append("title", file.name);
        uploadForm.append("visibility", "PRIVATE");

        // Xóa cấu hình headers ở đây nếu sau này bạn mở lại code
        await axiosClient.post("/api/documents/upload", uploadForm);
      }
      */

      // =============================
      // STEP 2: Generate flashcards bằng AI
      // =============================
      const formData = new FormData();

      if (file) formData.append("document", file);
      if (inputText) formData.append("text", inputText);

      const response = await axiosClient.post(
        "/api/ai_flashcard/generate",
        formData

      );

      const result = response.data.data || response.data;

      if (Array.isArray(result)) {
        setFlashcards(result);
        setActiveSetTitle(file?.name || "New Generated Set");

        // Reload lại sidebar để thấy Set mới
        fetchSidebarData();
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

  // =================================================
  // RESET
  // =================================================
  const handleReset = () => {
    setFlashcards([]);
    setInputText("");
    setFile(null);
    setActiveSetTitle("Generate AI Flashcards");
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile); // Lưu file vào state để chuẩn bị gửi lên server
    }
  };
  // =================================================
  // SELECT DOCUMENT
  // =================================================
  const handleSelectDocument = async (doc) => {
    try {
      setIsGenerating(true);

      const response = await axiosClient.post(
        "/api/ai_flashcard/generate-from-document",
        {
          documentId: doc.id,
        }
      );

      const result = response.data.data || [];

      setFlashcards(result);
      setActiveSetTitle(doc.title);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-full">

        {/* ================================================= */}
        {/* SIDEBAR */}
        {/* ================================================= */}
        <div className="hidden w-[290px] shrink-0 flex-col border-r border-slate-200 bg-white md:flex">

          {/* HEADER */}
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50">
                <Sparkles className="h-5 w-5 text-[#f26522]" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-800">
                  AI Flashcards
                </h2>

                <p className="text-xs text-slate-500">
                  Smart study workspace
                </p>
              </div>
            </div>
          </div>

          {/* NEW SET */}
          <div className="p-3">
            <button
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#f26522]/40 py-2.5 text-sm font-medium text-[#f26522] transition hover:border-[#f26522] hover:bg-orange-50"
            >
              <Plus className="h-4 w-4" />
              New Flashcard Set
            </button>
          </div>

          {/* LOADING */}
          {isSidebarLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[#f26522]" />
            </div>
          )}

          {/* HISTORY */}
          {!isSidebarLoading && (
            <>
              <div className="flex min-h-0 flex-1 flex-col border-b border-slate-100">
                <div className="px-5 pb-2">
                  <div className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5 text-slate-400" />

                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Recent Sets
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">

                  {flashcardHistory.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-6">
                      No flashcard sets
                    </p>
                  )}

                  {flashcardHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFlashcardSet(item.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.cards || item.totalCards || 0} cards
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DOCUMENTS */}
              <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50">

                <div className="px-5 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Your Documents
                  </p>
                </div>

                {/* SEARCH */}
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-slate-400" />

                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) =>
                        setSearchQuery(e.target.value)
                      }
                      className="flex-1 bg-transparent text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">

                  {uploadedDocuments
                    .filter((doc) =>
                      doc.title
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleSelectDocument(doc)}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                          <FileText className="h-4 w-4 text-[#f26522]" />
                        </div>

                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {doc.title}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {doc.courseCode || "General"}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ================================================= */}
        {/* MAIN CONTENT */}
        {/* ================================================= */}
        <div className="relative flex-1 overflow-y-auto bg-slate-50/40">

          {/* LOADING */}
          {isGenerating && flashcards.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#f26522]" />

              <p className="font-medium text-slate-600">
                Loading your study set...
              </p>
            </div>
          )}

          <div className="mx-auto max-w-5xl p-6">

            {/* HEADER */}
            <div className="mb-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-medium text-[#f26522]">
                <Sparkles className="h-3.5 w-3.5" />
                AI Powered Learning
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                {activeSetTitle}
              </h1>

              {flashcards.length === 0 && (
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Paste your notes or upload documents to instantly create study flashcards with AI.
                </p>
              )}
            </div>

            {/* GENERATOR */}
            {flashcards.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <textarea
                  rows={6}
                  placeholder="Paste your lesson content..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm outline-none transition focus:border-[#f26522] focus:bg-white"
                />

                {file && (
                  <div className="mt-4 flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 text-[#f26522]" />

                    <span className="max-w-[220px] truncate text-slate-700">
                      {file.name}
                    </span>

                    <button onClick={() => setFile(null)}>
                      <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      handleFileSelect(e);
                    }}
                    className="hidden"
                  />

                  <button
                    onClick={() =>
                      fileInputRef.current.click()
                    }
                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Upload Document
                  </button>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex h-10 items-center gap-2 rounded-xl bg-[#f26522] px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}

                    {isGenerating
                      ? "Generating..."
                      : "Generate Flashcards"}
                  </button>
                </div>
              </div>
            )}

            {/* RESULTS */}
            {flashcards.length > 0 && (
              <div className="mt-4 animate-in slide-in-from-bottom-4 duration-500">

                <div className="mb-5 flex items-center justify-between">

                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      Your Study Cards
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Reviewing {flashcards.length} cards.
                    </p>
                  </div>

                  <div className="flex gap-3">

                    <button
                      onClick={handleReset}
                      className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-medium transition hover:bg-slate-50"
                    >
                      Create New Set
                    </button>

                    <div className="flex items-center rounded-full bg-orange-50 px-4 py-1 text-xs font-medium text-[#f26522]">
                      {flashcards.length} cards
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {flashcards.map((item, index) => (
                    <FlashcardItem
                      key={index}
                      term={item.term}
                      definition={item.definition}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* EMPTY */}
            {!isGenerating && flashcards.length === 0 && (
              <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-20 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                  <BookOpen className="h-7 w-7 text-[#f26522]" />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-700">
                  No flashcards to display
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Upload a document or paste your study notes to generate AI-powered flashcards instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}