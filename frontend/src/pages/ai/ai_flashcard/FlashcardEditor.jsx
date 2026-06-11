import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default function FlashcardEditor({ cards, setCards }) {
  const updateCard = (index, field, value) => {
    setCards((current) =>
      current.map((card, cardIndex) =>
        cardIndex === index ? { ...card, [field]: value } : card,
      ),
    );
  };

  const addCard = () => {
    setCards((current) => [...current, { term: "", definition: "" }]);
  };

  const deleteCard = (index) => {
    setCards((current) =>
      current.filter((_, cardIndex) => cardIndex !== index),
    );
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={addCard}
        className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 p-8 text-center transition hover:border-[#f26522] hover:bg-orange-100"
      >
        <Plus className="mx-auto mb-2 h-6 w-6 text-[#f26522]" />
        <span className="font-medium text-[#f26522]">Add New Card</span>
      </button>

      {cards.map((card, index) => (
        <div
          key={card.id || index}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#f26522]/80">
              Card {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => deleteCard(index)}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete card ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Input
            value={card.term || ""}
            onChange={(e) => updateCard(index, "term", e.target.value)}
            placeholder="Term"
            className="h-11 rounded-xl text-sm"
          />

          <Textarea
            className="mt-3 min-h-24 rounded-xl text-sm"
            value={card.definition || ""}
            onChange={(e) => updateCard(index, "definition", e.target.value)}
            placeholder="Definition"
          />
        </div>
      ))}
    </div>
  );
}
