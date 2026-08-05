import { ChevronLeft, Sparkles, PanelLeftClose } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SidebarHeader = ({ config, onToggleSidebar }) => {
  const navigate = useNavigate();
  const isWorkspace = config.type === "project-workspace" || config.type === "ask-ai";

  return (
    <div
      className={
        isWorkspace
          ? "px-3 pt-4 pb-3 border-b border-slate-100 shrink-0"
          : "px-5 pt-4 pb-3 border-b border-slate-100 shrink-0"
      }
    >
      <div className="flex items-center gap-2 w-full min-w-0">
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
          className={`w-9 h-9 rounded-2xl bg-[#f26522]/10 flex items-center justify-center shrink-0`}
        >
          <Sparkles className="w-4 h-4 text-[#f26522]" />
        </div>

        <div className="leading-tight flex-1 min-w-0">
          <h2 className="font-semibold text-slate-800 text-sm truncate">
            {config.title}
          </h2>
          <p className="text-[11px] text-slate-500 truncate">
            {config.subtitle}
          </p>
        </div>

        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-auto cursor-pointer shrink-0 border-none bg-transparent shadow-none"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SidebarHeader;
