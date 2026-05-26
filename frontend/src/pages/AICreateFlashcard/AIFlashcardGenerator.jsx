import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X, Loader2, Sparkles, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import axiosClient from "@/api/axiosClient";



export default function AIFlashcardGenerator() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (validTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      alert("Vui lòng upload file PDF, TXT hoặc Word (.docx)");
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerateFlashcards = async () => {
    if (!file) return;

    setIsGenerating(true);
    const formData = new FormData();
    formData.append("document", file);

    try {
      const response = await axiosClient.post("/api/ai/flashcards/generate-from-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const generatedCards = response.data.data;

      if (generatedCards && generatedCards.length > 0) {
        setFlashcards(generatedCards);
        setCurrentIndex(0);
        setIsFlipped(false);
      } else {
        alert("AI không tìm thấy nội dung để tạo thẻ. Vui lòng thử file khác!");
      }
    } catch (error) {
      console.error("Lỗi khi tạo flashcard:", error);
      alert("Có lỗi xảy ra khi AI Groq đọc file. Vui lòng thử lại!");
    } finally {
      setIsGenerating(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const resetGenerator = () => {
    setFlashcards([]);
    clearFile();
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-sm border-slate-200">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-[#f26522]" />
           MinDoCu Flashcard
        </CardTitle>
        <CardDescription className="text-slate-500 text-base">
          {flashcards.length === 0
            ? "Upload tài liệu (PDF, Word, TXT) để siêu AI Groq trích xuất thành thẻ học tức thì."
            : "Chúc bạn học tập hiệu quả! Nhấp vào thẻ để lật xem đáp án."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {flashcards.length === 0 && (
          <div className="space-y-6">
            {!file ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
                  ${isDragging ? "border-[#f26522] bg-[#f26522]/5" : "border-slate-300 hover:bg-slate-50"}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.txt,.docx"
                  className="hidden"
                />
                <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4">
                  <UploadCloud className="h-10 w-10 text-[#f26522]" />
                </div>
                <h3 className="font-semibold text-lg text-slate-700 mb-1">
                  Kéo thả tài liệu vào đây
                </h3>
                <p className="text-sm text-slate-500">
                  hoặc click để duyệt file từ máy tính
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-blue-100 p-3 rounded-lg shrink-0">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="truncate">
                    <p className="text-base font-semibold text-slate-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!isGenerating && (
                  <Button variant="ghost" size="icon" onClick={clearFile} className="text-slate-400 hover:text-red-500">
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}

            <Button
              className="w-full h-12 text-lg bg-[#f26522] hover:bg-[#d95316] text-white transition-all"
              disabled={!file || isGenerating}
              onClick={handleGenerateFlashcards}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Groq đang xử lý tài liệu với tốc độ ánh sáng...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Bắt đầu tạo Flashcard
                </>
              )}
            </Button>
          </div>
        )}

        {flashcards.length > 0 && (
          <div className="flex flex-col items-center space-y-6">
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-4 py-1 rounded-full">
              Thẻ {currentIndex + 1} / {flashcards.length}
            </div>

            <div
              className="relative w-full h-80 cursor-pointer group"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ perspective: "1000px" }}
            >
              <div
                className="w-full h-full transition-transform duration-500 relative"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                }}
              >
                <div
                  className="absolute w-full h-full bg-white border-2 border-slate-200 rounded-2xl shadow-md flex flex-col items-center justify-center p-8 text-center"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <h3 className="text-2xl font-bold text-slate-800 leading-relaxed">
                    {flashcards[currentIndex].question}
                  </h3>
                  <div className="absolute bottom-6 text-slate-400 flex items-center gap-1 text-sm font-medium group-hover:text-[#f26522] transition-colors">
                    <RotateCw className="w-4 h-4" /> Click để xem đáp án
                  </div>
                </div>

                <div
                  className="absolute w-full h-full bg-[#f26522]/5 border-2 border-[#f26522]/30 rounded-2xl shadow-md flex flex-col items-center justify-center p-8 text-center overflow-y-auto"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                  }}
                >
                  <p className="text-xl font-medium text-slate-700 leading-relaxed">
                    {flashcards[currentIndex].answer}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full justify-center mt-4">
              <Button variant="outline" size="lg" onClick={prevCard} className="w-32 border-slate-300">
                <ChevronLeft className="w-5 h-5 mr-1" /> Trước
              </Button>
              <Button variant="outline" size="lg" onClick={nextCard} className="w-32 border-slate-300">
                Sau <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>

            <Button variant="ghost" onClick={resetGenerator} className="text-slate-500 hover:text-[#f26522] mt-4">
              <UploadCloud className="w-4 h-4 mr-2" />
              Tạo bộ thẻ khác
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}