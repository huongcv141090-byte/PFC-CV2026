import Link from "next/link";
import { getStages } from "@/lib/data-server";
import SyncNote from "./SyncNote";

export const metadata = {
  title: "Công đoạn sản xuất — PFC Visual Browser",
  description:
    "Hệ thống công đoạn sản xuất theo từng nhãn hàng: diễn giải, thao tác, thông số, lưu ý và ảnh minh họa.",
};

export default async function CongDoanIndexPage() {
  const stages = await getStages();

  const cards = Object.values(stages.brands).map((b) => {
    const sts = Object.values(b.stages);
    const nCd = sts.reduce((s, st) => s + st.cong_doan.length, 0);
    const nImg =
      sts.reduce((s, st) => s + st.cong_doan.reduce((x, c) => x + c.images.length, 0), 0) +
      sts.reduce((s, st) => s + (st.qtcn_images?.length ?? 0), 0);
    return { b, nCd, nImg, stageNames: sts.map((s) => s.stage) };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Công đoạn sản xuất</h1>
      <p className="text-slate-600 mb-6 max-w-3xl">
        Hệ thống hóa toàn bộ hồ sơ theo từng công đoạn: mỗi công đoạn gồm diễn
        giải chi tiết, thao tác, thông số kỹ thuật, điểm lưu ý, ghi chú và hình
        ảnh minh họa trực quan — sắp xếp đúng trình tự sản xuất của từng nhãn
        hàng.
      </p>
      <div className="mb-6">
        <SyncNote />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {cards.map(({ b, nCd, nImg, stageNames }) => (
          <Link
            key={b.id}
            href={`/cong-doan/${b.id}`}
            className="block bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-amber-300 transition"
          >
            <h2 className="text-xl font-bold mb-1">{b.name}</h2>
            <p className="text-sm text-slate-500 mb-3">
              {nCd} công đoạn · {nImg.toLocaleString("vi-VN")} ảnh minh họa
            </p>
            <div className="flex flex-wrap gap-1.5">
              {stageNames.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700"
                >
                  {s}
                </span>
              ))}
            </div>
            <span className="inline-block mt-4 text-sm text-amber-700 font-medium">
              Xem hệ thống công đoạn →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
