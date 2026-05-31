"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import jsQR from "jsqr";
import type { T } from "@/lib/translations";

interface QRScannerProps {
  onAnalyze: (text: string, file: null) => void;
  loading: boolean;
  t: T;
}

const DANGEROUS_SCHEMES = ["javascript:", "data:", "vbscript:", "file:"];

function sanitizeQRContent(raw: string): { safe: boolean; reason?: string; content: string } {
  const lower = raw.toLowerCase().trim();
  for (const scheme of DANGEROUS_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return { safe: false, reason: `Blocked dangerous scheme: ${scheme}`, content: raw };
    }
  }
  return { safe: true, content: raw };
}

type Mode = "upload" | "camera";

export default function QRScanner({ onAnalyze, loading, t }: QRScannerProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [decodeError, setDecodeError] = useState("");
  const [blocked, setBlocked] = useState<{ reason: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  function handleDecoded(data: string) {
    const { safe, reason, content } = sanitizeQRContent(data);
    setDecoded(content);
    if (!safe) setBlocked({ reason: reason! });
    setScanning(false);
  }

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) { stopCamera(); handleDecoded(code.data); }
    else animFrameRef.current = requestAnimationFrame(scanFrame);
  }, []);

  async function startCamera() {
    setCameraError(""); setDecoded(null); setBlocked(null); setDecodeError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraActive(true); setScanning(true);
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setCameraError(t.qrCameraError);
    }
  }

  function stopCamera() {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false); setScanning(false);
  }

  useEffect(() => () => stopCamera(), []);

  function handleImageUpload(file: File) {
    setDecoded(null); setDecodeError(""); setBlocked(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setQrImage(dataUrl);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) handleDecoded(code.data);
        else setDecodeError(t.qrNoCode);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function handleClear() {
    setQrImage(null); setDecoded(null); setDecodeError(""); setBlocked(null);
    setContext("");
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function switchMode(m: Mode) { handleClear(); setMode(m); }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">📷</span>
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t.qrTitle}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t.qrSubtitle}</p>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2">
        {([["upload", t.qrUpload], ["camera", t.qrCamera]] as const).map(([m, label]) => (
          <button key={m} type="button" onClick={() => switchMode(m)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
              mode === m ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 transition-colors"
          onClick={() => fileInputRef.current?.click()}>
          {qrImage ? (
            <div className="flex flex-col items-center gap-3">
              <img src={qrImage} alt="QR" className="w-32 h-32 object-contain rounded-lg border border-gray-200 dark:border-gray-600" />
              <button type="button" onClick={(e) => { e.stopPropagation(); handleClear(); }} className="text-xs text-gray-400 hover:text-red-500">
                {t.removeImage}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-3xl mb-2">🔲</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.qrDropzone}</p>
              <p className="text-xs text-gray-400 mt-1">{t.qrDropzoneHint}</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" className="hidden" accept=".png,.jpg,.jpeg"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
        </div>
      )}

      {/* Camera mode */}
      {mode === "camera" && (
        <div className="space-y-3">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-square max-w-xs mx-auto">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {cameraActive && scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-4 border-blue-400 rounded-2xl opacity-70 animate-pulse" />
                <p className="absolute bottom-4 text-white text-xs bg-black/50 px-3 py-1 rounded-full">{t.qrScanning}</p>
              </div>
            )}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 gap-3">
                <p className="text-4xl">📸</p>
                <p className="text-white text-sm">{t.qrCameraOff}</p>
              </div>
            )}
          </div>
          {cameraError && <p className="text-red-500 text-sm text-center">{cameraError}</p>}
          <div className="flex justify-center">
            {!cameraActive
              ? <button onClick={startCamera} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">{t.qrStartCamera}</button>
              : <button onClick={stopCamera} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">{t.qrStopCamera}</button>
            }
          </div>
        </div>
      )}

      {decodeError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 text-sm text-yellow-700 dark:text-yellow-300">
          ⚠️ {decodeError}
        </div>
      )}

      {blocked && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4 space-y-1">
          <p className="text-red-700 dark:text-red-300 font-bold text-sm">{t.qrBlocked}</p>
          <p className="text-red-600 dark:text-red-400 text-xs">{blocked.reason}</p>
          <p className="text-red-500 dark:text-red-400 text-xs font-mono break-all">{decoded}</p>
          <p className="text-red-600 dark:text-red-400 text-xs mt-1">{t.qrBlockedNote}</p>
        </div>
      )}

      {decoded && !blocked && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.qrContains}</p>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-mono break-all">{decoded}</p>

          {/* Context / situation box */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">
              {t.qrContextLabel}
            </label>
            <textarea
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg p-3 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              placeholder={t.qrContextPlaceholder}
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const combined = context.trim()
                  ? `QR Code Content: ${decoded}\n\nAdditional Context: ${context}`
                  : `QR Code Content: ${decoded}`;
                onAnalyze(combined, null);
              }}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
              {loading ? t.analyzing : t.qrCheckBtn}
            </button>
            <button onClick={handleClear} className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg text-sm hover:text-red-500">
              {t.clearBtn}
            </button>
          </div>
        </div>
      )}

      {!decoded && !decodeError && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">{t.qrTipsTitle}</p>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            {t.qrTips.map((tip, i) => <li key={i}>• {tip}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
