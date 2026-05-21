import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ url }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
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

  return (
    <div className="flex flex-col items-center bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
      <div className="flex items-center justify-between w-full p-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={previousPage}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
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
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="p-1 rounded hover:bg-slate-100"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm font-medium text-slate-600 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            className="p-1 rounded hover:bg-slate-100"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      <div className="w-full relative bg-slate-200/50 flex justify-center p-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="py-20 text-center text-slate-500">
              Loading document...
            </div>
          }
          error={
            <div className="py-20 text-center text-red-500">
              Failed to load PDF file.
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
