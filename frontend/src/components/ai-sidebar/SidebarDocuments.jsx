// SidebarDocuments.jsx

import { Search, Loader2, FileText } from "lucide-react";

const SidebarDocuments = ({
  documents,
  selectedDoc,
  onSelectDocument,

  searchDocQuery,
  setSearchDocQuery,

  fileInputRef,
  handleUpload,
  isUploading,
}) => {
  const filteredDocuments = documents.filter((doc) =>
    (doc.title || doc.name || "")
      .toLowerCase()
      .includes(searchDocQuery.toLowerCase())
  );

  return (
    <div className="flex-[3] flex flex-col min-h-0 bg-slate-50/50">
      {/* HEADER */}
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

      {/* SEARCH */}
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
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
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
          filteredDocuments.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all border text-left cursor-pointer ${
                selectedDoc?.id === doc.id
                  ? "bg-[#f26522]/10 border-[#f26522]/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                <FileText className="w-4 h-4 text-[#f26522]" />
              </div>

              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {doc.title || doc.name}
                </p>

                <p className="text-[10px] text-slate-400 truncate">
                  {doc.courseCode || "General Study"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SidebarDocuments;
