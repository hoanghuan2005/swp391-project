import { useEffect } from "react";

export default function useStudyTimer(onTick) {
  useEffect(() => {
    const startTime = Date.now();
    localStorage.setItem("lastStudyTimeSeconds", "0");

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (onTick) {
        onTick(elapsed);
      }
      
      const lastSeconds = parseInt(localStorage.getItem("lastStudyTimeSeconds") || "0", 10);
      const diff = elapsed - lastSeconds;
      if (diff > 0) {
        const currentTotal = parseInt(localStorage.getItem("studyTimeSeconds") || "0", 10);
        localStorage.setItem("studyTimeSeconds", currentTotal + diff);
        localStorage.setItem("lastStudyTimeSeconds", elapsed.toString());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      localStorage.removeItem("lastStudyTimeSeconds");
    };
  }, [onTick]);
}
