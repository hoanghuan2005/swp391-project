import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

import {
  Loader2,
  Brain,
  FileText,
  X,
  Download,
  Upload,
  Image as ImageIcon,
  FileDown,
  FileJson,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import AISidebar from "@/components/ai-sidebar/sidebar/AISidebar";
import AIToolHeader from "@/components/ai-sidebar/AIToolHeader";
import AIGeneratorInput from "@/components/ai-sidebar/AIGeneratorInput";
import useDocuments from "@/hooks/useDocuments";
import axiosClient, { backendBaseUrl } from "@/api/axiosClient";
import { generateMindMap, getMindMapByDocument } from "@/api/mindmapApi";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/* ───────────────────────────────────────────
 * COLOR PALETTE for depth levels
 * ─────────────────────────────────────────── */
const DEPTH_COLORS = [
  {
    bg: "linear-gradient(135deg, #f26522 0%, #e55d1a 100%)",
    text: "#fff",
    border: "#d4540f",
    shadow: "0 4px 14px rgba(242,101,34,0.35)",
  },
  {
    bg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    text: "#fff",
    border: "#4338ca",
    shadow: "0 4px 14px rgba(99,102,241,0.3)",
  },
  {
    bg: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    text: "#fff",
    border: "#0369a1",
    shadow: "0 3px 12px rgba(14,165,233,0.3)",
  },
  {
    bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    text: "#fff",
    border: "#047857",
    shadow: "0 3px 12px rgba(16,185,129,0.3)",
  },
  {
    bg: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    text: "#334155",
    border: "#cbd5e1",
    shadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
];

/* ───────────────────────────────────────────
 * CUSTOM MINDMAP NODE
 * ─────────────────────────────────────────── */
function MindMapNode({ data }) {
  const { label, depth = 0, childrenCount = 0 } = data;
  const style = DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)];

  const isRoot = depth === 0;
  const fontSize = isRoot ? 15 : depth === 1 ? 13 : 12;
  const paddingX = isRoot ? 28 : depth === 1 ? 20 : 16;
  const paddingY = isRoot ? 16 : depth === 1 ? 12 : 10;
  const maxWidth = isRoot ? 280 : depth === 1 ? 220 : 180;
  const borderRadius = isRoot ? 20 : 14;

  return (
    <div
      style={{
        background: style.bg,
        color: style.text,
        border: `2px solid ${style.border}`,
        borderRadius,
        padding: `${paddingY}px ${paddingX}px`,
        fontSize,
        fontWeight: isRoot ? 700 : depth === 1 ? 600 : 500,
        maxWidth,
        textAlign: "center",
        boxShadow: style.shadow,
        transition: "all 0.2s ease",
        cursor: "default",
        lineHeight: 1.4,
        letterSpacing: isRoot ? "0.01em" : 0,
        position: "relative",
      }}
      className="mindmap-node"
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: style.border,
          width: 8,
          height: 8,
          border: `2px solid ${style.text}`,
          opacity: isRoot ? 0 : 1,
        }}
      />

      {isRoot && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            background: "#fbbf24",
            borderRadius: "50%",
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Brain style={{ width: 14, height: 14, color: "#92400e" }} />
        </div>
      )}

      <span>{label}</span>

      {childrenCount > 0 && (
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            opacity: 0.7,
            fontWeight: 400,
          }}
        >
          {childrenCount} branch{childrenCount > 1 ? "es" : ""}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: style.border,
          width: 8,
          height: 8,
          border: `2px solid ${style.text}`,
        }}
      />
    </div>
  );
}

const nodeTypes = { mindmap: MindMapNode };

/* ───────────────────────────────────────────
 * DAGRE LAYOUT
 * ─────────────────────────────────────────── */
const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

