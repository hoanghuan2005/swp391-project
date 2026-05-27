import React, { useState } from "react";
import { BrainCircuit, BookOpen, Settings, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AIQuizGenerator() {
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    // TODO: Connect this to your Spring Boot API
    console.log("Generating quiz for:", { topic, questionCount, difficulty });
    
    // Simulating API wait time
    setTimeout(() => {
      setIsGenerating(false);
      alert("API Hookup Next: Quiz generated! Time to take the test.");
    }, 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#f26522]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BrainCircuit className="w-8 h-8 text-[#f26522]" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Generate AI Quiz</h2>
        <p className="text-slate-500 mt-2">Test your knowledge. Let AI create a custom practice exam for you.</p>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
        
        {/* Topic Input */}
        <div className="mb-8">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
            <BookOpen className="w-4 h-4 text-[#f26522]" /> 
            What do you want to be quizzed on?
          </label>
          <Input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Object Oriented Programming in Java, React Hooks..."
            className="h-14 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-[#f26522] text-base"
          />
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
          disabled={!topic.trim() || isGenerating}
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
  );
}