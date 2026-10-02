"use client";

import { useMemo, useState } from "react";

export interface CdNameEntry {
  id: string;
  ten: string;
  stage: string;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d");
}


export default function CongDoanSearch({
  names,
  hinhThes,
}: {
  names: CdNameEntry[];
  hinhThes: string[];
}) {
  const [q, setQ] = useState("");
  const [ht, setHt] = useState("all");
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const nq = norm(q.trim());

  const suggestions = useMemo(() => {
    if (!nq) return [];
    return names.filter((n) => norm(n.ten).includes(nq)).slice(0, 8);
  }, [nq, names]);

  function matches(el: HTMLElement, nqq: string, htVal: string): boolean {
    if (nqq && !norm(el.dataset.cdName ?? "").includes(nqq)) return false;
    if (htVal !== "all") {
      const hts = (el.dataset.ht ?? "").split("|");
      if (!hts.includes(htVal)) return false;
    }
    return true;
  }

  function applyFilter(query: string, htVal: string) {
    const nqq = norm(query.trim());
    const items = document.querySelectorAll<HTMLElement>("li[data-cd-name]");
    let visible = 0;
    items.forEach((el) => {
      const hit = matches(el, nqq, htVal);
      el.style.display = hit ? "" : "none";
      if (hit) visible++;
    });
    document
      .querySelectorAll<HTMLElement>("section[data-stage-section]")
      .forEach((sec) => {
        const anyVisible = Array.from(
          sec.querySelectorAll<HTMLElement>("li[data-cd-name]")
        ).some((el) => el.style.display !== "none");
        sec.style.display = anyVisible ? "" : "none";
      });
    setCount(nqq || htVal !== "all" ? visible : null);
  }

  function onChange(v: string) {
    setQ(v);
    setOpen(true);
    applyFilter(v, ht);
  }

  function onHtChange(v: string) {
    setHt(v);
    applyFilter(q, v);
  }

  function pick(ten: string) {
    setQ(ten);
    setOpen(false);
    applyFilter(ten, ht);
  }

  function clear() {
    setQ("");
    setHt("all");
    setOpen(false);
    applyFilter("", "all");
  }

  return (
    <div className="relative max-w-xl mb-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Escape") clear();
            }}
            placeholder="Tìm nhanh tên công đoạn… (vd: phun keo, vat so)"
            className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white dark:bg-slate-900"
          />
          {q && (
            <button
              onClick={clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-lg leading-none"
              aria-label="Xóa tìm kiếm"
            >
              ×
            </button>
          )}
          {open && suggestions.length > 0 && (
            <ul className="absolute z-40 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s.ten)}
                    className="w-full text-left px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/60 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-slate-800 dark:text-slate-200 truncate">{s.ten}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {s.stage}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {hinhThes.length > 1 && (
          <select
            value={ht}
            onChange={(e) => onHtChange(e.target.value)}
            className="shrink-0 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-slate-900 max-w-[180px]"
            aria-label="Lọc theo hình thể"
          >
            <option value="all">Tất cả hình thể</option>
            {hinhThes.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        )}
      </div>
      {count !== null && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Tìm thấy <b className="text-slate-800 dark:text-slate-200">{count}</b> công đoạn
          {count === 0 && " — thử từ khóa khác"}
          {" · "}
          <button onClick={clear} className="text-amber-700 dark:text-amber-400 hover:underline">
            Xóa lọc
          </button>
        </p>
      )}
    </div>
  );
}
