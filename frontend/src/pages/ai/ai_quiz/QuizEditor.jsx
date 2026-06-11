import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

export default function QuizEditor({ questions, setQuestions }) {
  const updateQuestion = (index, field, value) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question,
      ),
    );
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) return question;

        const previousOption = question.options[optionIndex];
        const options = question.options.map((option, currentOptionIndex) =>
          currentOptionIndex === optionIndex ? value : option,
        );

        return {
          ...question,
          options,
          correctAnswer:
            question.correctAnswer === previousOption
              ? value
              : question.correctAnswer,
        };
      }),
    );
  };

  const addQuestion = () => {
    setQuestions((current) => [
      ...current,
      {
        content: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
      },
    ]);
  };

  const deleteQuestion = (index) => {
    setQuestions((current) =>
      current.filter((_, questionIndex) => questionIndex !== index),
    );
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={addQuestion}
        className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 p-8 text-center transition hover:border-[#f26522] hover:bg-orange-100"
      >
        <Plus className="mx-auto mb-2 h-6 w-6 text-[#f26522]" />
        <span className="font-medium text-[#f26522]">Add New Question</span>
      </button>

      {questions.map((q, index) => (
        <div
          key={q.id || index}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-[#f26522]/10 px-3 py-1 text-xs font-semibold text-[#f26522]">
              Question {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => deleteQuestion(index)}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete question ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            value={q.content || ""}
            onChange={(event) =>
              updateQuestion(index, "content", event.target.value)
            }
            placeholder="Question content"
            className="min-h-20 rounded-xl text-sm"
          />

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(q.options || []).map((option, optionIndex) => (
              <Input
                key={optionIndex}
                value={option}
                onChange={(event) =>
                  updateOption(index, optionIndex, event.target.value)
                }
                placeholder={`Option ${optionIndex + 1}`}
                className="h-10 rounded-xl text-sm"
              />
            ))}
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Correct answer
            <select
              value={q.correctAnswer || ""}
              onChange={(event) =>
                updateQuestion(index, "correctAnswer", event.target.value)
              }
              className="mt-2 h-10 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus:border-ring"
            >
              <option value="">Select the correct answer</option>
              {(q.options || []).map((option, optionIndex) => (
                <option key={optionIndex} value={option} disabled={!option}>
                  {option || `Option ${optionIndex + 1}`}
                </option>
              ))}
            </select>
          </label>

          <Textarea
            value={q.explanation || ""}
            onChange={(event) =>
              updateQuestion(index, "explanation", event.target.value)
            }
            placeholder="Explanation"
            className="mt-4 min-h-20 rounded-xl text-sm"
          />
        </div>
      ))}
    </div>
  );
}
