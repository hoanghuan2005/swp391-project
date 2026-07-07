import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
  filename = "export.csv",
  importUrl,
  importMapping, // mapping: e.g. { schoolId: "School", name: "Course name", code: "Course code", description: "Description" }
  importRequiredFields = [],
  onImportSuccess,
}) {
  const fileInputRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  // 1. Export CSV
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export.");
      return;
    }

    try {
      // Build headers
      const csvHeaders = columns.map((col) => col.header);
      const csvRows = [csvHeaders.join(",")];

      // Build rows
      data.forEach((item) => {
        const values = columns.map((col) => {
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
              // Fallback: try field from item (if we guess key)
              val = "";
            }
          }
          // Cleanup string values
          val = val.replace(/"/g, '""');
          return `"${val}"`;
        });
        csvRows.push(values.join(","));
      });

      // Download CSV
      const csvContent = "\uFEFF" + csvRows.join("\n"); // add BOM for UTF-8 compatibility in Excel
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data.");
    }
  };

  // 2. Parse CSV
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      parseCSV(text);
    };
    reader.readAsText(file);
    e.target.value = ""; // clear input
  };

  const parseCSV = (text) => {
    try {
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        toast.error("CSV file is empty or missing headers.");
        return;
      }

      // Read header row
      const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());

      const parsedData = [];
      const mappingKeys = Object.keys(importMapping);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Handle split by comma with quotes support
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
        const values = matches.map((v) => v.replace(/^["']|["']$/g, "").trim().replace(/""/g, '"'));

        const item = {};
        mappingKeys.forEach((key) => {
          const csvHeaderName = importMapping[key];
          const headerIdx = headers.findIndex((h) => h.toLowerCase() === csvHeaderName.toLowerCase());
          if (headerIdx !== -1) {
            item[key] = values[headerIdx] || "";
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
        toast.error("No valid rows found in CSV. Please verify required columns.");
        return;
      }

      setPreviewRows(parsedData);
      setPreviewOpen(true);
    } catch (error) {
      console.error("CSV parse error:", error);
      toast.error("Failed to parse CSV. Please make sure the format is valid.");
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
            Import CSV
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
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
        Export CSV
      </Button>

      {/* Import Preview Dialog */}
      {importMapping && <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl bg-white border border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#f26522]">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              CSV Data Preview
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-2">
              Review parsed rows from the CSV file. Checked rows will be imported to the system.
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
