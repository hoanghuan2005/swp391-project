import React, { useState } from "react";
import { BookOpen, BrainCircuit, Sparkles, ArrowLeft } from "lucide-react";
import AIFlashcardGenerator from "../AICreateFlashcard/AIFlashcardGenerator.jsx";

const AIQuizPage = () => {
  const [activeView, setActiveView] = useState('menu');

  const tools = [
    {
      id: 'flashcard',
      title: "AI Create Flashcard",
      desc: "Chuyển đổi tài liệu thành thẻ ghi nhớ thông minh.",
      icon: <BookOpen className="h-10 w-10 text-[#f26522]" />,
      enabled: true
    },
    {
      id: 'quiz',
      title: "Create Quiz",
      desc: "Kiểm tra kiến thức với bộ câu hỏi trắc nghiệm.",
      icon: <BrainCircuit className="h-10 w-10 text-slate-400" />,
      enabled: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      
      {/* MÀN HÌNH MENU CHÍNH */}
      {activeView === 'menu' && (
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-800">AI Tool Suite</h1>
            <p className="text-slate-500 text-lg">Nâng cao hiệu suất học tập với trợ lý AI của MinDoCu</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => tool.enabled && setActiveView(tool.id)}
                className={`group p-8 rounded-3xl border transition-all duration-300 
                  ${tool.enabled 
                    ? "bg-white border-slate-200 hover:border-[#f26522] hover:shadow-2xl shadow-lg cursor-pointer hover:-translate-y-2" 
                    : "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"}`}
              >
                <div className="mb-6 bg-slate-100 w-20 h-20 rounded-2xl flex items-center justify-center">
                  {tool.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{tool.title}</h3>
                <p className="text-slate-500 mb-6">{tool.desc}</p>
                {tool.enabled ? (
                  <span className="text-[#f26522] font-semibold flex items-center gap-2">
                    Bắt đầu ngay <Sparkles className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium italic">Sắp ra mắt...</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MÀN HÌNH CÁC CÔNG CỤ (Flashcard/Quiz) */}
      {activeView !== 'menu' && (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
          <button 
            onClick={() => setActiveView('menu')}
            className="flex items-center text-slate-500 hover:text-[#f26522] mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Quay lại Menu
          </button>

          {activeView === 'flashcard' && <AIFlashcardGenerator />}
          {activeView === 'quiz' && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl text-slate-400">Tính năng đang phát triển...</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIQuizPage;