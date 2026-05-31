import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosClient from "@/api/axiosClient";
import { toast } from "react-hot-toast";
import AISidebar from "@/components/ai-sidebar/AISidebar";

export default function AIQuizTakePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({}); 
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Sidebar states
  const [quizHistory, setQuizHistory] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const [searchDocQuery, setSearchDocQuery] = useState("");

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
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/api/quizzes/${id}`);
        setQuiz(response.data);
        setIsSubmitted(false);
        setAnswers({});
        setScore(0);
      } catch (error) {
        console.error("Failed to load quiz", error);
        toast.error("Failed to load quiz data.");
        navigate("/ai-tools/ai-quiz");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
    fetchSidebarData();
  }, [id, navigate]);

  const handleSelectOption = (questionId, option) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSelectQuiz = (selectedQuiz) => {
    if (selectedQuiz.id === id) return;
    navigate(`/quiz/${selectedQuiz.id}`);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) {
      return;
    }
    
    try {
      await axiosClient.delete(`/api/quizzes/${quizId}`);
      toast.success("Quiz deleted successfully");
      setQuizHistory((prev) => prev.filter((q) => q.id !== quizId));
      
      // Nếu xóa chính bài đang làm, chuyển về trang generator
      if (quizId === id) {
        navigate("/ai-tools/ai-quiz");
      }
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  const handleCreateNew = () => {
    navigate("/ai-tools/ai-quiz");
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < (quiz?.questions?.length || 0)) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    let calculatedScore = 0;
    quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        calculatedScore++;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);
    // Cuộn lên đầu trang content thay vì toàn bộ window
    const contentArea = document.getElementById("quiz-content-area");
    if (contentArea) contentArea.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#f26522]" />
          <p className="text-slate-500 font-medium">Preparing your exam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-68px)] overflow-hidden bg-white shadow-sm -mx-8 -my-6 flex">
      {/* SIDEBAR */}
      <AISidebar
        type="quiz"
        histories={quizHistory}
        documents={uploadedDocuments}
        selectedItem={quiz ? { id: quiz.id } : null}
        onSelectItem={handleSelectQuiz}
        onDeleteItem={handleDeleteQuiz}
        onCreate={handleCreateNew}
        onSelectDocument={(doc) => {
           // Nếu đang ở trang làm bài mà chọn tài liệu, ta chuyển về trang generator kèm tài liệu đó
           navigate("/ai-tools/ai-quiz", { state: { selectedDoc: doc } });
        }}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        isUploading={false}
      />

      {/* MAIN CONTENT */}
      <div id="quiz-content-area" className="flex-1 overflow-y-auto bg-slate-50/40 p-8">
        {!quiz ? (
          <div className="flex h-full items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-[#f26522]" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/ai-tools")}
              className="mb-6 text-slate-500 hover:text-[#f26522] rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>

            {/* Header / Score Board */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-orange-50 text-[#f26522] rounded-xl shadow-sm">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{quiz.title}</h1>
                </div>
                <p className="text-slate-500 text-sm font-medium">
                  {quiz.questions?.length || 0} Questions • Multiple Choice
                </p>
              </div>

              {isSubmitted && (
                <div className="text-center px-8 py-4 bg-[#f26522]/10 rounded-[20px] border border-[#f26522]/20 shadow-sm animate-in zoom-in duration-300">
                  <p className="text-xs font-bold text-[#f26522] uppercase tracking-widest mb-1">Final Score</p>
                  <p className="text-4xl font-black text-[#f26522]">
                    {score} <span className="text-xl text-[#f26522]/60 font-bold">/ {quiz.questions?.length || 0}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-8">
              {quiz.questions?.map((q, index) => {
                const selectedAnswer = answers[q.id];
                const isCorrect = selectedAnswer === q.correctAnswer;

                return (
                  <div key={q.id} className="bg-white rounded-[24px] p-7 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">
                      <span className="text-[#f26522] mr-3 text-xl font-black opacity-20">{index + 1}</span>
                      {q.content}
                    </h3>

                    <div className="space-y-3">
                      {q.options?.map((option, optIdx) => {
                        const isSelected = selectedAnswer === option;
                        const isActuallyCorrect = isSubmitted && option === q.correctAnswer;
                        const isWrongSelection = isSubmitted && isSelected && !isCorrect;

                        let boxStyles = "border-slate-200 bg-white hover:border-[#f26522]/30 hover:bg-orange-50/20";
                        if (isSelected && !isSubmitted) boxStyles = "border-[#f26522] bg-orange-50/50 ring-1 ring-[#f26522] shadow-sm";
                        if (isActuallyCorrect) boxStyles = "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500 shadow-sm";
                        if (isWrongSelection) boxStyles = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500 shadow-sm";

                        return (
                          <div 
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, option)}
                            className={`p-4.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${boxStyles} ${isSubmitted ? "cursor-default" : ""}`}
                          >
                            <span className="font-semibold text-[15px]">{option}</span>
                            
                            {isActuallyCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                            {isWrongSelection && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Block */}
                    {isSubmitted && (
                      <div className="mt-8 p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50 text-blue-900 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Explanation</p>
                        </div>
                        <p className="text-[15px] leading-relaxed font-medium">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="mt-12 mb-24 flex justify-end gap-4">
              {!isSubmitted ? (
                <Button 
                  size="lg"
                  onClick={handleSubmit} 
                  className="rounded-2xl bg-[#f26522] hover:bg-[#de5b0b] text-white font-bold px-12 h-16 text-lg shadow-lg shadow-[#f26522]/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/ai-tools")} 
                  className="rounded-2xl border-slate-200 bg-white text-slate-700 h-16 px-10 font-bold hover:bg-slate-50 shadow-sm transition-all"
                >
                  Return to Dashboard
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
