import { getSyncInfo } from "@/lib/data-server";

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    // Asia/Ho_Chi_Minh = UTC+7
    const t = new Date(d.getTime() + 7 * 3600 * 1000);
    return `${p(t.getUTCHours())}:${p(t.getUTCMinutes())} ${p(t.getUTCDate())}/${p(
      t.getUTCMonth() + 1
    )}/${t.getUTCFullYear()}`;
  } catch {
    return iso;
  }
}

export default async function SyncNote() {
  const s = await getSyncInfo();
  if (!s) return null;
  return (
    <p className="text-xs text-slate-400">
      ⟳ Dữ liệu tự động đồng bộ từ Drive: {fmt(s.last_sync)}
    </p>
  );
}
