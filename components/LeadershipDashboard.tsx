import Link from "next/link";
import { getStages } from "@/lib/data-server";
import { computeDashboard, fmtSec } from "@/lib/dashboard";

function Bar({ pct, tone }: { pct: number; tone: "amber" | "red" | "emerald" | "sky" }) {
  const bg =
    tone === "amber"
      ? "bg-gradient-to-r from-amber-400 to-orange-500"
      : tone === "red"
        ? "bg-gradient-to-r from-red-400 to-rose-500"
        : tone === "emerald"
          ? "bg-gradient-to-r from-emerald-400 to-teal-500"
          : "bg-gradient-to-r from-sky-400 to-blue-500";
  return (
    <div className="h-2.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div className={`h-full rounded-full ${bg}`} style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function LeadershipDashboard() {
  const stages = await getStages();
  const d = computeDashboard(stages);
  const maxBottle = d.bottlenecks[0]?.avgSec ?? 1;

  return (
    <section className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/60 to-transparent dark:from-amber-950/20 dark:to-transparent p-5 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          📊 Dashboard lãnh đạo
        </h2>
        <Link
          href="/cong-doan"
          className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline"
        >
          Xem chi tiết công đoạn →
        </Link>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
        Nhìn nhanh điểm nổi bật, thắt nút và cơ hội kaizen từ dữ liệu định mức thời gian.
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Kpi label="Công đoạn có định mức" value={String(d.kpis.totalCd)} sub="trên cả 2 nhãn hàng" />
        <Kpi
          label="Tỷ lệ thủ công"
          value={`${d.kpis.pctManual.toFixed(1)}%`}
          sub="không dùng thiết bị — dư địa kaizen lớn"
        />
        <Kpi
          label="Thắt nút lớn nhất"
          value={d.kpis.topBottleneck ? fmtSec(d.kpis.topBottleneck.avgSec) : "—"}
          sub={d.kpis.topBottleneck ? d.kpis.topBottleneck.ten : undefined}
        />
        <Kpi
          label="Tổng thời gian định mức"
          value={`${d.kpis.totalHours.toFixed(0)} giờ`}
          sub="cộng dồn mọi công đoạn × mã hàng"
        />
      </div>

      {/* Highlights */}
      <div className="mb-5 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-2">⭐ Điểm nổi bật</p>
        <ul className="space-y-1.5">
          {d.highlights.map((h, i) => (
            <li key={i} className="text-sm text-amber-900 dark:text-amber-100 flex gap-2">
              <span className="shrink-0">•</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Bottlenecks */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="font-bold text-sm mb-1 text-slate-900 dark:text-slate-100">
            🔴 Công đoạn thắt nút — tốn thời gian nhất
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Thời gian định mức trung bình mỗi lần thực hiện
          </p>
          <div className="space-y-2.5">
            {d.bottlenecks.map((m) => (
              <div key={`${m.brandId}-${m.ten}`}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={m.ten}>
                    {m.ten}
                    <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                      {m.brandName}
                    </span>
                    {!m.hasThietBi && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-medium">
                        thủ công
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap tabular-nums">
                    {fmtSec(m.avgSec)}
                  </span>
                </div>
                <Bar pct={(m.avgSec / maxBottle) * 100} tone={m.hasThietBi ? "amber" : "red"} />
              </div>
            ))}
          </div>
        </div>

        {/* Kaizen */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="font-bold text-sm mb-1 text-slate-900 dark:text-slate-100">
            💡 Cơ hội Kaizen — ưu tiên cơ giới hóa
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Công đoạn thủ công tốn nhiều thời gian nhất → thay người bằng máy
          </p>
          <div className="space-y-2.5">
            {d.kaizen.map(({ metric: m, hint }) => (
              <div
                key={`${m.brandId}-${m.ten}`}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200" title={m.ten}>
                    {m.ten}
                    <span className="ml-1.5 text-[10px] font-normal text-slate-400">{m.brandName}</span>
                  </span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap tabular-nums">
                    {fmtSec(m.avgSec)}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  → {hint}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Brand comparison */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="font-bold text-sm mb-3 text-slate-900 dark:text-slate-100">
            ⚖️ So sánh nhãn hàng
          </p>
          <div className="space-y-3">
            {d.brands.map((b) => (
              <div key={b.brandId}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {b.brandName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {b.nCd} công đoạn · TB {fmtSec(b.avgSec)}/lần · {b.pctThietBi.toFixed(1)}% có thiết bị
                  </span>
                </div>
                <Bar pct={b.pctThietBi} tone="emerald" />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Thanh = tỷ lệ công đoạn có dùng thiết bị
          </p>
        </div>

        {/* Variance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="font-bold text-sm mb-1 text-slate-900 dark:text-slate-100">
            📏 Chênh lệch cần chuẩn hóa
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Cùng công đoạn nhưng thời gian khác xa giữa các mã hàng
          </p>
          {d.variances.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Không phát hiện chênh lệch lớn — định mức khá đồng đều.
            </p>
          ) : (
            <div className="space-y-2">
              {d.variances.map((m) => (
                <div key={`${m.brandId}-${m.ten}`} className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate" title={m.ten}>
                    {m.ten}
                    <span className="ml-1.5 text-[10px] text-slate-400">{m.brandName}</span>
                  </span>
                  <span className="text-[11px] font-medium text-sky-700 dark:text-sky-400 whitespace-nowrap tabular-nums">
                    chênh {(m.variance * 100).toFixed(0)}% · {m.nFiles} mã hàng
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
