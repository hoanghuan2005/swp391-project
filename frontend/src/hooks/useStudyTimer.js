import { useEffect } from "react";

export default function useStudyTimer() {
  useEffect(() => {
    const startTime = Date.now();

    const handleSaveTime = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed > 0) {
        const currentTotal = parseInt(localStorage.getItem("studyTimeSeconds") || "0", 10);
        localStorage.setItem("studyTimeSeconds", currentTotal + elapsed);
      }
    };

    window.addEventListener("beforeunload", handleSaveTime);

    return () => {
      handleSaveTime();
      window.removeEventListener("beforeunload", handleSaveTime);
    };
  }, []);
}
