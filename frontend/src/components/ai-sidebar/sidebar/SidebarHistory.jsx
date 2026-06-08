// SidebarHistory.jsx

import { MessageSquare, Trash2 } from "lucide-react";

const SidebarHistory = ({
  title,
  items,
  emptyMessage,
  selectedItem,
  onSelectItem,
  onDeleteItem,
}) => {
  return (
    <div className="flex-[3] flex flex-col min-h-0 border-b border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 px-5 mb-2 mt-2 uppercase tracking-wider">
        {title}
      </p>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            {emptyMessage}
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className={`group w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                selectedItem?.id === item.id
                  ? "bg-[#f26522]/10 text-[#f26522]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                <MessageSquare className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-[#f26522]" />

                <span className="text-xs font-semibold truncate">
                  {item.title}
                </span>
              </div>

              <button
                onClick={(e) => onDeleteItem(e, item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SidebarHistory;
