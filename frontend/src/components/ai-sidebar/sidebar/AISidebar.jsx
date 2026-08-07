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
  publicDocuments = [],

  selectedItem,
  selectedDoc,
  selectedDocs,

  onSelectItem,
  onDeleteItem,
  onEditItem,
  onSelectDocument,
  onDeleteDocument,
  onOpenPublicModal,
  onPreviewDocument,

  onCreate,

  searchDocQuery,
  setSearchDocQuery,

  fileInputRef,
  handleUpload,
  isUploading,
  onToggleSidebar,
  className = "w-80",
}) => {
  const config = sidebarConfig[type];

  return (
    <div className={`${className} shrink-0 h-full border-r border-slate-200 bg-white flex flex-col min-w-0`}>
      {/* HEADER */}
      <SidebarHeader config={config} onToggleSidebar={onToggleSidebar} />

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
        onEditItem={onEditItem}
      />

      {/* DOCUMENTS */}
      <SidebarDocuments
        documents={documents}
        publicDocuments={publicDocuments}
        selectedDoc={selectedDoc}
        selectedDocs={selectedDocs}
        onSelectDocument={onSelectDocument}
        onDeleteDocument={onDeleteDocument}
        onOpenPublicModal={onOpenPublicModal}
        onPreviewDocument={onPreviewDocument}
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
