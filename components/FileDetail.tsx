"use client";

import { useState } from "react";
import type { FileInfo, ImageMeta } from "@/lib/data";
import { imgUrl, formatMB, hinhTheSlug } from "@/lib/data";
import Lightbox, { useLightbox, type LightboxImage } from "./Lightbox";

export default function FileDetail({
  brandId,
  brandName,
  file,
  imagesMeta,
}: {
  brandId: string;
  brandName: string;
  file: FileInfo;
  imagesMeta: Record<string, ImageMeta>;
}) {
  const lb = useLightbox();
  const [showSheets, setShowSheets] = useState(true);

  const lbImages: LightboxImage[] = file.images.map((md5, i) => ({
    md5,
    src: imgUrl(md5),
    caption: `${file.name} — ảnh ${i + 1}/${file.images.length}`,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <a href="/" className="hover:underline">
            Tổng quan
          </a>{" "}
          /{" "}
          <a href={`/brand/${brandId}`} className="hover:underline">
            {brandName}
          </a>{" "}
          /{" "}
          <a
            href={`/brand/${brandId}/hinh-the/${hinhTheSlug(file.hinh_the)}`}
            className="hover:underline"
          >
            {file.hinh_the}
          </a>{" "}
          / Chi tiết file
        </p>
        <h1 className="text-xl md:text-2xl font-bold mt-1 break-all">
          {file.name}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {formatMB(file.sizeMB)} · {file.sheets.length} sheet ·{" "}
          {file.images.length} ảnh minh họa
          {file.group ? ` · Nhóm: ${file.group}` : ""}
        </p>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSheets(!showSheets)}
          className="w-full flex items-center justify-between px-5 py-3 font-bold text-left hover:bg-slate-50 dark:hover:bg-slate-950"
        >
          <span>Danh sách sheet ({file.sheets.length})</span>
          <span className="text-slate-400 dark:text-slate-500">{showSheets ? "▾" : "▸"}</span>
        </button>
        {showSheets && (
          <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2">Sheet</th>
                  <th className="px-4 py-2 whitespace-nowrap">Dòng × Cột</th>
                  <th className="px-4 py-2">Tiêu đề cột</th>
                </tr>
              </thead>
              <tbody>
                {file.sheets.map((s, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-100 dark:border-slate-800 hover:bg-amber-50/40 dark:hover:bg-amber-950/40"
                  >
                    <td className="px-4 py-2 font-medium whitespace-nowrap">
                      {s.name}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {s.rows.toLocaleString("vi-VN")} ×{" "}
                      {s.cols.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400 text-xs">
                      {s.headers.filter(Boolean).join(" · ") || (
                        <span className="text-slate-400 dark:text-slate-500 italic">
                          (không có dòng tiêu đề)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-bold text-lg mb-3">
          Ảnh minh họa ({file.images.length})
        </h2>
        {file.images.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            File này không có ảnh nhúng.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {file.images.map((md5, i) => {
              const meta = imagesMeta[md5];
              return (
                <button
                  key={md5 + i}
                  onClick={() => lb.open(i)}
                  className="group relative aspect-square bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-amber-400 hover:shadow-md transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl(md5)}
                    alt={`Ảnh ${i + 1} — ${file.name}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                    {meta ? `${meta.w}×${meta.h}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {lb.index !== null && (
        <Lightbox
          images={lbImages}
          index={lb.index}
          onClose={lb.close}
          onNav={lb.setIndex}
        />
      )}
    </div>
  );
}