function getLayoutedElements(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 60,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/* ───────────────────────────────────────────
 * TREE → REACT FLOW CONVERSION
 * ─────────────────────────────────────────── */
function treeToFlow(tree, parentId = null, depth = 0) {
  const nodes = [];
  const edges = [];

  const nodeId = tree.id || `node-${Math.random().toString(36).slice(2, 9)}`;
  const label = tree.label || tree.name || "Untitled";
  const children = tree.children || [];

  nodes.push({
    id: nodeId,
    type: "mindmap",
    data: {
      label,
      depth,
      childrenCount: children.length,
    },
    position: { x: 0, y: 0 },
  });

  if (parentId) {
    edges.push({
      id: `e-${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
      type: "smoothstep",
      animated: depth <= 1,
      style: {
        stroke: DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)].border,
        strokeWidth: depth === 0 ? 3 : 2,
      },
    });
  }

  children.forEach((child) => {
    const { nodes: childNodes, edges: childEdges } = treeToFlow(
      child,
      nodeId,
      depth + 1
    );
    nodes.push(...childNodes);
    edges.push(...childEdges);
  });

  return { nodes, edges };
}

/* ───────────────────────────────────────────
 * EXPORT DROPDOWN COMPONENT
 * ─────────────────────────────────────────── */
function ExportDropdown({ onExportPNG, onExportPDF, onExportJSON, isExporting }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = [
    {
      label: "Export as PNG",
      sub: "High quality image",
      icon: ImageIcon,
      onClick: () => { onExportPNG(); setOpen(false); },
    },
    {
      label: "Export as PDF",
      sub: "Printable document",
      icon: FileDown,
      onClick: () => { onExportPDF(); setOpen(false); },
    },
    {
      label: "Export as JSON",
      sub: "Re-importable format",
      icon: FileJson,
      onClick: () => { onExportJSON(); setOpen(false); },
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isExporting}
        className="flex items-center gap-1.5 rounded-xl bg-[#f26522] px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#de5b0b] transition disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <item.icon className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────
 * EMPTY STATE COMPONENT
 * ─────────────────────────────────────────── */
function EmptyState({ onImport }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="mb-4 flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50">
        <Brain className="h-10 w-10 text-[#f26522]" />
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-1">
        Create Your Mind Map
      </h3>
      <p className="text-sm text-slate-500 max-w-md leading-relaxed">
        Enter a topic or select a document from your library, then click
        generate to create an interactive mind map powered by AI.
      </p>
      {onImport && (
        <button
          onClick={onImport}
          className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:border-[#f26522] hover:text-[#f26522] transition"
        >
          <Upload className="h-4 w-4" />
          Import from JSON
        </button>
      )}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Powered by AI for intelligent knowledge visualization</span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
 * MAIN PAGE COMPONENT (inner, wrapped by Provider)
 * ─────────────────────────────────────────── */
function AIMindMapPageInner() {
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [libraryDoc, setLibraryDoc] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [mindMapHistory, setMindMapHistory] = useState([]);
  const [selectedMindMap, setSelectedMindMap] = useState(null);
  const [currentTreeData, setCurrentTreeData] = useState(null);

  const {
    documents: uploadedDocuments,
    loading: documentsLoading,
    refreshDocuments,
  } = useDocuments();
  const [searchDocQuery, setSearchDocQuery] = useState("");

  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);
  const navigate = useNavigate();

  const VIEW_MODE = { GENERATE: "GENERATE", VIEW: "VIEW" };
  const [viewMode, setViewMode] = useState(VIEW_MODE.GENERATE);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  /* ── Handlers ─────────────────────────── */
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLibraryDoc(null);
    }
  };

  const handleLibrarySuccess = (selectedDoc) => {
    if (selectedDoc) {
      setLibraryDoc(selectedDoc);
      setFile(null);
    }
  };

  const clearDocument = () => {
    setFile(null);
    setLibraryDoc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const waitForDocumentReady = async (documentId) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await axiosClient.get(`/api/documents/${documentId}`);
      const status = response.data?.aiParseStatus;
      if (status === "READY" || status === "UNSUPPORTED" || !status) return;
      if (status === "FAILED")
        throw new Error("Document text could not be extracted.");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error("Document is still being prepared. Please try again.");
  };

  /* ── Render mindmap from JSON ────────── */
  const renderMindMap = useCallback(
    (jsonContent) => {
      try {
        const tree =
          typeof jsonContent === "string"
            ? JSON.parse(jsonContent)
            : jsonContent;
        setCurrentTreeData(tree);
        const { nodes: rawNodes, edges: rawEdges } = treeToFlow(tree);
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(rawNodes, rawEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (err) {
        console.error("Failed to parse mind map:", err);
        toast.error("Failed to render mind map visualization");
      }
    },
    [setNodes, setEdges]
  );

  /* ── Export: PNG ──────────────────────── */
  const handleExportPNG = useCallback(async () => {
    const viewport = document.querySelector(".react-flow__viewport");
    if (!viewport) { toast.error("Nothing to export"); return; }

    setIsExporting(true);
    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: "#fafbfc",
        pixelRatio: 2,
        filter: (node) => {
          // hide minimap & controls from the export
          if (node?.classList?.contains("react-flow__minimap")) return false;
          if (node?.classList?.contains("react-flow__controls")) return false;
          return true;
        },
      });

      const link = document.createElement("a");
      link.download = `mindmap-${selectedMindMap?.title || "export"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Mind map exported as PNG!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export as PNG");
    } finally {
      setIsExporting(false);
    }
  }, [selectedMindMap]);

  /* ── Export: PDF ──────────────────────── */
  const handleExportPDF = useCallback(async () => {
    const viewport = document.querySelector(".react-flow__viewport");
    if (!viewport) { toast.error("Nothing to export"); return; }

    setIsExporting(true);
    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: "#fafbfc",
        pixelRatio: 2,
        filter: (node) => {
          if (node?.classList?.contains("react-flow__minimap")) return false;
          if (node?.classList?.contains("react-flow__controls")) return false;
          return true;
        },
      });

      const img = new window.Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const imgWidth = img.width;
      const imgHeight = img.height;
      const isLandscape = imgWidth > imgHeight;

      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "px",
        format: [imgWidth, imgHeight],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`mindmap-${selectedMindMap?.title || "export"}.pdf`);
      toast.success("Mind map exported as PDF!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export as PDF");
    } finally {
      setIsExporting(false);
    }
  }, [selectedMindMap]);

  /* ── Export: JSON ─────────────────────── */
  const handleExportJSON = useCallback(() => {
    if (!currentTreeData) { toast.error("Nothing to export"); return; }

    const exportPayload = {
      version: 1,
      title: selectedMindMap?.title || "Mind Map",
      exportedAt: new Date().toISOString(),
      tree: currentTreeData,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `mindmap-${selectedMindMap?.title || "export"}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Mind map exported as JSON!");
  }, [currentTreeData, selectedMindMap]);

  /* ── Import: JSON ─────────────────────── */
  const handleImportJSON = useCallback(
    (e) => {
      const importedFile = e.target.files[0];
      if (!importedFile) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          const tree = parsed.tree || parsed;

          if (!tree.id && !tree.label && !tree.name) {
            toast.error("Invalid mind map JSON format");
            return;
          }

          renderMindMap(tree);
          setSelectedMindMap({
            title: parsed.title || "Imported Mind Map",
            content: JSON.stringify(tree),
          });
          setViewMode(VIEW_MODE.VIEW);
          toast.success("Mind map imported successfully!");
        } catch (err) {
          console.error(err);
          toast.error("Failed to parse JSON file");
        }
      };
      reader.readAsText(importedFile);

      // reset so same file can be imported again
      if (importInputRef.current) importInputRef.current.value = "";
    },
    [renderMindMap, setViewMode]
  );

  /* ── Generate ────────────────────────── */
  const handleGenerate = async () => {
    if (!inputText.trim() && !file && !libraryDoc) {
      toast.error("Please enter a topic, upload a file, or select a document.");
      return;
    }

    setIsGenerating(true);

    try {
      let finalDocumentId = libraryDoc ? libraryDoc.id : null;

      // If a file was uploaded but no document ID, upload it first
      if (file && !finalDocumentId) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        formData.append("visibility", "PRIVATE");
        formData.append("courseCode", "MINDMAP");

        const token = localStorage.getItem("token");
        const uploadResponse = await fetch(
          `${backendBaseUrl}/api/documents/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
        if (!uploadResponse.ok) throw new Error("Upload failed");

        const data = await uploadResponse.json();
        finalDocumentId = data.id;

        await waitForDocumentReady(finalDocumentId);
        window.dispatchEvent(new CustomEvent("documents:uploaded"));
      }

      if (!finalDocumentId) {
        toast.error("Please select a document or upload a file to generate a mind map.");
        return;
      }

      const result = await generateMindMap(finalDocumentId);

      toast.success("Mind map generated successfully!");

      setSelectedMindMap(result);
      renderMindMap(result.content);
      setViewMode(VIEW_MODE.VIEW);

      clearDocument();
      try { await refreshDocuments(); } catch (e) { /* ignore */ }
    } catch (error) {
      console.error("Failed to generate mind map:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to generate mind map. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Select from history ─────────────── */
  const handleSelectMindMap = async (item) => {
    try {
      setIsGenerating(true);
      const result = await getMindMapByDocument(item.documentId);
      setSelectedMindMap(result);
      renderMindMap(result.content);
      setViewMode(VIEW_MODE.VIEW);
    } catch (error) {
      console.error("Failed to load mind map:", error);
      toast.error("Failed to load mind map");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteMindMap = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this mind map?")) return;
    try {
      await axiosClient.delete(`/api/v1/mindmaps/${id}`);
      toast.success("Mind map deleted");
      setMindMapHistory((prev) => prev.filter((m) => m.id !== id));
      if (selectedMindMap?.id === id) {
        setSelectedMindMap(null);
        setNodes([]);
        setEdges([]);
        setViewMode(VIEW_MODE.GENERATE);
      }
    } catch (error) {
      toast.error("Failed to delete mind map");
    }
  };

  const activeDocument = file || libraryDoc;

  /* ── Proactive edge style ──────────── */
  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep",
      style: { strokeWidth: 2 },
    }),
    []
  );

  return (
    <div className="h-[calc(100vh-68px)] overflow-hidden bg-white shadow-sm -mx-8 -my-6 flex">
      {/* SIDEBAR */}
      <AISidebar
        type="mindmap"
        histories={mindMapHistory}
        documents={uploadedDocuments}
        onSelectItem={handleSelectMindMap}
        onDeleteItem={handleDeleteMindMap}
        onCreate={() => {
          setInputText("");
          clearDocument();
          setViewMode(VIEW_MODE.GENERATE);
          setSelectedMindMap(null);
          setNodes([]);
          setEdges([]);
        }}
        onSelectDocument={handleLibrarySuccess}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        fileInputRef={fileInputRef}
        handleUpload={handleFileSelect}
        isUploading={false}
      />

      {/* MAIN CONTENT */}
      <div className="relative flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        {/* Loading overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="relative mb-5">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#f26522] to-[#e55d1a] flex items-center justify-center animate-pulse">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <Loader2 className="absolute -bottom-1 -right-1 h-6 w-6 animate-spin text-[#f26522]" />
            </div>
            <p className="font-semibold text-slate-700 text-lg">
              Generating Mind Map...
            </p>
            <p className="mt-1 text-sm text-slate-500">
              AI is analyzing your document and building the knowledge tree
            </p>
          </div>
        )}

        {/* Header area */}
        <div className="px-6 pt-6 pb-0 shrink-0">
          <AIToolHeader
            icon={Brain}
            title="AI Mind Map Generator"
            description="Transform your documents into interactive mind maps. Visualize and explore knowledge structures."
          />
        </div>

        {/* Content area */}
        {viewMode === VIEW_MODE.GENERATE && (
          <div className="px-6 pb-4 shrink-0">
            <AIGeneratorInput
              value={inputText}
              onChange={setInputText}
              placeholder="Select a document from the sidebar to generate a mind map..."
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              activeDocument={activeDocument}
              clearDocument={clearDocument}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              disabled={!file && !libraryDoc}
            />
          </div>
        )}

        {/* Hidden import input */}
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          onChange={handleImportJSON}
          className="hidden"
        />

        {/* ReactFlow Canvas or Empty State */}
        <div className="flex-1 relative">
          {viewMode === VIEW_MODE.VIEW && nodes.length > 0 ? (
            <>
              {/* Toolbar */}
              <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
                {/* Left side */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setViewMode(VIEW_MODE.GENERATE);
                      setSelectedMindMap(null);
                      setCurrentTreeData(null);
                      setNodes([]);
                      setEdges([]);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-white/90 border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm hover:bg-white transition"
                  >
                    New Mind Map
                  </button>
                  {selectedMindMap && (
                    <div className="rounded-xl bg-white/90 border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm backdrop-blur-sm">
                      <span className="font-medium">{selectedMindMap.title}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        {nodes.length} nodes
                      </span>
                    </div>
                  )}
                </div>

                {/* Right side: Export / Import */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => importInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl bg-white/90 border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm hover:bg-white transition"
                  >
                    <Upload className="h-4 w-4" />
                    Import JSON
                  </button>
                  <ExportDropdown
                    onExportPNG={handleExportPNG}
                    onExportPDF={handleExportPDF}
                    onExportJSON={handleExportJSON}
                    isExporting={isExporting}
                  />
                </div>
              </div>

              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
                minZoom={0.2}
                maxZoom={2}
                attributionPosition="bottom-left"
                proOptions={{ hideAttribution: true }}
                style={{ background: "#fafbfc" }}
              >
                <Controls
                  position="bottom-right"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 4,
                    background: "white",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    padding: 4,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                />
                <MiniMap
                  position="bottom-left"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                  }}
                  nodeColor={(node) => {
                    const depth = node.data?.depth || 0;
                    const colors = [
                      "#f26522",
                      "#6366f1",
                      "#0ea5e9",
                      "#10b981",
                      "#94a3b8",
                    ];
                    return colors[Math.min(depth, colors.length - 1)];
                  }}
                  maskColor="rgba(0,0,0,0.08)"
                />
                <Background
                  color="#e2e8f0"
                  gap={20}
                  size={1}
                  variant="dots"
                />
              </ReactFlow>
            </>
          ) : (
            !isGenerating && viewMode !== VIEW_MODE.VIEW && (
              <EmptyState onImport={() => importInputRef.current?.click()} />
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
 * WRAPPER: provides ReactFlowProvider
 * ─────────────────────────────────────────── */
export default function AIMindMapPage() {
  return (
    <ReactFlowProvider>
      <AIMindMapPageInner />
    </ReactFlowProvider>
  );
}
