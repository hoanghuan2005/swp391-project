import { useCallback, useEffect, useState } from "react";
import { getMyAiUsage } from "@/api/aiUsageApi";

export default function useAiUsage() {
  const [data, setData] = useState({
    planName: "Free Plan",
    remainingUsage: 0,
    maxUsage: 0,
    usedAiRequestsToday: 0,
    isUnlimited: false,
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

  const refreshAiUsage = useCallback(async () => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      setLoading(false);
      return null;
    }
    try {
      setLoading(true);
      setError(null);
      const usage = await getMyAiUsage();
      const parsed = parseAiUsageResponse(usage);
      setData(parsed);
      return parsed;
    } catch (err) {
      console.error("Failed to load AI usage:", err);
      setError(err);
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
            setData(parseAiUsageResponse(usage));
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
