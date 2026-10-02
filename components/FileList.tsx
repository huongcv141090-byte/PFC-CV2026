"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FileInfo } from "@/lib/data";
import { imgUrl, formatMB } from "@/lib/data";

export default function FileList({
  brandId,
  brandName,
  files,
  hideHeader,
}: {
  brandId: string;
  brandName: string;
  files: FileInfo[];
  hideHeader?: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return files;
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(needle) ||
        (f.group ?? "").toLowerCase().includes(needle)
    );
  }, [q, files]);

  // group files by subfolder for JILEON
  const groups = useMemo(() => {
    const map = new Map<string, FileInfo[]>();
    for (const f of filtered) {
      const g = f.group ?? "—";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(f);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        {!hideHeader && (
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:underline">
              Tổng quan
            </Link>{" "}
            / {brandName}
          </p>
          <h1 className="text-2xl font-bold mt-1">
            File PFC — {brandName}{" "}
            <span className="text-base font-normal text-slate-500 dark:text-slate-400">
              ({filtered.length}/{files.length})
            </span>
          </h1>
        </div>
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên file…"
          className="w-full md:w-72 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {groups.map(([g, list]) => (
        <section key={g}>
          {g !== "—" && (
            <h2 className="font-bold text-lg mb-3 text-slate-800 dark:text-slate-200">{g}</h2>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((f) => {
              const thumb = f.images[0];
              return (
                <Link
                  key={f.id}
                  href={`/file/${brandId}/${f.id}`}
                  className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-300 transition"
                >
                  <div className="h-32 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl(thumb)}
                        alt={f.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <span className="text-slate-300 text-4xl font-bold">
                        {f.sheets.length}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p
                      className="font-semibold text-sm leading-snug break-all line-clamp-2"
                      title={f.name}
                    >
                      {f.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {formatMB(f.sizeMB)} · {f.sheets.length} sheet ·{" "}
                      {f.images.length} ảnh
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
          Không tìm thấy file nào khớp “{q}”.
        </p>
      )}
    </div>
  );
}
