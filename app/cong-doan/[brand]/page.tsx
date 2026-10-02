import Link from "next/link";
import { notFound } from "next/navigation";
import { getStages, getFileNames, getSyncInfo } from "@/lib/data-server";
import { imgUrl, type CongDoan } from "@/lib/data";
import CongDoanGallery from "@/components/CongDoanGallery";
import CongDoanSearch from "./CongDoanSearch";
import RefreshButton from "@/components/RefreshButton";

export async function generateStaticParams() {
  const stages = await getStages();
  return Object.keys(stages.brands).map((brand) => ({ brand }));
}

function stageSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-");
}

function timeRange(cd: CongDoan): string | null {
  const vals = cd.files
    .map((f) => f.thoi_gian_s)
    .filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const fmt = (v: number) => (Number.isInteger(v) ? `${v}` : v.toFixed(1));
  return lo === hi ? `${fmt(lo)} giây` : `${fmt(lo)}–${fmt(hi)} giây`;
}

function splitSteps(text: string): string[] {
  const parts = text.split(/(?=\d+\.\s)/).map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts : [text];
}

export default async function CongDoanBrandPage({
  params,
}: {
  params: { brand: string };
}) {
  const stages = await getStages();
  const b = stages.brands[params.brand];
  if (!b) notFound();
  const fileNames = await getFileNames();
  const sync = await getSyncInfo();

  const ordered = stages.order
    .map((name) => b.stages[name])
    .filter(Boolean);

  return (
    <div>
      <nav className="text-sm text-slate-500 dark:text-slate-400 mb-2">
        <Link href="/cong-doan" className="hover:underline">
          Công đoạn
        </Link>{" "}
        / <span className="text-slate-800 dark:text-slate-200 font-medium">{b.name}</span>
      </nav>
      <h1 className="text-2xl font-bold mb-1">
        Hệ thống công đoạn — {b.name}
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Sắp xếp đúng trình tự sản xuất. Bấm vào từng công đoạn để xem diễn
        giải chi tiết, thao tác, thông số, lưu ý và ảnh minh họa.
      </p>

      <CongDoanSearch
        names={ordered.flatMap((st) =>
          st.cong_doan.map((cd) => ({ id: cd.id, ten: cd.ten, stage: st.stage }))
        )}
      />
      <div className="mb-4">
        <RefreshButton lastSync={sync?.last_sync ?? null} />
      </div>

      <div className="sticky top-[57px] z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur py-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {ordered.map((st) => (
            <a
              key={st.stage}
              href={`#${stageSlug(st.stage)}`}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400 transition"
            >
              {st.stage} ({st.cong_doan.length})
            </a>
          ))}
        </div>
      </div>

      {ordered.map((st) => (
        <section
          key={st.stage}
          id={stageSlug(st.stage)}
          data-stage-section={st.stage}
          className="mb-10 scroll-mt-32"
        >
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{st.stage}</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {st.cong_doan.length} công đoạn
            </span>
          </div>

          {st.bang_chi_tiet.length > 0 && (
            <details className="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <summary className="px-4 py-3 cursor-pointer font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-950">
                Bảng chi tiết {st.stage} ({st.bang_chi_tiet.length} bảng theo mã hàng)
              </summary>
              <div className="px-4 pb-4 space-y-4">
                {st.bang_chi_tiet.slice(0, 3).map((t, ti) => (
                  <div key={ti}>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {fileNames[t.file] ?? t.file} · {t.sheet.trim()}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="text-xs w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800">
                            {t.headers.map((h) => (
                              <th key={h} className="border border-slate-200 dark:border-slate-700 px-2 py-1 text-left font-medium whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {t.rows.slice(0, 12).map((row, ri) => (
                            <tr key={ri} className="odd:bg-white dark:odd:bg-slate-900 even:bg-slate-50 dark:even:bg-slate-950">
                              {t.headers.map((h) => (
                                <td key={h} className="border border-slate-200 dark:border-slate-700 px-2 py-1 whitespace-nowrap">
                                  {row[h] ?? ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {t.rows.length > 12 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        …và {t.rows.length - 12} dòng nữa
                      </p>
                    )}
                  </div>
                ))}
                {st.bang_chi_tiet.length > 3 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    …và {st.bang_chi_tiet.length - 3} bảng của các mã hàng khác
                  </p>
                )}
              </div>
            </details>
          )}

          {(st.qtcn_images?.length ?? 0) > 0 && (
            <details className="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <summary className="px-4 py-3 cursor-pointer font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-950">
                Ảnh từ Quy trình công nghệ {st.stage} ({st.qtcn_images!.length} ảnh)
              </summary>
              <div className="px-4 pb-4">
                <CongDoanGallery images={st.qtcn_images!} title={`QTCN ${st.stage}`} />
              </div>
            </details>
          )}

          <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-3">
            {st.cong_doan.map((cd, idx) => {
              const t = timeRange(cd);
              const thumb = cd.images[0];
              return (
                <li key={cd.id} data-cd-name={cd.ten} className="relative pl-8">
                  <span className="absolute -left-[15px] top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-900 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <Link
                    href={`/cong-doan/${params.brand}/${cd.id}`}
                    className="flex gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:shadow-md hover:border-amber-300 transition"
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl(thumb)}
                        alt={cd.ten}
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-lg object-cover bg-slate-100 dark:bg-slate-800"
                      />
                    ) : (
                      <span className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 text-xl">
                        ◈
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {cd.ten}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {[t ? `⏱ ${t}` : null, `${cd.files.length} mã hàng`, `${cd.images.length} ảnh`]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {cd.files[0]?.dien_giai?.[0] && (
                        <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {splitSteps(cd.files[0].dien_giai[0])[0]}
                        </span>
                      )}
                    </span>
                  </Link>
                  {cd.files.length > 0 && (
                    <details className="mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <summary className="px-3 py-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950">
                        Định mức thời gian ({cd.files.length} mã hàng)
                      </summary>
                      <div className="overflow-x-auto px-3 pb-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-left">
                              <th className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-medium">Mã hàng</th>
                              <th className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-medium whitespace-nowrap">STT</th>
                              <th className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-medium whitespace-nowrap">Thời gian</th>
                              <th className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-medium whitespace-nowrap">Người/CĐ</th>
                              <th className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-medium">Thiết bị</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cd.files.map((f, fi) => (
                              <tr key={fi} className="odd:bg-white dark:odd:bg-slate-900 even:bg-slate-50 dark:even:bg-slate-950">
                                <td className="border border-slate-200 dark:border-slate-700 px-2 py-1">
                                  {fileNames[f.file] ?? f.file}
                                </td>
                                <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 text-center">
                                  {f.stt ?? "—"}
                                </td>
                                <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 whitespace-nowrap">
                                  {f.thoi_gian_s != null
                                    ? `${Number.isInteger(f.thoi_gian_s) ? f.thoi_gian_s : f.thoi_gian_s.toFixed(1)} giây`
                                    : "—"}
                                </td>
                                <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 text-center">
                                  {f.nguoi ?? "—"}
                                </td>
                                <td className="border border-slate-200 dark:border-slate-700 px-2 py-1">
                                  {f.thiet_bi ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
