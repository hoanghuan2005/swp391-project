import { useCallback, useEffect, useState } from "react";
import { getMyAiUsage } from "@/api/aiUsageApi";

export default function useAiUsage() {
  const [aiUsage, setAiUsage] = useState({
    subscriptionTier: "FREE",
    planName: "Free Plan",
    maxUsage: 5,
    remainingUsage: 5,
    usedAiRequestsToday: 0,
    isUnlimited: false,
    maxSelectedDocs: 2,
    maxPersonalDocs: 2,
    maxWorkspaceDocs: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const processUsage = (usageData) => {
    if (!usageData) return;
    
    const maxUsage = usageData.maxDailyAiRequests ?? 0;
    const remainingUsage = usageData.remainingUsage ?? 0;
    const isUnlimited = maxUsage === -1 || remainingUsage === -1;

    setAiUsage({
      ...usageData,
      maxUsage,
      isUnlimited,
      maxSelectedDocs: usageData.maxSelectedDocs ?? 2,
      maxPersonalDocs: usageData.maxPersonalDocs ?? 2,
      maxWorkspaceDocs: usageData.maxWorkspaceDocs ?? 10,
    });
  };

  const refreshAiUsage = useCallback(async () => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      setLoading(false);
      return null;
    }
    try {
      setLoading(true);
      setError(null);
      const usage = await getMyAiUsage();
      processUsage(usage);
      return usage;
    } catch (error) {
      console.error("Failed to load AI usage:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    if (localStorage.getItem("isLoggedIn") !== "true") {
      setLoading(false);
      return;
    }

    const fetchUsage = () => {
      setError(null);
      getMyAiUsage()
        .then((usage) => {
          if (active) {
            processUsage(usage);
          }
        })
        .catch((err) => {
          if (active) {
            console.error("Failed to load AI usage:", err);
            setError(err);
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
    };

    fetchUsage();

    const handleUpdate = () => {
      fetchUsage();
    };

    window.addEventListener("subscription-success", handleUpdate);
    window.addEventListener("subscription:updated", handleUpdate);

    return () => {
      active = false;
      window.removeEventListener("subscription-success", handleUpdate);
      window.removeEventListener("subscription:updated", handleUpdate);
    };
  }, []);

  return {
    ...aiUsage,
    subscriptionTier: aiUsage.subscriptionTier || "FREE",
    loading,
    error,
    refreshAiUsage,
  };
}
