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
    if (localStorage.getItem("isLoggedIn") !== "true") {
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

    if (localStorage.getItem("isLoggedIn") !== "true") {
      setLoading(false);
      return;
    }

    const fetchUsage = () => {
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
    loading,
    refreshAiUsage,
  };
}
