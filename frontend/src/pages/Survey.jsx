import React, { useState } from "react";
import { X } from "lucide-react";
import axiosClient from "../api/axiosClient";

export default function Survey() {
  const [school, setSchool] = useState("");
  const [startYear, setStartYear] = useState("");
  const [languages, setLanguages] = useState([]);
  
  // 1. Thêm biến này để kiểm soát việc hiển thị ngay tại chỗ
  const [isVisible, setIsVisible] = useState(true);

  // Nếu isVisible là false, component này sẽ biến mất (trả về null)
  // giúp bạn nhìn thấy trang Admin ở phía sau ngay lập tức
  if (!isVisible) return null;

  const languageOptions = ["English", "Japanese", "Chinese", "Korean", "Vietnamese"];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const toggleLanguage = (lang) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  // Hàm xử lý chung để "tắt" khảo sát
  const closeSurvey = async (data = null) => {
    // 2. Tắt giao diện ngay lập tức để người dùng làm việc tiếp
    setIsVisible(false);

    try {
      // 3. Vẫn âm thầm gửi API để Backend lưu lại (lần sau ko hiện nữa)
      if (data) {
        await axiosClient.put("/api/users/preferences", data);
      } else {
        // Trường hợp Skip: gửi dữ liệu rỗng
        await axiosClient.put("/api/users/preferences", {
          school: null,
          studyStartYear: null,
          preferredLanguages: []
        });
      }
    } catch (error) {
      console.error("Lỗi lưu trạng thái khảo sát:", error);
    }
  };

  const handleSubmit = () => {
    const payload = {
      school: school,
      studyStartYear: startYear ? parseInt(startYear) : null,
      preferredLanguages: languages,
    };
    closeSurvey(payload);
  };

  const handleSkip = () => {
    closeSurvey(); // Gọi hàm tắt mà không truyền data
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-7 shadow-xl">
        {/* Nút X Close */}
        <button 
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer" 
          onClick={handleSkip}
        >
          <X size={22} />
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f26522]">Personalized Learning Survey</h1>
          <p className="mt-2 text-gray-500">Help us recommend better learning materials for you.</p>
        </div>

        {/* Input School */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">School / University</label>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Enter your school"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-black"
          />
        </div>

        {/* Các phần khác giữ nguyên... */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">Start Year</label>
          <select
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-black"
          >
            <option value="">Select year</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        <div className="mb-8">
          <label className="mb-3 block text-sm font-semibold text-gray-700">Languages You Are Learning</label>
          <div className="flex flex-wrap gap-3">
            {languageOptions.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition cursor-pointer ${
                  languages.includes(lang) ? "border-[#f0ac8c] bg-[#f26522] text-white" : "border-gray-300 bg-white text-gray-700 hover:border-black/20"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <button onClick={handleSkip} className="w-full rounded-xl border cursor-pointer border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100">
            Skip for now
          </button>
          <button onClick={handleSubmit} className="w-full rounded-xl bg-[#f26522] cursor-pointer px-4 py-2 font-semibold text-white transition hover:opacity-90">
            Complete Survey
          </button>
        </div>
      </div>
    </div>
  );
}