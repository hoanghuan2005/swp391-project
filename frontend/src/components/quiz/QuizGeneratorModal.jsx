import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Loader2, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateQuiz } from "@/api/quizApi";

export default function QuizGeneratorModal({ open, onOpenChange, documentId, projectId }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for the quiz");
      return;
    }

    try {
      setLoading(true);
      const request = {
        title: title.trim(),
        documentId: documentId || null,
        projectId: projectId || null,
      };

      const newQuiz = await generateQuiz(request);
      toast.success("AI has generated your quiz!");
      
      onOpenChange(false);
      // Navigate to quiz taking page (assuming route will be /quiz/:id)
      navigate(`/quiz/${newQuiz.id}`);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      toast.error(error.response?.data?.message || "Failed to generate quiz. AI is currently busy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center mb-4">
            <BrainCircuit className="w-6 h-6 text-pink-500" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            AI Quiz Generator <Sparkles className="w-4 h-4 text-orange-400 fill-orange-400" />
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Our AI will analyze your material and create 5 challenging multiple-choice questions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGenerate} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="quiz-title" className="font-semibold text-slate-700">
              Quiz Title
            </Label>
            <Input
              id="quiz-title"
              placeholder="e.g., Software Engineering Concepts"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-xl focus-visible:ring-pink-500"
              autoFocus
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold min-w-[160px] shadow-lg shadow-pink-100 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI is generating...
                </>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
