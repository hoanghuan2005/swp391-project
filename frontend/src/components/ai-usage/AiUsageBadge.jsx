import { Badge } from "@/components/ui/badge";

export default function AiUsageBadge({
  subscriptionTier,
  remainingUsage,
  loading = false,
}) {
  if (loading) {
    return <Badge variant="outline">AI usage...</Badge>;
  }

  const isPro = subscriptionTier === "PRO" || remainingUsage === -1;

  return (
    <Badge
      variant={isPro ? "default" : "outline"}
      className={isPro ? "bg-[#f26522] text-white" : ""}
    >
      {isPro
        ? "PRO - Unlimited AI"
        : `FREE - ${remainingUsage ?? "--"} AI left today`}
    </Badge>
  );
}
