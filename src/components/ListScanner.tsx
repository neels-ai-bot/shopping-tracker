"use client";

import { useState, useRef } from "react";
import { Camera, Type, Upload, X, Loader2, Check, List } from "lucide-react";

interface ListScannerProps {
  onItemsDetected: (items: string[]) => void;
  onClose: () => void;
}

type InputMode = "camera" | "paste";

export default function ListScanner({
  onItemsDetected,
  onClose,
}: ListScannerProps) {
  const [mode, setMode] = useState<InputMode>("camera");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pasteText, setPasteText] = useState("");
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setProcessing(true);
    setProgress(0);

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", undefined, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();

      const items = parseGroceryList(text);
      setDetectedItems(items);
      setSelectedItems(new Set(items.map((_, i) => i)));
    } catch {
      setDetectedItems(["Error processing image. Try a clearer photo."]);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    const items = parseGroceryList(pasteText);
    setDetectedItems(items);
    setSelectedItems(new Set(items.map((_, i) => i)));
  };

  const toggleItem = (index: number) => {
    const next = new Set(selectedItems);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedItems(next);
  };

  const handleConfirm = () => {
    const items = detectedItems.filter((_, i) => selectedItems.has(i));
    onItemsDetected(items);
  };

  const handleReset = () => {
    setDetectedItems([]);
    setSelectedItems(new Set());
    setProgress(0);
    setPasteText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectedCount = selectedItems.size;
  const showResults = detectedItems.length > 0 && !processing;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <List className="h-5 w-5" />
            Scan Grocery List
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tab Switcher */}
        {!showResults && !processing && (
          <div className="p-4 pb-0 flex-shrink-0">
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
              <button
                onClick={() => { setMode("camera"); handleReset(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  mode === "camera"
                    ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Camera className="h-4 w-4" />
                Scan Photo
              </button>
              <button
                onClick={() => { setMode("paste"); handleReset(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  mode === "paste"
                    ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Type className="h-4 w-4" />
                Type List
              </button>
            </div>
          </div>
        )}

        <div className="p-4 overflow-y-auto flex-1">
          {/* Camera/Upload Mode */}
          {mode === "camera" && !showResults && !processing && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="font-medium text-gray-700 dark:text-gray-200">
                Upload a photo of your list
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Take a photo or choose from gallery
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Paste Mode */}
          {mode === "paste" && !showResults && !processing && (
            <div className="space-y-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"Type or paste your grocery list...\nOne item per line"}
                rows={8}
                className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Parse List
              </button>
            </div>
          )}

          {/* Processing */}
          {processing && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-3 text-blue-500 animate-spin" />
              <p className="font-medium text-gray-700 dark:text-gray-200">
                Reading your handwritten list...
              </p>
              <div className="mt-3 w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {progress}%
              </p>
            </div>
          )}

          {/* Detected Items */}
          {showResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <List className="h-4 w-4" />
                  {detectedItems.length} item{detectedItems.length !== 1 ? "s" : ""} detected
                </p>
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Scan again
                </button>
              </div>
              <div className="space-y-1">
                {detectedItems.map((item, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(index)}
                      onChange={() => toggleItem(index)}
                      className="rounded border-gray-300 dark:border-slate-500 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 dark:text-gray-100 text-sm">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        {showResults && (
          <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add {selectedCount} item{selectedCount !== 1 ? "s" : ""} to list
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Parse raw text (from OCR or manual input) into a clean list of grocery items.
 * Handles numbered lists, bullet points, comma-separated values, and quantities.
 */
function parseGroceryList(text: string): string[] {
  let lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // If there's only one line, try splitting by commas
  if (lines.length === 1 && lines[0].includes(",")) {
    lines = lines[0].split(",").map((l) => l.trim()).filter(Boolean);
  }

  const items: string[] = [];

  for (const line of lines) {
    // Split lines that contain commas into multiple items
    const segments = line.includes(",")
      ? line.split(",").map((s) => s.trim()).filter(Boolean)
      : [line];

    for (let segment of segments) {
      // Remove numbered list prefixes: "1. ", "1) ", "1 - ", etc.
      segment = segment.replace(/^\d+[\.\)\-\:]\s*/, "").trim();

      // Remove bullet point prefixes: "• ", "- ", "* ", "> "
      segment = segment.replace(/^[\u2022\u2023\u25E6\u2043\u2219\-\*\>]\s*/, "").trim();

      // Remove checkbox-style prefixes: "[ ] ", "[x] ", "[] "
      segment = segment.replace(/^\[.?\]\s*/, "").trim();

      // Strip quantity prefixes: "2 gallons milk" -> "milk", "3x eggs" -> "eggs"
      // Patterns: "2 gallons of", "3x ", "2x ", "1 lb ", "2 dozen ", etc.
      segment = segment
        .replace(/^\d+(\.\d+)?\s*[xX]\s*/, "")
        .replace(/^\d+(\.\d+)?\s*(gallons?|gal|liters?|lbs?|pounds?|oz|ounces?|kg|grams?|cups?|dozen|doz|cans?|bags?|boxes?|packs?|bottles?|bunche?s?|heads?|jars?|cartons?|pints?|quarts?|sticks?|loave?s|slices?|pieces?|rolls?|bundles?)\s+(of\s+)?/i, "")
        .replace(/^\d+(\.\d+)?\s+(of\s+)?/, "")
        .trim();

      // Skip if too short after cleanup
      if (segment.length < 2) continue;

      // Skip if the segment is purely numeric
      if (/^\d+(\.\d+)?$/.test(segment)) continue;

      // Capitalize first letter, lowercase the rest only if all-caps
      const capitalized =
        segment === segment.toUpperCase() && segment.length > 1
          ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
          : segment.charAt(0).toUpperCase() + segment.slice(1);

      items.push(capitalized);
    }
  }

  // Remove duplicates (case-insensitive) while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of items) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(item);
    }
  }

  return unique;
}
