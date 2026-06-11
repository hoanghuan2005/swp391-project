import React, { useState } from "react";
import { BookOpen, BrainCircuit, Brain, Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AIFlashcardGenerator from "./ai_flashcard/AIFlashcardGenerator.jsx";
import AIQuizGenerator from "./ai_quiz/AIQuizGenerator.jsx";

const AIQuizPage = () => {
  // Thêm state để lưu trữ bài học được chọn
  const [selectedData, setSelectedData] = useState(null);

  const navigate = useNavigate();

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

  const tools = [
    {
      id: "flashcard",
      title: "AI Flashcards",
      desc: "Generate smart flashcards from your learning materials.",
      icon: <BookOpen className="h-5 w-5 text-[#f26522]" />,
      enabled: true,
    },
    {
      id: "quiz",
      title: "AI Quiz",
      desc: "Practice with AI-generated quizzes and assessments.",
      icon: <BrainCircuit className="h-5 w-5 text-[#f26522]" />,
      enabled: true,
    },
    {
      id: "mindmap",
      title: "AI Mind Map",
      desc: "Transform documents into interactive mind maps for visual learning.",
      icon: <Brain className="h-5 w-5 text-[#f26522]" />,
      enabled: true,
    },
  ];

  const stats = [
    { label: "Study Streak", value: "7", sub: "days 🔥" },
    { label: "Flashcards", value: "124", sub: "+12 today" },
    { label: "Accuracy", value: "86%", sub: "excellent" },
    { label: "Study Time", value: "12h", sub: "this week" },
  ];

  // Thêm 'type' và 'id' vào hoạt động gần đây để biết click vào sẽ mở tool nào
  const recentActivities = [
    {
      id: "activity-1",
      title: "Generated 25 flashcards from Software Engineering.pdf",
      time: "2 hours ago",
      type: "flashcard",
    },
    {
      id: "activity-2",
      title: "Completed Java OOP Quiz with score 18/20",
      time: "Yesterday",
      type: "quiz",
    },
    {
      id: "activity-3",
      title: "Reviewed Networking flashcards",
      time: "2 days ago",
      type: "flashcard",
    },
    {
      id: "activity-4",
      title: "Uploaded Database lecture slides",
      time: "3 days ago",
      type: "flashcard",
    },
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
                Welcome back, An Nugent 👋
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

                <button className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Explore Tools
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="grid min-w-[280px] grid-cols-2 gap-3">
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
        <div>
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => tool.enabled && handleNavigate(tool.id)}
                className={`group rounded-2xl border p-6 transition-all duration-200 ${
                  tool.enabled
                    ? "cursor-pointer border-slate-200 bg-white hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                    : "border-slate-200 bg-slate-100/70 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f26522]/10">
                      {tool.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {tool.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {tool.desc}
                      </p>
                    </div>
                  </div>
                  {!tool.enabled && (
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-500">
                      Soon
                    </span>
                  )}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#f26522]">
                    {tool.enabled ? "Open Tool" : "Coming Soon"}
                  </span>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#f26522]" />
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
                    Java OOP Flashcards
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    68% completed • 42 cards remaining
                  </p>
                </div>
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#f26522]">
                  In Progress
                </span>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-medium text-slate-700">68%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[68%] rounded-full bg-[#f26522]" />
                </div>
              </div>

              {/* UPDATE: Click truyền dữ liệu Java OOP vào Flashcard view */}
              <button
                onClick={() =>
                  handleNavigate("flashcard", {
                    id: "java-oop-1",
                    title: "Java OOP Flashcards",
                  })
                }
                className="mt-5 h-10 w-full rounded-xl bg-[#f26522] text-sm font-medium text-white transition hover:opacity-90"
              >
                Continue Study
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
                    Database Quiz
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Last score: 18/20 • Intermediate
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
                  Completed
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  AI Recommendation
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Review SQL JOIN concepts to improve your score further.
                </p>
              </div>

              {/* UPDATE: Click truyền dữ liệu Database Quiz vào Quiz view */}
              <button
                onClick={() =>
                  handleNavigate("quiz", {
                    id: "db-quiz-1",
                    title: "Database Quiz",
                  })
                }
                className="mt-5 h-10 w-full rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuizPage;
