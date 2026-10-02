import Link from "next/link";
import { getKaizen } from "@/lib/data-server";
import KaizenClient from "@/components/KaizenClient";

const LAYERS = [
  {
    icon: "📥",
    name: "Input",
    desc: "Định mức thời gian, dụng cụ, thiết bị, nhân lực từ 41 file Excel",
  },
  {
    icon: "🔢",
    name: "Feature",
    desc: "Vector đặc trưng mỗi công đoạn: thời gian trung bình, biến động, thủ công, số người",
  },
  {
    icon: "🧠",
    name: "Pattern",
    desc: "Học equipment KB từ dữ liệu + đo tương đồng ngữ nghĩa tên công đoạn",
  },
  {
    icon: "💡",
    name: "Output",
    desc: "Đề xuất kaizen chấm điểm impact, kèm bằng chứng kiểm chứng được",
  },
];

export default async function KaizenPage() {
  const kz = await getKaizen();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:underline">
            Tổng quan
          </Link>{" "}
          / Kaizen Engine
        </p>
        <h1 className="text-2xl font-bold mt-1">🧠 Kaizen Engine — audit liên tục</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-3xl">
          Engine học từ dữ liệu sản xuất thực tế để phát hiện cơ hội cải tiến:
          quét dụng cụ/thiết bị đang dùng, so sánh công đoạn tương tự, đề xuất
          cơ giới hóa — giảm thời gian, giảm con người, tăng năng suất.
          Chạy tự động mỗi lần đồng bộ dữ liệu mới từ Drive.
        </p>
      </div>

      {/* Neural layers */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LAYERS.map((l, i) => (
          <div key={l.name} className="relative">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 h-full">
              <p className="text-2xl">{l.icon}</p>
              <p className="font-bold text-sm mt-2 text-slate-900 dark:text-slate-100">
                {i + 1}. {l.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{l.desc}</p>
            </div>
            {i < LAYERS.length - 1 && (
              <span className="hidden lg:block absolute top-1/2 -right-3.5 -translate-y-1/2 text-amber-500 text-xl z-10">
                →
              </span>
            )}
          </div>
        ))}
      </div>

      {!kz ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">
          Chưa có dữ liệu phân tích — engine sẽ chạy ở lần đồng bộ tiếp theo.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Công đoạn phân tích", value: String(kz.stats.n_cong_doan) },
              { label: "Thủ công (chưa có máy)", value: String(kz.stats.n_manual) },
              { label: "Đề xuất kaizen", value: String(kz.stats.n_recommendations) },
              {
                label: "Engine",
                value: kz.engine,
                sub: new Date(kz.generated_at).toLocaleString("vi-VN"),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm"
              >
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
                <p className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-slate-100">
                  {s.value}
                </p>
                {s.sub && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{s.sub}</p>
                )}
              </div>
            ))}
          </div>
          <KaizenClient recs={kz.recommendations} />
        </>
      )}
    </div>
  );
}
