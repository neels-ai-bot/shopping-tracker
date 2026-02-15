"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState("");
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setScanning(true);
        }
      } catch {
        if (mounted) {
          setError("Camera access denied. You can enter the barcode manually below.");
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [stopCamera]);

  // Simple barcode detection using BarcodeDetector API (Chrome/Edge)
  useEffect(() => {
    if (!scanning || !videoRef.current) return;

    const detectBarcode = async () => {
      if (!("BarcodeDetector" in window)) return;

      try {
        // @ts-expect-error BarcodeDetector is not in all TS libs
        const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        const interval = setInterval(async () => {
          if (!videoRef.current) {
            clearInterval(interval);
            return;
          }
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              clearInterval(interval);
              stopCamera();
              onScan(barcodes[0].rawValue);
            }
          } catch {
            // Ignore detection errors
          }
        }, 500);

        return () => clearInterval(interval);
      } catch {
        // BarcodeDetector not supported
      }
    };

    detectBarcode();
  }, [scanning, onScan, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      stopCamera();
      onScan(manualEntry.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Scan Barcode</h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative aspect-[4/3] bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
              <div>
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-32 border-2 border-white/80 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                </div>
              </div>
              {scanning && (
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="inline-flex items-center gap-1 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Point at barcode...
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Manual Entry */}
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-2">
            Or enter barcode manually:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualEntry}
              onChange={(e) => setManualEntry(e.target.value)}
              placeholder="Enter UPC/EAN..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              pattern="[0-9]*"
              inputMode="numeric"
            />
            <button
              type="submit"
              disabled={!manualEntry.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Look Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
