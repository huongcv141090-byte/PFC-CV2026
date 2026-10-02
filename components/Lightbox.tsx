"use client";

import { useCallback, useEffect, useState } from "react";

export interface LightboxImage {
  md5: string;
  src: string;
  caption?: string;
}

export default function Lightbox({
  images,
  index,
  onClose,
  onNav,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  const img = images[index];

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav((index + 1) % images.length);
      if (e.key === "ArrowLeft")
        onNav((index - 1 + images.length) % images.length);
    },
    [index, images.length, onClose, onNav]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onKey]);

  if (!img) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-5 text-white/80 hover:text-white text-3xl leading-none"
        onClick={onClose}
        aria-label="Đóng"
      >
        ×
      </button>
      <button
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl px-2"
        onClick={(e) => {
          e.stopPropagation();
          onNav((index - 1 + images.length) % images.length);
        }}
        aria-label="Ảnh trước"
      >
        ‹
      </button>
      <div
        className="max-w-5xl max-h-[88vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.src}
          alt={img.caption ?? `Ảnh ${index + 1}`}
          className="max-h-[78vh] max-w-full object-contain rounded shadow-2xl bg-white dark:bg-slate-900"
        />
        <div className="mt-3 text-center">
          {img.caption && (
            <p className="text-white/90 text-sm break-all">{img.caption}</p>
          )}
          <p className="text-white/50 text-xs mt-1">
            {index + 1} / {images.length} — dùng ← → để chuyển, Esc để đóng
          </p>
        </div>
      </div>
      <button
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl px-2"
        onClick={(e) => {
          e.stopPropagation();
          onNav((index + 1) % images.length);
        }}
        aria-label="Ảnh sau"
      >
        ›
      </button>
    </div>
  );
}

export function useLightbox() {
  const [index, setIndex] = useState<number | null>(null);
  const open = (i: number) => setIndex(i);
  const close = () => setIndex(null);
  return { index, open, close, setIndex };
}
