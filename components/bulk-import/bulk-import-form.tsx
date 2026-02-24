"use client";

// ============================================================
// Bulk Import Form — Client Component
// ============================================================
// Drag-and-drop CSV upload with preview, validation, and import.
// ============================================================

import { useState, useCallback, useRef } from "react";
import { bulkImportAction } from "@/app/actions/bulk-import";
import { generateCsvTemplate } from "@/lib/csv/parser";

interface BulkImportFormProps {
  shopSlug: string;
}

type ImportState = "idle" | "preview" | "importing" | "done";

interface PreviewData {
  fileName: string;
  content: string;
  headers: string[];
  rowCount: number;
  sampleRows: string[][];
}

export function BulkImportForm({ shopSlug }: BulkImportFormProps) {
  const [state, setState] = useState<ImportState>("idle");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    imported?: number;
    skipped?: number;
    totalRows?: number;
    error?: string;
    errors?: { row: number; message: string }[];
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setResult({ success: false, error: "Please upload a .csv file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResult({ success: false, error: "File too large. Maximum 5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.trim().split(/\r?\n/);
      const headers = lines[0]?.split(",").map((h) => h.replace(/^"|"$/g, "").trim()) ?? [];
      const sampleRows = lines.slice(1, 6).map((line) =>
        line.split(",").map((v) => v.replace(/^"|"$/g, "").trim()),
      );

      setPreview({
        fileName: file.name,
        content,
        headers,
        rowCount: lines.length - 1,
        sampleRows,
      });
      setState("preview");
      setResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleImport = async () => {
    if (!preview) return;
    setState("importing");

    try {
      const res = await bulkImportAction(shopSlug, preview.content);
      setResult(res);
      setState("done");
    } catch {
      setResult({ success: false, error: "Import failed unexpectedly." });
      setState("done");
    }
  };

  const handleReset = () => {
    setState("idle");
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const csv = generateCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tradefeed-product-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-3">📋 CSV Format Guide</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-2">Required Columns</h3>
            <ul className="space-y-1 text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <strong>name</strong> — Product name
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <strong>price</strong> — Price in Rands (e.g. 299.99)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <strong>stock</strong> — Stock quantity
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-2">Optional Columns</h3>
            <ul className="space-y-1 text-sm text-stone-600">
              <li><strong>description</strong>, <strong>size</strong>, <strong>color</strong>, <strong>sku</strong>, <strong>category</strong></li>
              <li className="text-xs text-stone-400 mt-1">
                Rows with the same product name are grouped as variants.
              </li>
            </ul>
          </div>
        </div>
        <button
          onClick={downloadTemplate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download CSV Template
        </button>
      </div>

      {/* Upload Area */}
      {state === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            dragOver
              ? "border-emerald-400 bg-emerald-50"
              : "border-stone-300 bg-white hover:border-stone-400"
          }`}
        >
          <svg className="mx-auto w-12 h-12 text-stone-400 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-stone-600 font-medium mb-1">
            Drag & drop your CSV file here
          </p>
          <p className="text-sm text-stone-400 mb-4">or click to browse (max 5MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-6 py-2.5 text-sm font-medium text-white cursor-pointer hover:bg-stone-800 transition"
          >
            Choose File
          </label>
        </div>
      )}

      {/* Preview */}
      {state === "preview" && preview && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Preview: {preview.fileName}</h2>
              <p className="text-sm text-stone-500">{preview.rowCount} row{preview.rowCount !== 1 ? "s" : ""} detected</p>
            </div>
            <button onClick={handleReset} className="text-sm text-stone-500 hover:text-stone-700 transition">
              ✕ Cancel
            </button>
          </div>

          {/* Sample data */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  {preview.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-stone-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.map((row, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-stone-700 whitespace-nowrap max-w-[200px] truncate">
                        {cell || <span className="text-stone-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.rowCount > 5 && (
            <p className="text-xs text-stone-400">Showing first 5 of {preview.rowCount} rows</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Import {preview.rowCount} Row{preview.rowCount !== 1 ? "s" : ""}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-stone-200 px-6 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Importing */}
      {state === "importing" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
          <div className="mx-auto w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
          <p className="text-stone-600 font-medium">Importing products...</p>
          <p className="text-sm text-stone-400 mt-1">This may take a moment for large files</p>
        </div>
      )}

      {/* Result */}
      {state === "done" && result && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-6 ${
              result.success
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <span className="text-2xl">✅</span>
              ) : (
                <span className="text-2xl">❌</span>
              )}
              <div>
                <h3 className={`font-semibold ${result.success ? "text-emerald-800" : "text-red-800"}`}>
                  {result.success ? "Import Complete!" : "Import Failed"}
                </h3>
                {result.success ? (
                  <p className="text-sm text-emerald-700 mt-1">
                    {result.imported} variant{result.imported !== 1 ? "s" : ""} imported
                    {result.skipped ? ` · ${result.skipped} skipped` : ""}
                    {result.totalRows ? ` · ${result.totalRows} total rows` : ""}
                  </p>
                ) : (
                  <p className="text-sm text-red-700 mt-1">{result.error}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error details */}
          {result.errors && result.errors.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h3 className="font-semibold text-amber-800 mb-3">⚠️ Issues ({result.errors.length})</h3>
              <ul className="space-y-1 text-sm text-amber-700 max-h-48 overflow-y-auto">
                {result.errors.slice(0, 20).map((err, i) => (
                  <li key={i}>
                    {err.row > 0 ? `Row ${err.row}: ` : ""}{err.message}
                  </li>
                ))}
                {result.errors.length > 20 && (
                  <li className="text-amber-500">...and {result.errors.length - 20} more</li>
                )}
              </ul>
            </div>
          )}

          <button
            onClick={handleReset}
            className="rounded-lg bg-stone-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition"
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
