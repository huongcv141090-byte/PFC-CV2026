"use client";

import { useMemo, useState } from "react";
import type { ImageMeta } from "@/lib/data";
import { imgUrl } from "@/lib/data";
import Lightbox, { useLightbox, type LightboxImage } from "./Lightbox";

export interface GalleryItem {
  md5: string;
  w: number;
  h: number;
  files: string[]; // "brandId/fileId"
}

export default function GalleryClient({
  items,
  brands,
  fileNames,
}: {
  items: GalleryItem[];
  brands: { id: string; name: string }[];
  fileNames: Record<string, string>;
}) {
  const [brand, setBrand] = useState<string>("all");
  const [q, setQ] = useState("");
  const lb = useLightbox();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (brand !== "all" && !it.files.some((f) => f.startsWith(brand + "/")))
        return false;
      if (needle) {
        const hay = it.files
          .map((f) => (fileNames[f] ?? f).toLowerCase())
          .join(" ");
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, brand, q, fileNames]);

  const lbImages: LightboxImage[] = filtered.map((it, i) => ({
    md5: it.md5,
    src: imgUrl(it.md5),
    caption: `Ảnh ${i + 1} — có trong ${it.files.length} file: ${it.files
      .slice(0, 3)
      .map((f) => fileNames[f] ?? f)
      .join("; ")}${it.files.length > 3 ? "…" : ""}`,
  }));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-500">
          <a href="/" className="hover:underline">
            Tổng quan
          </a>{" "}
          / Thư viện ảnh
        </p>
        <h1 className="text-2xl font-bold mt-1">
          Thư viện ảnh{" "}
          <span className="text-base font-normal text-slate-500">
            ({filtered.length}/{items.length} ảnh duy nhất)
          </span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Ảnh minh họa công đoạn đã tách từ file Excel, khử trùng lặp.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setBrand("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              brand === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white border-slate-300 hover:border-slate-400"
            }`}
          >
            Tất cả
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => setBrand(b.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                brand === b.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-300 hover:border-slate-400"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên file chứa ảnh…"
          className="w-full md:w-72 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-500 text-sm py-10 text-center">
          Không có ảnh nào khớp bộ lọc.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filtered.map((it, i) => (
            <button
              key={it.md5}
              onClick={() => lb.open(i)}
              className="group relative aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-amber-400 hover:shadow-md transition"
              title={it.files.map((f) => fileNames[f] ?? f).join("\n")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl(it.md5)}
                alt={`Ảnh minh họa ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                {it.w}×{it.h}
              </span>
              {it.files.length > 1 && (
                <span className="absolute top-1 left-1 text-[10px] bg-amber-500/90 text-white px-1.5 py-0.5 rounded">
                  ×{it.files.length} file
                </span>
              )}
            </button>
          ))}
        </div>
      )}

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
