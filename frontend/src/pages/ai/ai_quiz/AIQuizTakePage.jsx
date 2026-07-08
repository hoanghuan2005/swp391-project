import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  RotateCcw,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQuizById } from "@/api/quizApi";
import { toast } from "react-hot-toast";
import axiosClient from "@/api/axiosClient";
import useStudyTimer from "@/hooks/useStudyTimer";

export default function AIQuizTakePage() {
  useStudyTimer();
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchProfileAndQuiz = async () => {
      try {
        setLoading(true);

        // 1. Fetch user profile
        const token = localStorage.getItem("token");
        let user = null;
        if (token) {
          try {
            const profileRes = await axiosClient.get("/api/profile");
            user = profileRes.data;
            setCurrentUser(user);
          } catch (e) {
            console.error("Failed to fetch profile", e);
          }
        }

        // 2. Fetch quiz details
        const quizData = await getQuizById(id);

        setQuiz(quizData);
        setIsSubmitted(false);
        setAnswers({});
        setScore(0);
      } catch (error) {
        console.error("Failed to load quiz study session", error);
        toast.error("Failed to load quiz data.");
        navigate("/ai-tools");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndQuiz();
  }, [id, navigate]);

  const handleSelectOption = (questionId, option) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  // Retake quiz
  const handleRetake = () => {
    setAnswers({});
    setIsSubmitted(false);
    setScore(0);
    const contentArea = document.getElementById("quiz-content-area");
    if (contentArea) contentArea.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Quiz reset. Good luck!");
  };

  // Submit quiz
  const handleSubmit = () => {
    const totalQuestions = quiz?.questions?.length || 0;

    if (Object.keys(answers).length < totalQuestions) {
      toast.error("Please answer all questions before submitting.");

      // Scroll to first unanswered question
      const firstUnansweredIndex = quiz.questions.findIndex(
        (q) => !answers[q.id],
      );
      if (firstUnansweredIndex !== -1) {
        const element = document.getElementById(
          `question-${firstUnansweredIndex}`,
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-4", "ring-red-500/30", "transition-all");
          setTimeout(
            () => element.classList.remove("ring-4", "ring-red-500/30"),
            2000,
          );
        }
      }
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

  const totalQuestions = quiz?.questions?.length || 0;
  const answeredCount = Object.keys(answers).length;
  const progressPercentage =
    totalQuestions === 0 ? 0 : (answeredCount / totalQuestions) * 100;

  return (
    <div className="min-h-[calc(100vh-68px)] w-full overflow-y-auto bg-slate-50/50 -mx-8 -my-6 flex flex-col items-center">
      {/* PROGRESS BAR STICKY TOP */}
      {!isSubmitted && quiz && (
        <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-300">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-655 shrink-0">
              Progress: <span className="text-[#f26522]">{answeredCount}</span> / {totalQuestions}
            </span>
            <div className="flex-1 max-w-md bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#f26522] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={answeredCount === 0}
              className="rounded-xl bg-[#f26522] hover:bg-[#de5b0b] text-white font-semibold cursor-pointer shrink-0"
            >
              Finish
            </Button>
          </div>
        </div>
      )}

      <div
        id="quiz-content-area"
        className="p-8 w-full max-w-4xl flex-1 flex flex-col justify-start scroll-smooth"
      >
        {!quiz ? (
          <div className="flex h-full items-center justify-center flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-[#f26522]" />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <Button
              variant="ghost"
              onClick={() => {
                if (quiz?.courseId) {
                  navigate(`/courses/${quiz.courseId}`);
                } else {
                  navigate("/ai-tools");
                }
              }}
              className="mb-6 text-slate-500 hover:text-[#f26522] rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> {quiz?.courseId ? "Back to Course" : "Back to Dashboard"}
            </Button>

            {/* Header / Score Board */}
            <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-[#fffaf7] to-[#fff3eb] overflow-hidden mb-8 shadow-sm">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#f66810] flex items-center justify-center text-white shadow-sm shrink-0">
                      <BrainCircuit className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">
                        {quiz.title}
                      </h1>
                      <p className="text-sm text-slate-500 mt-1">
                        {totalQuestions} Questions • Multiple Choice
                      </p>
                    </div>
                  </div>

                  {isSubmitted ? (
                    <div className="text-center px-8 py-4 bg-white/80 rounded-[20px] border border-orange-200 shadow-sm animate-in zoom-in duration-300 shrink-0 self-start md:self-auto">
                      <p className="text-xs font-bold text-[#f26522] uppercase tracking-widest mb-1">
                        Final Score
                      </p>
                      <p className="text-4xl font-black text-[#f26522]">
                        {score}{" "}
                        <span className="text-xl text-[#f26522]/60 font-bold">
                          / {totalQuestions}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="rounded-full border-orange-200 hover:bg-orange-50 h-10 px-4 text-sm cursor-pointer self-start md:self-auto"
                      onClick={() => toast.success("Quiz bookmarked!")}
                    >
                      <Heart className="w-4 h-4 mr-1.5 text-slate-550 hover:text-red-500" /> Bookmark
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-8">
              {quiz.questions?.map((q, index) => {
                const selectedAnswer = answers[q.id];
                const isCorrect = selectedAnswer === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    id={`question-${index}`}
                    className="bg-white rounded-[24px] p-7 shadow-xs border border-slate-200 animate-in fade-in duration-300"
                  >
                    <h3 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">
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

                    {/* Explanation Block */}
                    {isSubmitted && q.explanation && (
                      <div className="mt-8 p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50 text-blue-900 animate-in slide-in-from-top-2 duration-300">
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

            {/* Footer Actions */}
            <div className="mt-16 mb-24 flex justify-end gap-4">
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
                    onClick={() => {
                      if (quiz?.courseId) {
                        navigate(`/courses/${quiz.courseId}`);
                      } else {
                        navigate("/ai-tools");
                      }
                    }}
                    className="rounded-xl border-slate-205 bg-white text-slate-700 h-12 px-6 font-bold hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
                  >
                    {quiz?.courseId ? "Back to Course" : "Back to Dashboard"}
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
  );
}
