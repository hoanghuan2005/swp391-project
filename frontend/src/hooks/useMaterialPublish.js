import { useState } from "react";

import axiosClient from "@/api/axiosClient";

export default function useMaterialPublish() {
  const [loading, setLoading] = useState(false);

  const publish = async ({ type, id, courseId, visibility }) => {
    setLoading(true);

    try {
      const endpoint =
        type === "FLASHCARD"
          ? `/api/ai_flashcard/sets/${id}/publish`
          : `/api/quizzes/${id}/publish`;

      await axiosClient.post(endpoint, {
        courseId,
        visibility,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    publish,
  };
}
