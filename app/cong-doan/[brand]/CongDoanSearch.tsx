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


export default function CongDoanSearch({ names }: { names: CdNameEntry[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const nq = norm(q.trim());

  const suggestions = useMemo(() => {
    if (!nq) return [];
    return names.filter((n) => norm(n.ten).includes(nq)).slice(0, 8);
  }, [nq, names]);

  function applyFilter(query: string) {
    const nqq = norm(query.trim());
    const items = document.querySelectorAll<HTMLElement>("li[data-cd-name]");
    let visible = 0;
    items.forEach((el) => {
      const hit = !nqq || norm(el.dataset.cdName ?? "").includes(nqq);
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
    setCount(nqq ? visible : null);
  }

  function onChange(v: string) {
    setQ(v);
    setOpen(true);
    applyFilter(v);
  }

  function pick(ten: string) {
    setQ(ten);
    setOpen(false);
    applyFilter(ten);
  }

  function clear() {
    setQ("");
    setOpen(false);
    applyFilter("");
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
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
          />
          {q && (
            <button
              onClick={clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-lg leading-none"
              aria-label="Xóa tìm kiếm"
            >
              ×
            </button>
          )}
          {open && suggestions.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s.ten)}
                    className="w-full text-left px-4 py-2 hover:bg-amber-50 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-slate-800 truncate">{s.ten}</span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {s.stage}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {count !== null && (
        <p className="text-xs text-slate-500 mt-2">
          Tìm thấy <b className="text-slate-800">{count}</b> công đoạn
          {count === 0 && " — thử từ khóa khác"}
          {" · "}
          <button onClick={clear} className="text-amber-700 hover:underline">
            Xóa lọc
          </button>
        </p>
      )}
    </div>
  );
}
