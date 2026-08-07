import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ExternalLink } from "lucide-react";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdfjs worker to reliable cdnjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PdfViewer({ url }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [hasError, setHasError] = useState(false);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    setHasError(false);
  }

  function changePage(offset) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  }

  function zoomOut() {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }

  if (hasError || !url) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-2 bg-slate-100 rounded-xl border border-slate-200">
        <iframe
          src={url}
          title="PDF Preview"
          className="w-full h-[550px] rounded-lg border border-slate-200 bg-white"
        />
        <div className="mt-2.5 flex items-center justify-between w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500">Preview powered by native browser PDF viewer</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f26522] font-bold hover:underline flex items-center gap-1"
          >
            Open in new tab <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
      <div className="flex items-center justify-between w-full p-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={previousPage}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-slate-600">
            {pageNumber} / {numPages || "--"}
          </span>
          <button
            type="button"
            disabled={pageNumber >= numPages}
            onClick={nextPage}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="p-1 rounded hover:bg-slate-100 cursor-pointer"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm font-medium text-slate-600 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            className="p-1 rounded hover:bg-slate-100 cursor-pointer"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      <div className="w-full relative bg-slate-200/50 flex justify-center p-4 min-h-[400px] overflow-auto">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={() => setHasError(true)}
          options={{
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
          }}
          loading={
            <div className="py-20 text-center text-slate-500 font-medium">
              Loading document...
            </div>
          }
          error={
            <div className="py-10 text-center">
              <button
                type="button"
                onClick={() => setHasError(true)}
                className="text-xs font-bold text-[#f26522] hover:underline"
              >
                Switch to Native PDF Viewer
              </button>
            </div>
          }
        >
          {numPages && (
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-sm bg-white"
            />
          )}
        </Document>
      </div>
    </div>
  );
}
