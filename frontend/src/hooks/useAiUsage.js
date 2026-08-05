import { useCallback, useEffect, useState } from "react";
import { getMyAiUsage } from "@/api/aiUsageApi";

export default function useAiUsage() {
  const [aiUsage, setAiUsage] = useState({
    subscriptionTier: "FREE",
    remainingUsage: null,
    tierLimits: null,
    maxSelectedDocs: 2,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseAiUsageResponse = (res) => {
    const planName = res?.planName || "Free Plan";
    const maxUsage = res?.maxDailyAiRequests ?? 0;
    const remainingUsage = res?.remainingUsage ?? 0;
    const usedAiRequestsToday = res?.usedAiRequestsToday ?? 0;
    const isUnlimited = maxUsage === -1 || remainingUsage === -1;

    return {
      planName,
      maxUsage,
      remainingUsage,
      usedAiRequestsToday,
      isUnlimited,
    };
  };

  const calculateMaxSelectedDocs = (data) => {
    if (!data) return 2;
    if (data.maxSelectedDocs != null) return data.maxSelectedDocs;
    if (data.tierLimits?.maxSelectedDocs != null) return data.tierLimits.maxSelectedDocs;
    return data.subscriptionTier === "PRO" ? 4 : 2;
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
      const maxSelectedDocs = calculateMaxSelectedDocs(usage);
      setAiUsage({ ...usage, maxSelectedDocs });
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
            const maxSelectedDocs = calculateMaxSelectedDocs(usage);
            setAiUsage({ ...usage, maxSelectedDocs });
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
    planName: data.planName,
    remainingUsage: data.remainingUsage,
    maxUsage: data.maxUsage,
    usedAiRequestsToday: data.usedAiRequestsToday,
    isUnlimited: data.isUnlimited,
    subscriptionTier: data.planName,
    loading,
    error,
    refreshAiUsage,
  };
}
