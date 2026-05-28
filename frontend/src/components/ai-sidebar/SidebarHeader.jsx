// SidebarHeader.jsx
import { ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SidebarHeader = ({ config }) => {
  const navigate = useNavigate();

  return (
    <div className="px-5 py-4 border-b border-slate-100 shrink-0">
      <div className="flex items-center gap-2">
        {(config.type === "flashcard" || config.type === "quiz") && (
          <button
            onClick={() => navigate("/ai-tools")}
            className="flex items-center justify-center -ml-2"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 hover:text-[#f26522] cursor-pointer" />
          </button>
        )}

        <div className="w-10 h-10 rounded-2xl bg-[#f26522]/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#f26522]" />
        </div>

        <div className="leading-tight">
          <h2 className="font-semibold text-slate-800">{config.title}</h2>

          <p className="text-xs text-slate-500">{config.subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
