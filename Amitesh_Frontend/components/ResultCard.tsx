"use client";

import type { T } from "@/lib/translations";

export interface AnalysisResult {
  is_scam: boolean;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  scam_type: string | null;
  summary: string;
  red_flags: string[];
  recommendations: string[];
  legitimate_indicators?: string[];
  error?: string;
}

const RISK_CONFIG = {
  LOW:      { bg: "bg-green-50",  border: "border-green-200",  badge: "bg-green-100 text-green-800",   bar: "bg-green-500",  banner: "bg-green-500",  icon: "✅" },
  MEDIUM:   { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-800", bar: "bg-yellow-500", banner: "bg-yellow-400", icon: "⚠️" },
  HIGH:     { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-800", bar: "bg-orange-500", banner: "bg-orange-500", icon: "🚨" },
  CRITICAL: { bg: "bg-red-50",    border: "border-red-200",    badge: "bg-red-100 text-red-800",       bar: "bg-red-600",    banner: "bg-red-600",    icon: "🛑" },
};

const RISK_LABEL_KEY: Record<string, keyof T> = {
  LOW: "riskLow", MEDIUM: "riskMedium", HIGH: "riskHigh", CRITICAL: "riskCritical",
};

interface Props { result: AnalysisResult; t: T; }

export default function ResultCard({ result, t }: Props) {
  if (result.error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl p-6">
        <p className="text-red-700 dark:text-red-300 font-medium">⚠️ {result.error}</p>
      </div>
    );
  }

  const config = RISK_CONFIG[result.risk_level] ?? RISK_CONFIG.MEDIUM;
  const riskLabel = t[RISK_LABEL_KEY[result.risk_level]] as string;

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} dark:bg-gray-800 dark:border-gray-600 overflow-hidden`}>
      {/* Banner */}
      <div className={`px-6 py-4 flex items-center justify-between ${config.banner}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className="text-white font-bold text-lg">{riskLabel}</p>
            {result.scam_type && <p className="text-white/80 text-sm">{result.scam_type}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/80 text-xs">{t.riskScore}</p>
          <p className="text-white font-bold text-2xl">{result.risk_score}<span className="text-sm font-normal">/100</span></p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Risk bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{t.safe}</span><span>{t.dangerous}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div className={`${config.bar} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${result.risk_score}%` }} />
          </div>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.summary}</p>

        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${result.is_scam ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"}`}>
          {result.is_scam ? t.isScam : t.isLegit}
        </div>

        {result.red_flags?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-3">{t.redFlags} ({result.red_flags.length})</h3>
            <ul className="space-y-2">
              {result.red_flags.map((flag, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-700/50 rounded-lg px-3 py-2 border border-red-100 dark:border-red-900">
                  <span className="text-red-400 mt-0.5 shrink-0">▸</span>{flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.legitimate_indicators && result.legitimate_indicators.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-green-700 dark:text-green-400 mb-3">{t.legitIndicators}</h3>
            <ul className="space-y-2">
              {result.legitimate_indicators.map((ind, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-700/50 rounded-lg px-3 py-2 border border-green-100 dark:border-green-900">
                  <span className="text-green-400 mt-0.5 shrink-0">▸</span>{ind}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.recommendations?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3">{t.whatToDo}</h3>
            <ol className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-700/50 rounded-lg px-3 py-2 border border-blue-100 dark:border-blue-900">
                  <span className="text-blue-500 font-bold shrink-0">{i + 1}.</span>{rec}
                </li>
              ))}
            </ol>
          </div>
        )}

        {result.is_scam && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">{t.reportTitle}</p>
            <p>{t.reportHelpline} <strong>1930</strong></p>
            <p>{t.reportOnline} <strong>cybercrime.gov.in</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
