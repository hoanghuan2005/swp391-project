<div className="space-y-6">

    <div className="bg-white border rounded-2xl p-6">

        <h2 className="text-2xl font-bold">
            {title}
        </h2>

        <p className="text-slate-500 mt-2">
            {flashcards.length} flashcards generated
        </p>

        <div className="flex gap-3 mt-6">

            <Button variant="outline">
                Save Draft
            </Button>

            <Button variant="outline">
                Publish
            </Button>

            <Button>
                Start Study
            </Button>

        </div>

    </div>

    {flashcards.map((card, index) => (

        <div
            key={index}
            className="bg-white border rounded-xl p-5"
        >
            <h3 className="font-semibold">
                {card.term}
            </h3>

            <p className="text-slate-600 mt-2">
                {card.definition}
            </p>
        </div>

    ))}

</div>