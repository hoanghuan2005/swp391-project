import React, { useState } from "react";
import { motion } from "framer-motion";

export default function FlashcardItem({ term, definition }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="h-40 w-full cursor-pointer"
      style={{ perspective: "1000px" }} // Hiệu ứng chiều sâu 3D
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }} // Giữ 3D khi lật
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Mặt trước (Term) */}
        <div
          className="absolute w-full h-full bg-white border-2 border-[#f26522] rounded-xl flex items-center justify-center p-4 shadow-md"
          style={{ backfaceVisibility: "hidden" }} // Ẩn mặt sau khi không nhìn thấy
        >
          <p className="font-bold text-lg text-slate-800">{term}</p>
        </div>

        {/* Mặt sau (Definition) */}
        <div
          className="absolute w-full h-full bg-[#f26522] text-white rounded-xl flex items-center justify-center p-4"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-sm">{definition}</p>
        </div>
      </motion.div>
    </div>
  );
}