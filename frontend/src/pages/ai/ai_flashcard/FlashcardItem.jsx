import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function FlashcardItem({ term, definition }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Thêm sự kiện lắng nghe bàn phím (Enter / Space để lật)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Bỏ qua nếu user đang gõ chữ trong thanh tìm kiếm hoặc textarea
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      // Nhận diện phím Enter hoặc Phím Cách (Space)
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault(); // Ngăn trình duyệt cuộn trang xuống khi bấm Space
        setIsFlipped((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className="h-80 w-full cursor-pointer" // Đã đổi thành h-80 để thẻ to ra
      style={{ perspective: "1000px" }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Mặt trước (Term) */}
        <div
          className="absolute w-full h-full bg-white border-2 border-[#f26522] rounded-2xl flex flex-col items-center justify-center p-8 shadow-md hover:shadow-lg transition-shadow"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="font-bold text-3xl text-slate-800 text-center">{term}</p>
          <span className="absolute bottom-6 text-sm text-slate-400 font-medium">Ấn Enter hoặc Click để lật</span>
        </div>

        {/* Mặt sau (Definition) */}
        <div
          className="absolute w-full h-full bg-[#f26522] text-white rounded-2xl flex flex-col items-center justify-center p-8 shadow-md"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-xl text-center leading-relaxed font-medium">{definition}</p>
        </div>
      </motion.div>
    </div>
  );
}