import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  BrainCircuit, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Loader2, 
  Lightbulb,
  Trophy,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

import { getQuizById } from "@/api/quizApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function QuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const fetchQuiz = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getQuizById(id);
      setQuiz(data);
    } catch (error) {
      console.error("Failed to fetch quiz:", error);
      toast.error("Could not load the quiz");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleSelectOption = (questionId, option) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmit = () => {
    const unansweredCount = quiz.questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      toast.error(`Please answer all questions. You missed ${unansweredCount}.`);
      return;
    }

    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setIsSubmitted(true);
    toast.success(`Quiz submitted! Your score: ${correctCount}/${quiz.questions.length}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertCircle className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Quiz not found</h2>
        <Button asChild variant="ghost" className="mt-4 rounded-xl">
          <Link to="/my-library"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-xl text-slate-500 hover:bg-slate-100">
          <Link to="/my-library"><ArrowLeft className="mr-2 h-4 w-4" /> Exit Quiz</Link>
        </Button>
        <Badge variant="outline" className="bg-pink-50 text-pink-500 border-pink-100 px-3 py-1 font-bold rounded-full">
          <BrainCircuit className="w-3.5 h-3.5 mr-1.5" /> AI Generated
        </Badge>
      </div>

      {/* Hero Card */}
      <Card className="rounded-[32px] border-none bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-xl shadow-pink-100 overflow-hidden">
        <CardContent className="p-8 md:p-10 relative">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
              {quiz.title}
            </h1>
            <p className="text-pink-100 font-medium mb-6 opacity-90 max-w-2xl text-lg">
              Test your understanding of the materials provided.
            </p>
            
            {isSubmitted ? (
              <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md rounded-2xl p-4 w-fit border border-white/20">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-orange-400" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-widest text-pink-50">Final Score</div>
                  <div className="text-2xl font-black">{score} / {quiz.questions.length}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-pink-100 font-bold">
                <Lightbulb className="w-5 h-5 text-yellow-300" />
                <span>{quiz.questions.length} Questions</span>
              </div>
            )}
          </div>
          
          {/* Abstract background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-6">
        {quiz.questions.map((question, qIndex) => (
          <Card key={question.id} className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-6 pb-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 font-black text-slate-400">
                  {qIndex + 1}
                </div>
                <CardTitle className="text-lg md:text-xl font-bold text-slate-800 leading-snug pt-1">
                  {question.content}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {question.options.map((option, oIndex) => {
                  const isSelected = answers[question.id] === option;
                  const isCorrect = option === question.correctAnswer;
                  
                  let buttonStyle = "bg-white border-slate-100 hover:border-pink-200 hover:bg-pink-50 text-slate-700";
                  
                  if (isSelected) {
                    buttonStyle = "bg-pink-50 border-pink-500 ring-2 ring-pink-500/10 text-pink-700";
                  }

                  if (isSubmitted) {
                    if (isCorrect) {
                      buttonStyle = "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/10 text-emerald-700 shadow-sm";
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/10 opacity-80";
                    } else {
                      buttonStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => handleSelectOption(question.id, option)}
                      disabled={isSubmitted}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left transition-all relative flex items-center gap-3 group",
                        buttonStyle
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold border transition-all",
                        isSelected ? "bg-pink-500 border-pink-500 text-white" : "bg-slate-50 border-slate-200 text-slate-400 group-hover:border-pink-300"
                      )}>
                        {String.fromCharCode(65 + oIndex)}
                      </div>
                      <span className="font-semibold text-sm md:text-base pr-6">{option}</span>
                      
                      {isSubmitted && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />
                      )}
                      {isSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-500 absolute right-4 top-1/2 -translate-y-1/2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation section */}
              {isSubmitted && (
                <div className="mt-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 text-blue-800 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-blue-500" />
                    <span className="font-bold uppercase tracking-wider text-xs">Explanation</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 flex justify-center">
        {!isSubmitted ? (
          <Button 
            onClick={handleSubmit}
            className="rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black px-12 py-7 text-lg shadow-xl shadow-pink-100 transition-all hover:scale-105 active:scale-95"
          >
            Submit Quiz Results
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button asChild variant="outline" className="rounded-2xl px-8 h-12 font-bold border-slate-200">
              <Link to="/my-library">Back to Library</Link>
            </Button>
            <Button 
              onClick={() => {
                setIsSubmitted(false);
                setAnswers({});
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-bold px-8 h-12"
            >
              Try Quiz Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
