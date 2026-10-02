"use client";

import { useState } from "react";
import type { KaizenRecommendation } from "@/lib/data-server";
import type { KaizenAiSettings } from "./KaizenAiSettings";

function renderAnalysis(text: string) {
  // Giữ nguyên xuống dòng của AI, không diễn giải markdown phức tạp
  return text.split("\n").map((line, i) => {
    const t = line.trim();
    if (/^\d+\.\s/.test(t)) {
      return (
        <p key={i} className="font-bold text-slate-900 dark:text-slate-100 mt-3 first:mt-0">
          {t}
        </p>
      );
    }
    if (t.startsWith("-") || t.startsWith("•")) {
      return (
        <p key={i} className="pl-4 text-slate-700 dark:text-slate-300">
          {t}
        </p>
      );
    }
    if (!t) return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-slate-700 dark:text-slate-300">
        {t}
      </p>
    );
  });
}

export default function KaizenAiAnalysis({
  rec,
  settings,
}: {
  rec: KaizenRecommendation;
  settings: KaizenAiSettings | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!settings) {
      setError("Anh mở mục “Kết nối AI” ở trên và lưu API key trước nhé.");
      setOpen(true);
      return;
    }
    if (analysis) {
      setOpen((v) => !v);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kaizen-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          rec: {
            type_vi: rec.type_vi,
            cong_doan: rec.cong_doan,
            brand: rec.brand,
            stage: rec.stage,
            score: rec.score,
            suggestion: rec.suggestion,
            evidence: rec.evidence,
            ref_equipment: rec.ref_equipment,
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gọi AI thất bại");
      setAnalysis(data.analysis);
      setModel(`${data.provider} · ${data.model}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gọi AI thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={analyze}
        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:opacity-80 transition"
      >
        {analysis ? (open ? "▾ Ẩn phân tích AI" : "▸ Xem phân tích AI") : "🤖 Phân tích chuyên sâu"}
      </button>
      {open && (
        <div className="mt-2 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/50 p-4 text-sm leading-relaxed">
          {loading && (
            <p className="text-violet-700 dark:text-violet-300 animate-pulse">
              Đang phân tích bằng AI, anh chờ một chút…
            </p>
          )}
          {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
          {analysis && (
            <>
              {model && (
                <p className="text-[11px] text-violet-500 dark:text-violet-400 mb-2">
                  Phân tích bởi {model}
                </p>
              )}
              <div className="space-y-1">{renderAnalysis(analysis)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
