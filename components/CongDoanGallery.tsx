"use client";

import { useState } from "react";
import Lightbox, { useLightbox, type LightboxImage } from "./Lightbox";
import { imgUrl } from "@/lib/data";

export default function CongDoanGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const { index, open, close, setIndex } = useLightbox();
  const [shown, setShown] = useState(48);
  if (images.length === 0) return null;

  const lbImages: LightboxImage[] = images.map((md5, i) => ({
    md5,
    src: imgUrl(md5),
    caption: `${title} — ảnh ${i + 1}`,
  }));
  const visible = images.slice(0, shown);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">
        Hình ảnh minh họa{" "}
        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
          ({images.length} ảnh)
        </span>
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {visible.map((md5, i) => (
          <button
            key={md5}
            onClick={() => open(i)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title={`Xem ảnh ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl(md5)}
              alt={`${title} — ảnh ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition"
            />
          </button>
        ))}
      </div>
      {shown < images.length && (
        <button
          onClick={() => setShown((s) => s + 48)}
          className="mt-3 px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          Xem thêm {images.length - shown} ảnh
        </button>
      )}
      {index !== null && (
        <Lightbox
          images={lbImages.slice(0, shown)}
          index={index}
          onClose={close}
          onNav={setIndex}
        />
      )}
    </section>
  );
}
