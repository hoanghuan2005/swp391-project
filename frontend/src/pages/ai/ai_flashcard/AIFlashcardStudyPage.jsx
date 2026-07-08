import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Trophy,
  RotateCcw,
  Heart,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFlashcardSet } from "@/api/flashcardApi";
import { toast } from "react-hot-toast";
import FlashcardItem from "./FlashcardItem";
import axiosClient from "@/api/axiosClient";
import useStudyTimer from "@/hooks/useStudyTimer";

export default function AIFlashcardStudyPage() {
  useStudyTimer();
  const { id } = useParams();
  const navigate = useNavigate();
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchProfileAndSet = async () => {
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

        // 2. Fetch flashcard set
        const res = await getFlashcardSet(id);
        const data = res.data;

        setFlashcardSet(data);
        setIsLiked(data.isFavorite || false);
        setCurrentIndex(0);
        setIsCompleted(false);
      } catch (error) {
        console.error("Failed to load flashcard study session", error);
        toast.error("Failed to load flashcard set data.");
        navigate("/ai-tools");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndSet();
  }, [id, navigate]);

  const handleLikeFlashcard = async () => {
    if (!flashcardSet || !flashcardSet.id) return;
    try {
      await axiosClient.post(`/api/ai_flashcard/${flashcardSet.id}/favorite`);
      setIsLiked(!isLiked);
      if (!isLiked) {
        toast.success("Added to favorites successfully!");
      } else {
        toast.success("Removed from favorites");
      }
    } catch (error) {
      console.error("Like error:", error);
      toast.error("Failed to update favorite status!");
    }
  };

  const handleNext = () => {
    if (!flashcardSet?.flashcards) return;
    if (currentIndex < flashcardSet.flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (isCompleted) {
      setIsCompleted(false);
    } else {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsCompleted(false);
    toast.success("Study progress restarted!");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (flashcardSet?.flashcards && flashcardSet.flashcards.length > 0) {
        if (e.key === "ArrowRight") handleNext();
        else if (e.key === "ArrowLeft") handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isCompleted, flashcardSet]);

  if (loading && !flashcardSet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#f26522]" />
          <p className="text-slate-500 font-medium">Preparing your flashcard set...</p>
        </div>
      </div>
    );
  }

  const flashcardsList = flashcardSet?.flashcards || [];
  const totalCards = flashcardsList.length;
  const progressPercentage = totalCards === 0 ? 0 : (isCompleted ? 100 : ((currentIndex + 1) / totalCards) * 100);

  return (
    <div className="min-h-[calc(100vh-68px)] w-full overflow-y-auto bg-slate-50/50 -mx-8 -my-6 flex flex-col items-center">
      {/* PROGRESS BAR STICKY TOP */}
      {!isCompleted && totalCards > 0 && (
        <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-3.5 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-300">
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-655 shrink-0">
              Progress: <span className="text-[#f26522]">{currentIndex + 1}</span> / {totalCards} cards
            </span>
            <div className="flex-1 max-w-md bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#f26522] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestart}
              className="rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          </div>
        </div>
      )}

      <div className="p-8 w-full max-w-3xl flex-1 flex flex-col justify-start">
        <div className="animate-in fade-in duration-500">
          <Button
            variant="ghost"
            onClick={() => {
              if (flashcardSet?.courseId) {
                navigate(`/courses/${flashcardSet.courseId}`);
              } else {
                navigate("/ai-tools");
              }
            }}
            className="mb-6 text-slate-500 hover:text-[#f26522] rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {flashcardSet?.courseId ? "Back to Course" : "Back to Dashboard"}
          </Button>

          {/* Header Area */}
          <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-[#fffaf7] to-[#fff3eb] overflow-hidden mb-8 shadow-sm">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#f66810] flex items-center justify-center text-white shadow-sm shrink-0">
                    <Layers className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">
                      {flashcardSet?.title || "AI Flashcards Set"}
                    </h1>
                    <p className="text-sm text-slate-505 mt-1">
                      {totalCards} cards • Interactive learning mode
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className={`rounded-full border-orange-200 h-10 px-4 text-sm transition-all cursor-pointer self-start sm:self-auto ${
                    isLiked ? "bg-red-50 hover:bg-red-100 border-red-100 text-red-500" : "hover:bg-orange-50 text-slate-600"
                  }`}
                  onClick={handleLikeFlashcard}
                >
                  <Heart className={`w-4 h-4 mr-1.5 ${isLiked ? "fill-current text-red-500" : "text-slate-550"}`} />
                  {isLiked ? "Favorited" : "Favorite"}
                </Button>
              </div>
            </div>
          </div>

          {/* Flashcard Item Viewer */}
          {isCompleted ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95 duration-500 rounded-[28px] border border-slate-200 bg-white shadow-sm px-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-[#f26522] mb-6 shadow-sm">
                <Trophy className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">
                Congratulations!
              </h2>
              <p className="text-slate-500 max-w-md mb-8 text-lg">
                You have successfully completed studying all {totalCards} cards in this set!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={handleRestart}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 h-12 shadow-sm cursor-pointer"
                  variant="outline"
                >
                  Restart Study
                </Button>
                <Button
                  onClick={() => {
                    if (flashcardSet?.courseId) {
                      navigate(`/courses/${flashcardSet.courseId}`);
                    } else {
                      navigate("/ai-tools");
                    }
                  }}
                  className="rounded-xl bg-[#f26522] hover:bg-[#de5b0b] text-white font-bold px-6 h-12 shadow-sm cursor-pointer"
                >
                  {flashcardSet?.courseId ? "Back to Course" : "Back to Dashboard"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
              <div className="w-full h-80 relative">
                {flashcardsList[currentIndex] && (
                  <FlashcardItem
                    key={currentIndex}
                    term={flashcardsList[currentIndex].term}
                    definition={flashcardsList[currentIndex].definition}
                  />
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="text-lg font-bold text-slate-800 min-w-[100px] text-center">
                  {currentIndex + 1} / {totalCards}
                </span>
                <button
                  onClick={handleNext}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
