import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    description: "For trying Study Hub AI features.",
    features: ["Daily AI request limit", "Ask AI", "Quiz and flashcard generation"],
    action: "Current plan",
  },
  {
    name: "Pro",
    description: "For frequent study sessions.",
    features: ["Unlimited AI requests", "Ask AI", "Quiz and flashcard generation"],
    action: "Upgrade coming soon",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Plans</h1>
        <p className="mt-2 text-slate-500">
          Choose the AI usage level that fits your study routine.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
            <ul className="my-6 space-y-2 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature}>- {feature}</li>
              ))}
            </ul>
            <Button className="w-full" disabled>
              {plan.action}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
