import React, { useState, useRef, useEffect } from "react";
import { 
  BrainCircuit, 
  BookOpen, 
  Settings, 
  Loader2, 
  Target, 
  UploadCloud, 
  Library, 
  FileText, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SelectExistingDocumentModal from "@/components/documents/SelectExistingDocument";
import AISidebar from "@/components/ai-sidebar/AISidebar";
import axiosClient from "@/api/axiosClient";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function AIQuizGenerator() {
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [libraryDoc, setLibraryDoc] = useState(null); 
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  
  // Sidebar states
  const [quizHistory, setQuizHistory] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const [searchDocQuery, setSearchDocQuery] = useState("");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch sidebar data
  const fetchSidebarData = async () => {
    try {
      setIsSidebarLoading(true);
      const [historyRes, documentsRes] = await Promise.all([
        axiosClient.get("/api/quizzes/my-quizzes"),
        axiosClient.get("/api/documents/my-uploads"),
      ]);
      setQuizHistory(historyRes.data || []);
      setUploadedDocuments(documentsRes.data || []);
    } catch (error) {
      console.error("Sidebar fetch error:", error);
    } finally {
      setIsSidebarLoading(false);
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

  const handleLibrarySelect = () => {
    setIsLibraryModalOpen(true);
  };

  const handleLibrarySuccess = (selectedDoc) => {
    if (selectedDoc) {
      setLibraryDoc(selectedDoc);
      setFile(null);
      setIsLibraryModalOpen(false);
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

  const handleGenerateQuiz = async () => {
    if (!inputText.trim() && !file && !libraryDoc) {
      toast.error("Please enter a topic, upload a file, or select a document.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      let finalDocumentId = libraryDoc ? libraryDoc.id : null;
      let documentTitle = libraryDoc ? (libraryDoc.title || libraryDoc.name) : null;

      if (file && !finalDocumentId) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        formData.append("visibility", "PRIVATE");
        formData.append("courseCode", "QUIZ");

        const token = localStorage.getItem("token");

        const uploadResponse = await fetch("http://localhost:8080/api/documents/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed with status: " + uploadResponse.status);
        }
        
        const data = await uploadResponse.json();
        finalDocumentId = data.id;
        documentTitle = file.name;

        await new Promise(resolve => setTimeout(resolve, 2000));
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
        topic: inputText.trim() || null
      };
      
      const response = await axiosClient.post("/api/quizzes/generate", payload);
      toast.success("Quiz generated successfully!");
      clearDocument();
      navigate(`/quiz/${response.data.id}`);
      
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      const errorMsg = error.response?.data?.message || "Failed to generate your quiz. Please try again.";
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
      <div className="flex-1 overflow-y-auto bg-slate-50/40 p-8">
        <div className="w-full max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#f26522]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BrainCircuit className="w-8 h-8 text-[#f26522]" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Generate AI Quiz</h2>
            <p className="text-slate-500 mt-2">Test your knowledge. Let AI create a custom practice exam from your materials.</p>
          </div>

          {/* Configuration Form */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
            
            {/* Source Input Area */}
            <div className="mb-8">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <BookOpen className="w-4 h-4 text-[#f26522]" /> 
                What should the quiz be about?
              </label>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#f26522] transition-all bg-slate-50">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your notes, type a topic (e.g., 'Java OOP concepts'), or select a document below..."
                  className="w-full h-24 p-4 bg-transparent outline-none resize-none text-slate-700"
                />
                
                {/* Active Document Indicator */}
                {activeDocument && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg w-fit text-sm animate-in fade-in">
                      <FileText className="h-4 w-4 text-[#f26522]" />
                      <span className="truncate max-w-[200px] font-medium text-slate-700">
                        {activeDocument.title || activeDocument.name}
                      </span>
                      <X 
                        className="h-4 w-4 text-slate-400 cursor-pointer hover:text-red-500 transition-colors" 
                        onClick={clearDocument} 
                      />
                    </div>
                  </div>
                )}
                
                {/* Document Action Bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-100">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600 h-9" 
                    onClick={() => fileInputRef.current.click()}
                  >
                    <UploadCloud className="h-4 w-4 mr-2 text-slate-400" /> 
                    Upload File
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600 h-9" 
                    onClick={handleLibrarySelect}
                  >
                    <Library className="h-4 w-4 mr-2 text-slate-400" /> 
                    Choose from Library
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Question Count */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <Target className="w-4 h-4 text-[#f26522]" /> 
                  Number of Questions
                </label>
                <div className="flex gap-3">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuestionCount(num)}
                      className={`flex-1 h-12 rounded-xl border font-semibold transition-all ${
                        questionCount === num 
                          ? "border-[#f26522] bg-orange-50 text-[#f26522]" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <Settings className="w-4 h-4 text-[#f26522]" /> 
                  Difficulty
                </label>
                <div className="flex gap-3">
                  {["Easy", "Medium", "Hard"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 h-12 rounded-xl border font-semibold transition-all ${
                        difficulty === level 
                          ? "border-[#f26522] bg-orange-50 text-[#f26522]" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Action */}
            <Button 
              onClick={handleGenerateQuiz}
              disabled={(!inputText.trim() && !file && !libraryDoc) || isGenerating}
              className="w-full h-14 rounded-xl bg-[#f26522] hover:bg-[#de5b0b] text-white font-bold text-lg shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating your quiz...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-5 h-5 mr-2" />
                  Create My Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Library Selection Modal */}
      <SelectExistingDocumentModal 
        open={isLibraryModalOpen}
        onOpenChange={setIsLibraryModalOpen}
        onSuccess={handleLibrarySuccess}
      />
    </div>
  );
}