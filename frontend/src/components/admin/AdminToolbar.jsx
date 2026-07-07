import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, SlidersHorizontal, ChevronDown } from "lucide-react";
import ImportExportButtons from "./ImportExportButtons";

export default function AdminToolbar({
  searchVal = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters, // React elements (select dropdowns / blocks)
  activeFiltersCount = 0,
  onClearFilters,
  importUrl,
  importMapping,
  importRequiredFields = [],
  onImportSuccess,
  exportData = [],
  exportColumns = [],
  exportFilename = "export.csv",
  onAddClick,
  addLabel,
  showImport = true,
  showExport = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between w-full">
      {/* Search Input on Left */}
      <div className="relative w-full lg:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={searchVal}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 rounded-xl bg-slate-50 border-transparent focus-visible:ring-[#f26522]/20 focus-visible:border-[#f26522] h-10 w-full"
        />
      </div>

      {/* Filters, Import, Export, Add New in order on Right */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end w-full lg:w-auto flex-wrap">
        {/* 1. Filters Popup Button */}
        {filters && (
          <div className="relative" ref={popoverRef}>
            <Button
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              className={`rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 flex items-center gap-2 h-10 px-4 font-semibold transition-all ${
                isOpen ? "border-[#f26522] ring-1 ring-[#f26522]/20" : ""
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-[#f26522]" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f26522] px-1 text-[10px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </Button>

            {isOpen && (
              <div className="absolute right-0 mt-2 z-50 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="text-sm font-bold text-slate-700">Filter Records</span>
                  <div className="flex items-center gap-2">
                    {onClearFilters && activeFiltersCount > 0 && (
                      <button
                        onClick={() => {
                          onClearFilters();
                          setIsOpen(false);
                        }}
                        className="text-xs font-semibold text-[#f26522] hover:text-[#d95316]"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {filters}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Import & Export Buttons */}
        {(showImport || showExport) && (
          <ImportExportButtons
            data={exportData}
            columns={exportColumns}
            filename={exportFilename}
            importUrl={showImport ? importUrl : undefined}
            importMapping={importMapping}
            importRequiredFields={importRequiredFields}
            onImportSuccess={onImportSuccess}
          />
        )}

        {/* 3. Add New Button */}
        {onAddClick && (
          <Button
            onClick={onAddClick}
            className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] flex items-center gap-2 h-10 px-4 font-semibold border-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {addLabel || "Add New"}
          </Button>
        )}
      </div>
    </div>
  );
}
