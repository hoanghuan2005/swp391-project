import { useCallback, useEffect, useState } from "react";
import { getMyAiUsage } from "@/api/aiUsageApi";

export default function useAiUsage() {
  const [aiUsage, setAiUsage] = useState({
    subscriptionTier: "FREE",
    remainingUsage: null,
    tierLimits: null,
  });
  const [loading, setLoading] = useState(true);

  const refreshAiUsage = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return null;
    }
    try {
      setLoading(true);
      const usage = await getMyAiUsage();
      setAiUsage(usage);
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

    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    getMyAiUsage()
      .then((usage) => {
        if (active) {
          setAiUsage(usage);
        }
      })
      .catch((error) => {
        console.error("Failed to load AI usage:", error);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    ...aiUsage,
    loading,
    refreshAiUsage,
  };
}

