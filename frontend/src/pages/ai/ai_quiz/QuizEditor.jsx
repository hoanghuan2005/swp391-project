export default function QuizEditor({ questions, setQuestions }) {
  return (
    <div className="space-y-4">
      {questions.map((q, index) => (
        <div key={q.id} className="border rounded-xl p-4">
          <input value={q.question} />

          {q.options.map((option) => (
            <div key={option.id}>
              <input value={option.content} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
