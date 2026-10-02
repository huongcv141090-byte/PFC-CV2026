import Link from "next/link";
import { getIndex, getImages } from "@/lib/data-server";
import { imgUrl } from "@/lib/data";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-3xl font-bold mt-1 text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default async function Home() {
  const [index, images] = await Promise.all([getIndex(), getImages()]);
  const totalFiles = index.brands.reduce((n, b) => n + b.files.length, 0);
  const totalSheets = index.brands.reduce(
    (n, b) => n + b.files.reduce((m, f) => m + f.sheets.length, 0),
    0
  );
  const totalImages = Object.keys(images).length;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Hồ sơ sản xuất PFC — xem trực quan
        </h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Duyệt toàn bộ file Excel PFC theo từng nhãn hàng: xem cấu trúc sheet
          (định mức LC, lưu trình công đoạn, quy trình công nghệ, định mức
          thời gian) và ảnh minh họa từng công đoạn — tất cả trên một giao
          diện duy nhất.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="File Excel" value={String(totalFiles)} />
        <StatCard label="Sheet" value={String(totalSheets)} />
        <StatCard label="Ảnh duy nhất" value={String(totalImages)} />
        <StatCard label="Nhãn hàng" value={String(index.brands.length)} />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {index.brands.map((b) => {
          const sheets = b.files.reduce((n, f) => n + f.sheets.length, 0);
          const preview = b.files[0]?.images?.[0];
          return (
            <Link
              key={b.id}
              href={`/brand/${b.id}`}
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-300 transition"
            >
              <div className="flex">
                <div className="w-36 h-32 shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl(preview)}
                      alt={b.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-slate-300">
                      {b.name[0]}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-bold">{b.name}</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {b.files.length} file · {sheets} sheet
                  </p>
                  <span className="inline-block mt-3 text-sm font-medium text-amber-700 group-hover:underline">
                    Xem danh sách file →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-bold text-lg mb-2">Các loại sheet trong hồ sơ</h2>
        <ul className="grid md:grid-cols-2 gap-2 text-sm text-slate-700">
          <li>
            <span className="font-mono font-semibold">LC*</span> — Bảng định
            mức vật tư theo style (Brand/Season/Article/Size/Color)
          </li>
          <li>
            <span className="font-mono font-semibold">LƯU TRÌNH_*</span> — Lưu
            trình công đoạn kèm ảnh minh họa
          </li>
          <li>
            <span className="font-mono font-semibold">QTCN_*</span> — Quy trình
            công nghệ (CHẶT / MAY / IN / GÒ / CL)
          </li>
          <li>
            <span className="font-mono font-semibold">
              ĐMTG_* / IN / MAY / KCS
            </span>{" "}
            — Định mức thời gian, kiểm tra chất lượng
          </li>
        </ul>
      </section>
    </div>
  );
}
