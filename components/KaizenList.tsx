"use client";

import { useMemo, useState } from "react";
import type { KaizenRecommendation } from "@/lib/data-server";

const TYPE_TONE: Record<string, string> = {
  THAY_THU_CONG: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300",
  CHUAN_HOA_DUNG_CU: "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300",
  GIAM_NGUOI: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300",
  CHUAN_HOA_THOI_GIAN: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",
  BAT_THUONG: "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300",
};

export default function KaizenList({
  recs,
}: {
  recs: KaizenRecommendation[];
}) {
  const [type, setType] = useState("all");
  const [brand, setBrand] = useState("all");

  const types = useMemo(() => Array.from(new Set(recs.map((r) => r.type_vi))), [recs]);
  const brands = useMemo(() => Array.from(new Set(recs.map((r) => r.brand))), [recs]);
  const maxScore = useMemo(() => Math.max(1, ...recs.map((r) => r.score)), [recs]);

  const filtered = useMemo(
    () =>
      recs.filter(
        (r) =>
          (type === "all" || r.type_vi === type) &&
          (brand === "all" || r.brand === brand)
      ),
    [recs, type, brand]
  );

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-5">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Loại đề xuất"
        >
          <option value="all">Tất cả loại ({recs.length})</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t} ({recs.filter((r) => r.type_vi === t).length})
            </option>
          ))}
        </select>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Nhãn hàng"
        >
          <option value="all">Tất cả nhãn hàng</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500 dark:text-slate-400 self-center ml-1">
          {filtered.length} đề xuất
        </span>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <article
            key={r.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                  #{r.rank}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_TONE[r.type] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                >
                  {r.type_vi}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {r.brand} · {r.stage}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    style={{ width: `${Math.min(100, (r.score / maxScore) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                  {r.score.toFixed(0)}
                </span>
              </div>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{r.cong_doan}</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
              → {r.suggestion}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Bằng chứng: {r.evidence}
            </p>
            {r.ref_equipment.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {r.ref_equipment.map((e) => (
                  <span
                    key={e}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    🔧 {e}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">
            Không có đề xuất nào khớp bộ lọc.
          </p>
        )}
      </div>
    </div>
  );
}
