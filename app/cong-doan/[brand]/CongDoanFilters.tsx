"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface HtOption {
  name: string;
  slug: string;
}

export interface MauOption {
  name: string;
  slug: string;
  htSlugs: string[];
}

function Filters({
  hinhThes,
  mauOptions,
}: {
  hinhThes: HtOption[];
  mauOptions: MauOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const ht = sp.get("ht") ?? "";
  const mau = sp.get("mau") ?? "";

  function nav(nht: string, nmau: string) {
    const p = new URLSearchParams();
    if (nht) p.set("ht", nht);
    if (nmau) p.set("mau", nmau);
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const scopedMau = ht ? mauOptions.filter((c) => c.htSlugs.includes(ht)) : mauOptions;

  function onHt(v: string) {
    // reset mau nếu màu đang chọn không thuộc hình thể mới
    const nextMau =
      v && mau && !mauOptions.some((c) => c.slug === mau && c.htSlugs.includes(v))
        ? ""
        : mau;
    nav(v, nextMau);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {hinhThes.length > 1 && (
        <select
          value={ht}
          onChange={(e) => onHt(e.target.value)}
          className="shrink-0 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-slate-900 max-w-[200px]"
          aria-label="Lọc theo hình thể"
        >
          <option value="">Tất cả hình thể</option>
          {hinhThes.map((h) => (
            <option key={h.slug} value={h.slug}>
              {h.name}
            </option>
          ))}
        </select>
      )}
      {mauOptions.length > 0 && (
        <select
          value={scopedMau.some((c) => c.slug === mau) ? mau : ""}
          onChange={(e) => nav(ht, e.target.value)}
          className="shrink-0 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-slate-900 max-w-[220px]"
          aria-label="Lọc theo màu sắc"
        >
          <option value="">Tất cả màu sắc</option>
          {scopedMau.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default function CongDoanFilters(props: {
  hinhThes: HtOption[];
  mauOptions: MauOption[];
}) {
  return (
    <Suspense fallback={null}>
      <Filters {...props} />
    </Suspense>
  );
}
