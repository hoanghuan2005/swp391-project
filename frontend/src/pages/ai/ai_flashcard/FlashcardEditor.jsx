import { Input } from "@/components/ui/input";

export default function FlashcardEditor({ cards, setCards }) {
  const updateCard = (index, field, value) => {
    const clone = [...cards];

    clone[index][field] = value;

    setCards(clone);
  };

  return (
    <div className="space-y-4">
      {cards.map((card, index) => (
        <div key={index} className="border rounded-xl p-4 bg-white">
          <Input
            value={card.term}
            onChange={(e) => updateCard(index, "term", e.target.value)}
            placeholder="Term"
          />

          <textarea
            className="w-full mt-2 border rounded-lg p-2"
            value={card.definition}
            onChange={(e) => updateCard(index, "definition", e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
