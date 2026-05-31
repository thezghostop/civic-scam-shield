"use client";

import { useState, useRef } from "react";
import type { T } from "@/lib/translations";

interface UploadFormProps {
  onAnalyze: (text: string, file: File | null) => void;
  loading: boolean;
  onReset: () => void;
  hasResult: boolean;
  t: T;
}

export default function UploadForm({ onAnalyze, loading, onReset, hasResult, t }: UploadFormProps) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = (text.trim().length > 0 || file !== null) && !loading;

  function handleFileChange(selected: File | null) {
    if (!selected) return;
    setFile(selected);
    setText("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAnalyze(text, file);
  }

  function handleClear() {
    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onReset();
  }

  const EXAMPLE_SCAMS = [
    "Congratulations! You have won Rs. 50,00,000 in KBC lottery. Send your Aadhaar and OTP to claim.",
    "URGENT: Your SBI account will be blocked. Update KYC immediately: bit.ly/sbi-kyc-update",
    "Work from home job offer. Earn Rs. 5000/day. No experience needed. Pay Rs. 500 registration fee.",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
          {t.pasteLabel}
        </h2>

        <textarea
          className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-xl p-4 text-sm h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 disabled:bg-gray-50"
          placeholder={t.pastePlaceholder}
          value={text}
          onChange={(e) => { setText(e.target.value); setFile(null); }}
          disabled={loading}
        />

        <div className="flex items-center gap-3 text-gray-400">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-600" />
          <span className="text-xs">{t.orUpload}</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-600" />
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{getFileEmoji(file.name)}</span>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="ml-2 text-gray-400 hover:text-red-500 text-lg">×</button>
            </div>
          ) : (
            <div>
              <p className="text-2xl mb-2">📎</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.dropzone}</p>
              <p className="text-xs text-gray-400 mt-1">{t.dropzoneHint}</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" className="hidden"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.bmp,.tiff"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={!canSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">
            {loading ? t.analyzing : t.analyzeBtn}
          </button>
          {(text || file || hasResult) && (
            <button type="button" onClick={handleClear}
              className="px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 rounded-xl transition-colors text-sm">
              {t.clearBtn}
            </button>
          )}
        </div>
      </div>

      {!text && !file && !hasResult && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1">{t.tryExample}</p>
          {EXAMPLE_SCAMS.map((scam, i) => (
            <button key={i} type="button"
              onClick={() => { setText(scam); setFile(null); }}
              className="w-full text-left text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 hover:border-blue-300 hover:text-blue-600 transition-colors">
              &ldquo;{scam.slice(0, 80)}...&rdquo;
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

function getFileEmoji(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "📄", docx: "📝", txt: "📃",
    png: "🖼️", jpg: "🖼️", jpeg: "🖼️", bmp: "🖼️", tiff: "🖼️",
  };
  return map[ext || ""] || "📁";
}
