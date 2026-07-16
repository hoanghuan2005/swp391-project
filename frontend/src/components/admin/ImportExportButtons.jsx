import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import axiosClient from "@/api/axiosClient";

export default function ImportExportButtons({
  data = [],
  columns = [],
  filename = "export.xlsx",
  importUrl,
  importMapping, // mapping: e.g. { schoolId: "School", name: "Course name", code: "Course code", description: "Description" }
  importRequiredFields = [],
  onImportSuccess,
}) {
  const fileInputRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  // 1. Export Excel
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export.");
      return;
    }

    try {
      // Build headers
      const headers = columns.map((col) => col.header);
      const aoa = [headers];

      // Build rows
      data.forEach((item) => {
        const row = columns.map((col) => {
          // Render item values
          let val = "";
          if (col.render) {
            // If col.render returns JSX, try to get raw text or skip
            const rendered = col.render(item);
            if (typeof rendered === "string" || typeof rendered === "number") {
              val = String(rendered);
            } else if (rendered && rendered.props && rendered.props.children) {
              val = String(rendered.props.children);
            } else {
              // Fallback: try field from item
              val = "";
            }
          }
          return val;
        });
        aoa.push(row);
      });

      // Create workbook and sheet
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      // Download Excel file
      const safeFilename = filename.replace(/\.csv$/i, ".xlsx");
      XLSX.writeFile(workbook, safeFilename);
      toast.success("Excel exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data.");
    }
  };

  // 2. Parse Excel
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target.result;
      parseExcel(data);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // clear input
  };

  const parseExcel = (data) => {
    try {
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        toast.error("Excel file is empty or missing data.");
        return;
      }

      const parsedData = [];
      const mappingKeys = Object.keys(importMapping);

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const item = {};
        mappingKeys.forEach((key) => {
          const expectedHeaderName = importMapping[key].toLowerCase();
          // Find a key in the row object that matches expectedHeaderName case-insensitively
          const rowKey = Object.keys(row).find((k) => k.toLowerCase() === expectedHeaderName);
          if (rowKey) {
            item[key] = String(row[rowKey] ?? "").trim();
          } else {
            item[key] = "";
          }
        });

        // Validate required fields
        let isValid = true;
        importRequiredFields.forEach((field) => {
          if (!item[field] || item[field].trim() === "") {
            isValid = false;
          }
        });

        if (isValid) {
          parsedData.push(item);
        }
      }

      if (parsedData.length === 0) {
        toast.error("No valid rows found in Excel. Please verify required columns.");
        return;
      }

      setPreviewRows(parsedData);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Excel parse error:", error);
      toast.error("Failed to parse Excel file. Please make sure the format is valid.");
    }
  };

  // 3. Confirm Import
  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      await axiosClient.post(importUrl, previewRows);
      toast.success(`Successfully imported ${previewRows.length} records!`);
      setPreviewOpen(false);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      console.error("Import API error:", error);
      toast.error(error.response?.data?.message || "Failed to import data to backend.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {importUrl && importMapping && (
        <>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-slate-200 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-semibold"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Import Excel
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
        </>
      )}

      <Button
        variant="outline"
        onClick={handleExport}
        className="rounded-xl border-slate-200 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-semibold"
      >
        <Download className="w-4 h-4 text-slate-500" />
        Export Excel
      </Button>

      {/* Import Preview Dialog */}
      {importMapping && <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl bg-white border border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#f26522]">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              Excel Data Preview
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-2">
              Review parsed rows from the Excel file. Checked rows will be imported to the system.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  {Object.keys(importMapping).map((key) => (
                    <TableHead key={key} className="text-slate-600 font-bold text-xs uppercase">
                      {importMapping[key]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, idx) => (
                  <TableRow key={idx}>
                    {Object.keys(importMapping).map((key) => (
                      <TableCell key={key} className="text-sm text-slate-600 max-w-[200px] truncate">
                        {row[key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              disabled={isImporting}
              onClick={() => setPreviewOpen(false)}
              className="rounded-xl border-slate-200 font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={isImporting}
              onClick={handleConfirmImport}
              className="bg-[#f26522] hover:bg-[#d9531a] text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer border-none"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Confirm & Import"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
    </div>
  );
}
