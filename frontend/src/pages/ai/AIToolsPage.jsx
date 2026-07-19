import React, { useState, useEffect } from "react";
import {
  BookOpen,
  BrainCircuit,
  Brain,
  Sparkles,
  ArrowLeft,
  ListChecks,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "@/api/axiosClient";

import AIFlashcardGenerator from "./ai_flashcard/AIFlashcardGenerator.jsx";
import AIQuizGenerator from "./ai_quiz/AIQuizGenerator.jsx";

const AIQuizPage = () => {
  // Thêm state để lưu trữ bài học được chọn
  const [selectedData, setSelectedData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [studyTime, setStudyTime] = useState("0s");
  const [recentFlashcard, setRecentFlashcard] = useState(null);
  const [recentQuiz, setRecentQuiz] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Dynamic stats states
  const [streakDays, setStreakDays] = useState(1);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [flashcardsToday, setFlashcardsToday] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentHistory = async () => {
      try {
        setLoadingHistory(true);
        const [flashcardsRes, quizzesRes] = await Promise.all([
          axiosClient.get("/api/ai_flashcard/sets"),
          axiosClient.get("/api/quizzes/my-quizzes"),
        ]);
        
        const flashcards = flashcardsRes.data || [];
        if (flashcards.length > 0) {
          setRecentFlashcard(flashcards[0]);
          
          // Calculate total flashcards count
          const total = flashcards.reduce((sum, s) => sum + (s.cards || s.flashcards?.length || 0), 0);
          setTotalFlashcards(total);

          // Calculate flashcards created today
          const todayStr = new Date().toDateString();
          const todayTotal = flashcards
            .filter(s => s.createdAt && new Date(s.createdAt).toDateString() === todayStr)
            .reduce((sum, s) => sum + (s.cards || s.flashcards?.length || 0), 0);
          setFlashcardsToday(todayTotal);
        }
        
        const quizzes = quizzesRes.data || [];
        if (quizzes.length > 0) {
          quizzes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRecentQuiz(quizzes[0]);
        }
      } catch (error) {
        console.error("Failed to load history on AIToolsPage:", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchRecentHistory();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get("/api/profile");
        setUserProfile(res.data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };
    fetchProfile();

    // Study Time Calculation
    let seconds = parseInt(localStorage.getItem("studyTimeSeconds") || "0", 10);
    if (isNaN(seconds)) seconds = 0;
    if (seconds < 60) {
      setStudyTime(`${seconds}s`);
    } else if (seconds < 3600) {
      setStudyTime(`${Math.floor(seconds / 60)}m`);
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      setStudyTime(`${hours}h ${minutes}m`);
    }

    // Study Streak Calculation
    const today = new Date();
    const todayStr = today.toDateString();
    
    let currentStreak = parseInt(localStorage.getItem("study_streak_count") || "0", 10);
    const lastStudyDate = localStorage.getItem("last_study_date");
    
    if (!lastStudyDate) {
      currentStreak = 1;
      localStorage.setItem("study_streak_count", "1");
      localStorage.setItem("last_study_date", todayStr);
    } else {
      const lastDate = new Date(lastStudyDate);
      const diffTime = today.setHours(0,0,0,0) - lastDate.setHours(0,0,0,0);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (todayStr !== lastStudyDate) {
        if (diffDays === 1) {
          // Increment streak if studied yesterday
          currentStreak += 1;
          localStorage.setItem("study_streak_count", currentStreak.toString());
          localStorage.setItem("last_study_date", todayStr);
        } else if (diffDays > 1) {
          // Reset streak if missed a day
          currentStreak = 1;
          localStorage.setItem("study_streak_count", "1");
          localStorage.setItem("last_study_date", todayStr);
        }
      }
    }
    setStreakDays(currentStreak || 1);
  }, []);

  const handleNavigate = (view, data = null) => {
    if (view === "flashcard") {
      navigate("/ai-tools/ai-flashcard", {
        state: { selectedData: data },
      });
    }

    if (view === "quiz") {
      navigate("/ai-tools/ai-quiz", {
        state: { selectedData: data },
      });
    }

    if (view === "mindmap") {
      navigate("/ai-tools/ai-mindmap", {
        state: { selectedData: data },
      });
    }
  };

  const getFlashcardProgress = () => {
    if (!recentFlashcard) return 0;
    const progress = localStorage.getItem(`flashcard_progress_${recentFlashcard.id}`);
    return progress ? parseInt(progress, 10) : 0;
  };
  const flashcardProgress = getFlashcardProgress();

  const tools = [
    {
      id: "flashcard",
      title: "AI Flashcards",
      desc: "Generate smart flashcards from your learning materials.",
      icon: <Layers className="h-6 w-6 text-[#f26522]" />,
      enabled: true,
    },
    {
      id: "quiz",
      title: "AI Quiz",
      desc: "Practice with AI-generated quizzes and assessments.",
      icon: <ListChecks className="h-6 w-6 text-[#f26522]" />,
      enabled: true,
    },
    {
      id: "mindmap",
      title: "AI Mind Map",
      desc: "Transform documents into interactive mind maps for visual learning.",
      icon: <Brain className="h-6 w-6 text-[#f26522]" />,
      enabled: true,
    },
  ];

  const stats = [
    { label: "Study Streak", value: streakDays.toString(), sub: "days 🔥" },
    { label: "Flashcards", value: totalFlashcards.toString(), sub: `+${flashcardsToday} today` },
    { label: "Study Time", value: studyTime, sub: "total time" },
  ];

  return (
    <div className="min-h-screen px-4 py-6">
      {/* ================= MENU ================= */}
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ================= HERO ================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT */}
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-medium text-[#f26522]">
                <Sparkles className="h-3.5 w-3.5" />
                AI Learning Workspace
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                Welcome back, {userProfile?.fullName?.replace(/_/g, " ") || "User"} 👋
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Continue studying with AI-generated flashcards, quizzes, and
                personalized learning recommendations.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {/* UPDATE: Click mở bài học gần nhất (ví dụ: flashcard) */}
                <button
                  onClick={() =>
                    handleNavigate("flashcard", {
                      id: "latest",
                      title: "Latest Study",
                    })
                  }
                  className="h-10 rounded-xl bg-[#f26522] px-4 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Continue Learning
                </button>

                <button
                  onClick={() => {
                    document.getElementById("ai-tools-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Explore Tools
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="grid min-w-[280px] grid-cols-3 gap-3">
              {stats.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-800">
                    {item.value}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= AI TOOLS ================= */}
        <div id="ai-tools-section">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">
                AI Study Tools
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a tool to continue your learning.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => tool.enabled && handleNavigate(tool.id)}
                className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                  tool.enabled
                    ? "cursor-pointer border-slate-100 shadow-sm bg-white hover:-translate-y-1 hover:shadow-md"
                    : "select-none border-slate-100 bg-slate-50/70 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                        tool.enabled
                          ? "bg-[#f26522]/10 text-[#f26522] group-hover:text-white"
                          : "bg-slate-200/60 text-slate-400"
                      }`}
                    >
                      {tool.icon}
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-800 transition-colors duration-200 group-hover:text-[#f26522]">
                        {tool.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500 line-clamp-2">
                        {tool.desc}
                      </p>
                    </div>
                  </div>

                  {/* Badge "Soon" thanh lịch hơn */}
                  {!tool.enabled && (
                    <span className="shrink-0 rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Soon
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <span
                    className={`text-sm font-semibold ${
                      tool.enabled
                        ? "text-slate-600 group-hover:text-[#f26522]"
                        : "text-slate-400"
                    }`}
                  >
                    {tool.enabled ? "Open Tool" : "Coming Soon"}
                  </span>

                  {tool.enabled && (
                    <ArrowLeft className="h-4 w-4 rotate-180 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#f26522]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= CONTINUE LEARNING ================= */}
        <div>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Continue Learning
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pick up where you left off.
              </p>
            </div>
            <button className="text-sm font-medium text-[#f26522] hover:underline">
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* FLASHCARD */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
                    <BookOpen className="h-5 w-5 text-[#f26522]" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {recentFlashcard ? recentFlashcard.title : "No Flashcard Decks"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {recentFlashcard 
                      ? `${recentFlashcard.cards || recentFlashcard.flashcards?.length || 0} cards generated`
                      : "Create custom study decks with AI."}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  recentFlashcard 
                    ? (recentFlashcard.savedToLibrary ? "bg-green-50 text-green-600" : "bg-orange-50 text-[#f26522]")
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {recentFlashcard 
                    ? (recentFlashcard.savedToLibrary ? "Saved" : "Draft")
                    : "Inactive"}
                </span>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-medium text-slate-700">
                    {recentFlashcard ? `${flashcardProgress}%` : "0%"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className="h-full rounded-full bg-[#f26522] transition-all duration-300 ease-out" 
                    style={{ width: `${recentFlashcard ? flashcardProgress : 0}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (recentFlashcard?.id) {
                    navigate(`/ai-tools/ai-flashcard?id=${recentFlashcard.id}`);
                  } else {
                    navigate("/ai-tools/ai-flashcard");
                  }
                }}
                className="mt-5 h-10 w-full rounded-xl bg-[#f26522] text-sm font-medium text-white transition hover:opacity-90"
              >
                {recentFlashcard ? "Continue Study" : "Create Flashcard"}
              </button>
            </div>

            {/* QUIZ */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f26522]/10">
                    <BrainCircuit className="h-5 w-5 text-[#f26522]" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {recentQuiz ? recentQuiz.title : "No Quizzes"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {recentQuiz
                      ? `${recentQuiz.questions?.length || 0} questions generated`
                      : "Assess your knowledge with AI quizzes."}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  recentQuiz
                    ? (recentQuiz.savedToLibrary ? "bg-green-50 text-green-600" : "bg-orange-50 text-[#f26522]")
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {recentQuiz
                    ? (recentQuiz.savedToLibrary ? "Saved" : "Draft")
                    : "Inactive"}
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  {recentQuiz ? "Creation Info" : "AI Recommendation"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {recentQuiz
                    ? `Created on ${new Date(recentQuiz.createdAt).toLocaleDateString("en-US", {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}.`
                    : "Generate custom quizzes from documents to study effectively."}
                </p>
              </div>

              <button
                onClick={() => {
                  if (recentQuiz?.id) {
                    navigate(`/ai-tools/ai-quiz?id=${recentQuiz.id}`);
                  } else {
                    navigate("/ai-tools/ai-quiz");
                  }
                }}
                className="mt-5 h-10 w-full rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {recentQuiz ? "Continue Study" : "Create Quiz"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuizPage;
