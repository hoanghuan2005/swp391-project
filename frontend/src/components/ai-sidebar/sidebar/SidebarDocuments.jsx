import { Search, Loader2, FileText, CheckCircle2, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";

const SidebarDocuments = ({
  documents = [],
  selectedDoc,
  selectedDocs = [],
  onSelectDocument,
  onDeleteDocument,
  onOpenPublicModal,
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

  // Identify public documents that are currently selected but not in user's own uploads
  const userDocIds = new Set(documents.map((d) => d.id));
  const selectedPublicDocs = selectedDocs.filter((d) => !userDocIds.has(d.id));

  return (
    <div className="flex-[3] flex flex-col min-h-0 bg-slate-50/50 font-sans overflow-x-hidden">
      {/* HEADER & SEARCH BAR */}
      <div className="px-4 py-2.5 flex items-center justify-between shrink-0 border-b border-slate-200/60 bg-white/60">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Your Documents
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const name = file.name.toLowerCase();
              const allowed = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];
              if (!allowed.some((ext) => name.endsWith(ext))) {
                toast.error("Supported file formats: .pdf, .doc, .docx, .ppt, .pptx");
                e.target.value = "";
                return;
              }
            }
            handleUpload?.(e);
          }}
        />
        <div className="flex items-center gap-2">
          {onOpenPublicModal && (
            <button
              onClick={onOpenPublicModal}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-[#f26522] bg-orange-50 border border-orange-200/80 hover:bg-[#f26522] hover:text-white transition-all cursor-pointer shadow-2xs"
              title="Browse public document library"
            >
              <Globe className="w-3 h-3" />
              + Public
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      <div className="px-3 py-2 shrink-0">
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
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                        {doc.courseCode || "General Study"}
                      </p>
                      {doc.aiParseStatus === "PENDING" && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[7px] font-extrabold bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <Loader2 className="w-1.5 h-1.5 animate-spin text-yellow-700" />
                          Processing
                        </span>
                      )}
                      {doc.aiParseStatus === "FAILED" && (
                        <span className="inline-flex items-center px-1 py-0.2 rounded text-[7px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                          Failed
                        </span>
                      )}
                      {doc.aiParseStatus === "UNSUPPORTED" && (
                        <span className="inline-flex items-center px-1 py-0.2 rounded text-[7px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                          Unsupported
                        </span>
                      )}
                    </div>
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

        {/* SELECTED PUBLIC DOCS BADGES */}
        {selectedPublicDocs.length > 0 && (
          <div className="pt-3 mt-2 border-t border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-bold text-[#f26522] uppercase tracking-wider block px-1">
              Selected Public Docs ({selectedPublicDocs.length})
            </span>
            {selectedPublicDocs.map((doc) => (
              <div
                key={doc.id}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-orange-50/90 border border-orange-200/80 text-left min-w-0"
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1 pr-2">
                  <Globe className="w-3.5 h-3.5 text-[#f26522] shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {doc.title || doc.name || "Public Doc"}
                  </span>
                </div>
                <button
                  onClick={() => onSelectDocument(doc)}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 shrink-0 px-1 cursor-pointer"
                  title="Remove from selection"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarDocuments;
