// SidebarHeader.jsx
import { ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SidebarHeader = ({ config }) => {
  const navigate = useNavigate();
  const isWorkspace = config.type === "project-workspace" || config.type === "ask-ai";

  return (
    <div
      className={
        isWorkspace
          ? "px-2 pt-5.5 pb-4 border-b border-slate-100 shrink-0"
          : "px-5 pt-5.5 pb-4 border-b border-slate-100 shrink-0"
      }
    >
      <div className={`flex items-center ${isWorkspace ? "gap-2 w-full min-w-0" : "gap-2"}`}>
        {(config.type === "flashcard" ||
          config.type === "quiz" ||
          config.type === "mindmap" ||
          config.type === "project-workspace" ||
          config.type === "ask-ai") && (
          <button
            onClick={() => {
              if (isWorkspace) {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/");
                }
              } else {
                navigate("/ai-tools");
              }
            }}
            className={
              isWorkspace
                ? "w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-[#f26522] transition-colors shrink-0"
                : "flex items-center justify-center -ml-2 mr-1"
            }
          >
            <ChevronLeft
              className={
                isWorkspace
                  ? "w-5 h-5 cursor-pointer"
                  : "w-5 h-5 text-slate-600 hover:text-[#f26522] cursor-pointer"
              }
            />
          </button>
        )}

        <div
          className={`w-10 h-10 rounded-2xl bg-[#f26522]/10 flex items-center justify-center ${
            isWorkspace ? "shrink-0" : ""
          }`}
        >
          <Sparkles className="w-5 h-5 text-[#f26522]" />
        </div>

        <div className={isWorkspace ? "leading-tight min-w-0" : "leading-tight"}>
          <h2 className={`font-semibold text-slate-800 ${isWorkspace ? "truncate" : ""}`}>
            {config.title}
          </h2>
          <p className={`text-xs text-slate-500 ${isWorkspace ? "truncate" : ""}`}>
            {config.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
