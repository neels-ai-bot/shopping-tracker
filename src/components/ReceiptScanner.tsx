"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, FileText } from "lucide-react";

interface ReceiptScannerProps {
  onItemsDetected: (items: string[]) => void;
  onClose: () => void;
}

export default function ReceiptScanner({
  onItemsDetected,
  onClose,
}: ReceiptScannerProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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

      // Parse receipt text into item lines
      const items = parseReceiptText(text);
      setDetectedItems(items);
      setSelectedItems(new Set(items.map((_, i) => i)));
    } catch {
      setDetectedItems(["Error processing receipt. Try a clearer image."]);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="font-semibold text-gray-900">Scan Receipt</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {/* Upload Area */}
          {detectedItems.length === 0 && !processing && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium text-gray-700">
                Upload receipt photo
              </p>
              <p className="text-sm text-gray-500 mt-1">
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

          {/* Processing */}
          {processing && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-3 text-blue-500 animate-spin" />
              <p className="font-medium text-gray-700">Reading receipt...</p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{progress}%</p>
            </div>
          )}

          {/* Detected Items */}
          {detectedItems.length > 0 && !processing && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                <FileText className="h-4 w-4 inline mr-1" />
                Select items to add to your list:
              </p>
              <div className="space-y-1">
                {detectedItems.map((item, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(index)}
                      onChange={() => toggleItem(index)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        {detectedItems.length > 0 && !processing && (
          <div className="p-4 border-t flex-shrink-0">
            <button
              onClick={handleConfirm}
              disabled={selectedItems.size === 0}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Add {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}{" "}
              to list
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Parse OCR text from a receipt into product names.
 * Filters out prices, totals, store info, etc.
 */
function parseReceiptText(text: string): string[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: string[] = [];

  for (const line of lines) {
    // Skip lines that are likely headers, totals, or non-item lines
    if (line.length < 3) continue;
    if (/^(sub)?total|^tax|^change|^cash|^credit|^debit|^visa|^master/i.test(line)) continue;
    if (/^thank|^welcome|^store|^address|^phone|^date|^time|^\d{1,2}[\/\-]/i.test(line)) continue;
    if (/^\*+$|^-+$|^=+$/.test(line)) continue;

    // Clean up the line - remove trailing prices like "$4.99" or "4.99"
    let cleaned = line
      .replace(/\$?\d+\.\d{2}\s*[A-Z]?$/, "")
      .replace(/\s{2,}\d+\.\d{2}.*$/, "")
      .replace(/\s+\d+\s*@\s*\d+\.\d{2}.*$/, "")
      .trim();

    // Remove leading quantity indicators like "2 x" or "2x"
    cleaned = cleaned.replace(/^\d+\s*[xX]\s*/, "").trim();

    if (cleaned.length >= 3 && !/^\d+$/.test(cleaned)) {
      items.push(cleaned);
    }
  }

  return items;
}
