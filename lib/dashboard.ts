import type { StagesData } from "./data";

export interface CdMetric {
  ten: string;
  brandId: string;
  brandName: string;
  avgSec: number;
  totalSec: number;
  nFiles: number;
  hasThietBi: boolean;
  variance: number; // (max-min)/avg
}

export interface BrandSummary {
  brandId: string;
  brandName: string;
  nCd: number;
  pctThietBi: number;
  avgSec: number;
  totalHours: number;
}

function num(x: unknown): number {
  const v = typeof x === "number" ? x : parseFloat(String(x ?? ""));
  return Number.isFinite(v) ? v : 0;
}

function kaizenHint(ten: string): string {
  const t = ten.toLowerCase();
  if (t.includes("mài tay")) return "Thay mài tay bằng máy mài chuyên dụng";
  if (t.includes("vệ sinh") || t.includes("rửa")) return "Thiết bị vệ sinh/rửa tự động hoặc bán tự động";
  if (t.includes("dán")) return "Máy dán/ép thay thao tác dán thủ công";
  if (t.includes("khuôn")) return "Thiết bị chuẩn bị và vệ sinh khuôn";
  if (t.includes("chỉnh sửa")) return "Chuẩn hóa thao tác bằng jig/gá định vị";
  if (t.includes("quét keo")) return "Máy quét keo tự động, kiểm soát lượng keo";
  if (t.includes("ép")) return "Máy ép chuyên dụng thay ép thủ công";
  return "Xem xét cơ giới hóa — ứng dụng máy móc thiết bị";
}

export interface DashboardData {
  brands: BrandSummary[];
  bottlenecks: CdMetric[];
  kaizen: { metric: CdMetric; hint: string }[];
  variances: CdMetric[];
  kpis: {
    totalCd: number;
    pctManual: number;
    topBottleneck: CdMetric | null;
    totalHours: number;
  };
  highlights: string[];
}

export function computeDashboard(stages: StagesData): DashboardData {
  const all: CdMetric[] = [];
  const brands: BrandSummary[] = [];

  for (const [bid, b] of Object.entries(stages.brands)) {
    const map = new Map<string, CdMetric & { mx: number; mn: number }>();
    for (const st of Object.values(b.stages)) {
      for (const cd of st.cong_doan) {
        let m = map.get(cd.ten);
        if (!m) {
          m = {
            ten: cd.ten, brandId: bid, brandName: b.name,
            avgSec: 0, totalSec: 0, nFiles: 0,
            hasThietBi: false, variance: 0, mx: 0, mn: Infinity,
          };
          map.set(cd.ten, m);
        }
        for (const f of cd.files) {
          const t = num(f.thoi_gian_s);
          if (t > 0) {
            m.totalSec += t;
            m.nFiles += 1;
            m.mx = Math.max(m.mx, t);
            m.mn = Math.min(m.mn, t);
          }
          if (String(f.thiet_bi ?? "").trim()) m.hasThietBi = true;
        }
      }
    }
    const list = Array.from(map.values()).filter((m) => m.nFiles > 0);
    for (const m of list) {
      m.avgSec = m.totalSec / m.nFiles;
      m.variance = m.avgSec > 0 ? (m.mx - m.mn) / m.avgSec : 0;
    }
    all.push(...list);
    const withTb = list.filter((m) => m.hasThietBi).length;
    const tot = list.reduce((s, m) => s + m.totalSec, 0);
    brands.push({
      brandId: bid,
      brandName: b.name,
      nCd: list.length,
      pctThietBi: list.length ? (withTb / list.length) * 100 : 0,
      avgSec: list.length ? tot / list.reduce((s, m) => s + m.nFiles, 0) : 0,
      totalHours: tot / 3600,
    });
  }

  const bottlenecks = [...all].sort((a, b) => b.avgSec - a.avgSec).slice(0, 8);
  const kaizen = [...all]
    .filter((m) => !m.hasThietBi)
    .sort((a, b) => b.avgSec - a.avgSec)
    .slice(0, 6)
    .map((metric) => ({ metric, hint: kaizenHint(metric.ten) }));
  const variances = [...all]
    .filter((m) => m.nFiles >= 3 && m.variance > 0.3)
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 5);

  const totalCd = all.length;
  const manual = all.filter((m) => !m.hasThietBi).length;
  const topBottleneck = bottlenecks[0] ?? null;
  const totalHours = brands.reduce((s, x) => s + x.totalHours, 0);

  const bestMech = [...brands].sort((a, b) => b.pctThietBi - a.pctThietBi)[0];
  const highlights: string[] = [
    `${((manual / Math.max(1, totalCd)) * 100).toFixed(1)}% công đoạn hoàn toàn thủ công — dư địa cơ giới hóa còn rất lớn`,
  ];
  if (topBottleneck) {
    highlights.push(
      `Thắt nút lớn nhất: “${topBottleneck.ten}” — ${fmtSec(topBottleneck.avgSec)}/lần (${topBottleneck.brandName}), đang làm thủ công`
    );
  }
  if (bestMech && brands.length > 1) {
    highlights.push(
      `${bestMech.brandName} cơ giới hóa ${bestMech.pctThietBi.toFixed(1)}% — mô hình để nhân rộng sang nhãn còn lại`
    );
  }
  if (variances.length) {
    highlights.push(
      `${variances.length} công đoạn chênh lệch trên 30% giữa các mã hàng — cần chuẩn hóa định mức và thao tác`
    );
  }

  return {
    brands,
    bottlenecks,
    kaizen,
    variances,
    kpis: {
      totalCd,
      pctManual: totalCd ? (manual / totalCd) * 100 : 0,
      topBottleneck,
      totalHours,
    },
    highlights,
  };
}

export function fmtSec(s: number): string {
  if (s >= 3600) return `${(s / 3600).toFixed(1)} giờ`;
  if (s >= 60) return `${(s / 60).toFixed(1)} phút`;
  return `${s.toFixed(s < 10 ? 1 : 0)} giây`;
}
