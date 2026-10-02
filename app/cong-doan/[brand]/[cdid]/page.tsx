import Link from "next/link";
import { notFound } from "next/navigation";
import { getStages, getCongDoan, getFileNames } from "@/lib/data-server";
import CongDoanGallery from "@/components/CongDoanGallery";

export async function generateStaticParams() {
  const stages = await getStages();
  const params: { brand: string; cdid: string }[] = [];
  for (const b of Object.values(stages.brands)) {
    for (const st of Object.values(b.stages)) {
      for (const cd of st.cong_doan) {
        params.push({ brand: b.id, cdid: cd.id });
      }
    }
  }
  return params;
}

function splitSteps(text: string): string[] {
  const parts = text
    .split(/(?=\d+\.\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : [text];
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function fmtTime(v: number | null | undefined, raw?: string): string {
  if (typeof v === "number") {
    return `${Number.isInteger(v) ? v : v.toFixed(1)} giây/đôi`;
  }
  return raw || "—";
}

export default async function CongDoanDetailPage({
  params,
}: {
  params: { brand: string; cdid: string };
}) {
  const cd = await getCongDoan(params.brand, params.cdid);
  if (!cd) notFound();
  const stages = await getStages();
  const brandName = stages.brands[params.brand]?.name ?? params.brand;
  const fileNames = await getFileNames();

  // merge across files
  const dienGiai = uniq(cd.files.flatMap((f) => f.dien_giai ?? []));
  const steps = uniq(dienGiai.flatMap(splitSteps));
  const thongSo = uniq(
    cd.files.flatMap((f) => (f.thong_so ?? []).map((r) => JSON.stringify(r)))
  ).map((s) => JSON.parse(s) as Record<string, string>);
  const dungCu = uniq(cd.files.flatMap((f) => f.dung_cu ?? []));
  const baoHo = uniq(cd.files.flatMap((f) => f.bao_ho ?? []));
  const thietBi = uniq(
    cd.files.map((f) => f.thiet_bi).filter((v): v is string => !!v)
  );
  const ghiChu = uniq(
    cd.files
      .map((f) =>
        f.ghi_chu ? `${fileNames[f.file] ?? f.file}: ${f.ghi_chu}` : ""
      )
      .filter(Boolean)
  );
  const dmtgRows = cd.files.filter(
    (f) => f.thoi_gian_s != null || f.thoi_gian_raw || f.thiet_bi
  );

  return (
    <div className="max-w-4xl">
      <nav className="text-sm text-slate-500 mb-3">
        <Link href="/cong-doan" className="hover:underline">
          Công đoạn
        </Link>{" "}
        /{" "}
        <Link href={`/cong-doan/${params.brand}`} className="hover:underline">
          {brandName}
        </Link>{" "}
        / <span className="text-slate-800 font-medium">{cd.stage}</span>
      </nav>

      <div className="flex items-start gap-4 mb-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white text-lg font-bold">
          {cd.stt ?? "·"}
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight">{cd.ten}</h1>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
              {cd.stage}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-medium">
              {brandName}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
              {cd.files.length} mã hàng · {cd.images.length} ảnh
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <CongDoanGallery images={cd.images} title={cd.ten} />

        {steps.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-3">
              Diễn giải & thao tác
            </h2>
            <ol className="space-y-2.5">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-slate-700 leading-relaxed">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{s.replace(/^\d+\.\s*/, "")}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {thongSo.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-3">Thông số kỹ thuật</h2>
            <div className="space-y-3">
              {thongSo.map((row, i) => (
                <dl
                  key={i}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200"
                >
                  {Object.entries(row).map(([k, v]) => (
                    <div key={k} className="bg-white px-3 py-2">
                      <dt className="text-xs text-slate-500">{k}</dt>
                      <dd className="font-medium text-slate-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              ))}
            </div>
          </section>
        )}

        {dmtgRows.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-3">Định mức thời gian</h2>
            <div className="overflow-x-auto">
              <table className="text-sm w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="border border-slate-200 px-3 py-2 font-medium">Mã hàng</th>
                    <th className="border border-slate-200 px-3 py-2 font-medium whitespace-nowrap">STT</th>
                    <th className="border border-slate-200 px-3 py-2 font-medium whitespace-nowrap">Thời gian</th>
                    <th className="border border-slate-200 px-3 py-2 font-medium whitespace-nowrap">Người/CĐ</th>
                    <th className="border border-slate-200 px-3 py-2 font-medium">Thiết bị</th>
                    <th className="border border-slate-200 px-3 py-2 font-medium">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {dmtgRows.map((f, i) => (
                    <tr key={i} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2 text-xs">
                        {fileNames[f.file] ?? f.file}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center">
                        {f.stt ?? "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 whitespace-nowrap font-medium">
                        {fmtTime(f.thoi_gian_s, f.thoi_gian_raw)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        {f.nguoi ? Number(f.nguoi).toFixed(2) : "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">{f.thiet_bi || "—"}</td>
                      <td className="border border-slate-200 px-3 py-2 text-xs">{f.ghi_chu || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {(dungCu.length > 0 || thietBi.length > 0) && (
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-3">Thiết bị & dụng cụ</h2>
            <div className="flex flex-wrap gap-2">
              {uniq([...thietBi, ...dungCu]).map((d) => (
                <span key={d} className="px-3 py-1.5 rounded-lg bg-slate-100 text-sm font-medium">
                  {d}
                </span>
              ))}
            </div>
          </section>
        )}

        {baoHo.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-3">Bảo hộ lao động</h2>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              {baoHo.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </section>
        )}

        {ghiChu.length > 0 && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-3">Điểm lưu ý & ghi chú</h2>
            <ul className="space-y-2 text-slate-700">
              {ghiChu.map((g, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-600 font-bold">!</span>
                  <span className="text-sm">{g}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="text-xs text-slate-400">
          Nguồn:{" "}
          {uniq(cd.files.map((f) => `${fileNames[f.file] ?? f.file} · ${f.sheet.trim()}`)).join(" — ")}
        </section>
      </div>
    </div>
  );
}
