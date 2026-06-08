import { Search, Loader2, FileText, CheckCircle2, Trash2 } from "lucide-react";

const SidebarDocuments = ({
  documents,
  selectedDoc,
  selectedDocs = [],
  onSelectDocument,
  onDeleteDocument, // NEW: Optional deletion handler
  searchDocQuery,
  setSearchDocQuery,
  fileInputRef,
  handleUpload,
  isUploading,
}) => {
  const filteredDocuments = documents.filter((doc) =>
    (doc.title || doc.name || "")
      .toLowerCase()
      .includes(searchDocQuery.toLowerCase()),
  );

  return (
    <div className="flex-[3] flex flex-col min-h-0 bg-slate-50/50 font-sans overflow-x-hidden">
      {/* HEADER & SEARCH BAR */}
      <div className="px-5 py-2.5 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Your Documents
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <div className="px-3 pb-2 shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchDocQuery}
            onChange={(e) => setSearchDocQuery(e.target.value)}
            className="bg-transparent outline-none text-xs flex-1 text-slate-700"
          />
        </div>
      </div>

      {/* DOCUMENT LIST */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 space-y-1.5">
        {isUploading && (
          <div className="flex items-center gap-2 p-2 justify-center text-xs text-[#f26522]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Parsing document...
          </div>
        )}

        {filteredDocuments.length === 0 && !isUploading ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No documents found
          </p>
        ) : (
          filteredDocuments.map((doc) => {
            const isSelected =
              selectedDoc?.id === doc.id ||
              selectedDocs.some((d) => d.id === doc.id);
            const title = doc.title || doc.name || "";
            const isLongTitle = title.length > 28;

            return (
              <div
                key={doc.id}
                className="group w-full flex items-center justify-between relative min-w-0"
              >
                <button
                  onClick={() => onSelectDocument(doc)}
                  className={`flex-1 min-w-0 flex items-center gap-2.5 p-2 rounded-xl transition-all border text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#f26522]/10 border-[#f26522]/30 ring-1 ring-[#f26522]/20"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? "bg-[#f26522] border-[#f26522]"
                        : "bg-orange-50 border-orange-100"
                    }`}
                  >
                    <FileText
                      className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#f26522]"}`}
                    />
                  </div>

                  <div className="overflow-hidden flex-1 pr-6 min-w-0">
                    {isLongTitle ? (
                      <div className="doc-title-marquee">
                        <span
                          className={`doc-title-marquee__inner text-xs font-semibold ${
                            isSelected ? "text-[#f26522]" : "text-slate-700"
                          } font-sans`}
                        >
                          {title}
                        </span>
                      </div>
                    ) : (
                      <p
                        className={`text-xs font-semibold truncate ${
                          isSelected ? "text-[#f26522]" : "text-slate-700"
                        } font-sans`}
                      >
                        {title}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                      {doc.courseCode || "General Study"}
                    </p>
                  </div>

                  {isSelected && !onDeleteDocument && (
                    <CheckCircle2 className="w-4 h-4 text-[#f26522] shrink-0" />
                  )}
                </button>

                {/* DELETE ACTIONS BUTTON */}
                {onDeleteDocument && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all border border-slate-100 cursor-pointer z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SidebarDocuments;
