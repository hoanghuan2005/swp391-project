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
      
      let lastSeconds = parseInt(localStorage.getItem("lastStudyTimeSeconds") || "0", 10);
      if (isNaN(lastSeconds)) lastSeconds = 0;
      const diff = elapsed - lastSeconds;
      if (diff > 0) {
        let currentTotal = parseInt(localStorage.getItem("studyTimeSeconds") || "0", 10);
        if (isNaN(currentTotal)) {
          currentTotal = 0;
        }
        localStorage.setItem("studyTimeSeconds", (currentTotal + diff).toString());
        localStorage.setItem("lastStudyTimeSeconds", elapsed.toString());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      localStorage.removeItem("lastStudyTimeSeconds");
    };
  }, [onTick]);
}
