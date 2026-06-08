// AISidebar.jsx

import { Plus } from "lucide-react";

import SidebarHeader from "../sidebar/SidebarHeader";
import SidebarHistory from "../sidebar/SidebarHistory";
import SidebarDocuments from "../sidebar/SidebarDocuments";

import { sidebarConfig } from "./sidebarConfig";

const AISidebar = ({
  type = "ask-ai",

  histories = [],
  documents = [],

  selectedItem,
  selectedDoc,
  selectedDocs,

  onSelectItem,
  onDeleteItem,
  onSelectDocument,
  onDeleteDocument,

  onCreate,

  searchDocQuery,
  setSearchDocQuery,

  fileInputRef,
  handleUpload,
  isUploading,
}) => {
  const config = sidebarConfig[type];

  return (
    <div className="w-[280px] border-r border-slate-200 bg-white flex flex-col">
      {/* HEADER */}
      <SidebarHeader config={config} />

      {/* CREATE BUTTON */}
      <button
        onClick={onCreate}
        className="mx-3 mt-3 mb-1 flex items-center justify-center gap-1 py-2 px-4 rounded-xl border border-dashed border-[#f26522]/40 text-[#f26522] hover:bg-[#f26522]/5 hover:border-[#f26522] transition-all text-sm font-semibold cursor-pointer shrink-0"
      >
        <Plus className="w-4 h-4" />
        {config.createButton}
      </button>

      {/* HISTORY */}
      <SidebarHistory
        title={config.historyTitle}
        items={histories}
        emptyMessage={config.emptyMessage}
        selectedItem={selectedItem}
        onSelectItem={onSelectItem}
        onDeleteItem={onDeleteItem}
      />

      {/* DOCUMENTS */}
      <SidebarDocuments
        documents={documents}
        selectedDoc={selectedDoc}
        selectedDocs={selectedDocs}
        onSelectDocument={onSelectDocument}
        onDeleteDocument={onDeleteDocument}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        fileInputRef={fileInputRef}
        handleUpload={handleUpload}
        isUploading={isUploading}
      />
    </div>
  );
};

export default AISidebar;
