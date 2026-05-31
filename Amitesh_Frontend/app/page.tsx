"use client";

import { useState, useRef, useEffect } from "react";
import UploadForm from "@/components/UploadForm";
import ResultCard from "@/components/ResultCard";
import QRScanner from "@/components/QRScanner";
import type { AnalysisResult } from "@/components/ResultCard";
import { getT, type Lang } from "@/lib/translations";

type Tab = "analyze" | "qr";
type FontScale = 1 | 2 | 3;

const LANGUAGE_OPTIONS = [
  { code: "en" as Lang, flag: "🇬🇧", label: "English" },
  { code: "hi" as Lang, flag: "🇮🇳", label: "हिंदी" },
  { code: "te" as Lang, flag: "🇮🇳", label: "తెలుగు" },
];

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("analyze");
  const [dark, setDark] = useState(false);
  const [fontScale, setFontScale] = useState<FontScale>(1);
  const [lang, setLang] = useState<Lang>("en");
  const resultRef = useRef<HTMLDivElement>(null);

  const t = getT(lang);

  useEffect(() => {
    const html = document.documentElement;
    if (dark) html.classList.add("dark");
    else html.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("font-scale-1", "font-scale-2", "font-scale-3");
    html.classList.add(`font-scale-${fontScale}`);
  }, [fontScale]);

  async function handleAnalyze(text: string, file: File | null) {
    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    if (file) formData.append("file", file);
    else formData.append("text", text);
    formData.append("language", lang);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/analyze`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || t.backendError); return; }
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setError(t.backendError);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() { setResult(null); setError(""); }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-3xl">🛡️</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.appName}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.appSubtitle}</p>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
            {/* Language switcher */}
            <div className="flex gap-1">
              {LANGUAGE_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    lang === l.code
                      ? "bg-blue-600 text-white border-blue-600"
                      : "text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300"
                  }`}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>

            {/* Font size */}
            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button onClick={() => setFontScale(f => Math.max(1, f - 1) as FontScale)}
                className="px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">A-</button>
              <span className="px-1 text-xs text-gray-400">|</span>
              <button onClick={() => setFontScale(f => Math.min(3, f + 1) as FontScale)}
                className="px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">A+</button>
            </div>

            {/* Dark mode */}
            <button onClick={() => setDark(d => !d)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-yellow-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 flex gap-1">
          {([["analyze", t.tabAnalyze], ["qr", t.tabQR]] as const).map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); handleReset(); }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === id ? "bg-blue-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {tab === "analyze" && (
          <>
            {!result && (
              <div className="bg-blue-600 text-white rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-1">{t.bannerTitle}</h2>
                <p className="text-blue-100 text-sm">{t.bannerDesc}</p>
              </div>
            )}
            <UploadForm onAnalyze={handleAnalyze} loading={loading} onReset={handleReset} hasResult={!!result} t={t} />
          </>
        )}

        {tab === "qr" && (
          <QRScanner onAnalyze={handleAnalyze} loading={loading} t={t} />
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
            <span className="text-lg">⚠️</span><span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">{t.analyzingTitle}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t.analyzingDesc}</p>
          </div>
        )}

        {result && <div ref={resultRef}><ResultCard result={result} t={t} /></div>}
      </div>

      <footer className="text-center text-xs text-gray-400 dark:text-gray-600 py-8">{t.footer}</footer>
    </main>
  );
}
