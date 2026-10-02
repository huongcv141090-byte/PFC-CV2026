"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "working" | "done" | "error" | "noconfig";

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    const t = new Date(d.getTime() + 7 * 3600 * 1000); // Asia/Ho_Chi_Minh
    return `${p(t.getUTCHours())}:${p(t.getUTCMinutes())} ${p(t.getUTCDate())}/${p(
      t.getUTCMonth() + 1
    )}/${t.getUTCFullYear()}`;
  } catch {
    return iso;
  }
}

export default function RefreshButton({ lastSync }: { lastSync: string | null }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function poll(since: number) {
    const t0 = Date.now();
    const tick = async () => {
      try {
        const r = await fetch("/api/refresh", { cache: "no-store" });
        const j = await r.json();
        // chi xet run duoc tao sau khi bam nut (tru hao 60s)
        const run = (j.runs ?? []).find(
          (x: { created_at: string }) => new Date(x.created_at).getTime() >= since - 60000
        );
        if (run) {
          if (run.status === "completed") {
            if (run.conclusion === "success") {
              setPhase("done");
              setMsg("Hoàn tất! Web đang cập nhật bản mới, tự tải lại sau 90 giây…");
              timer.current = setTimeout(() => window.location.reload(), 90000);
            } else {
              setPhase("error");
              setMsg("Quét xong nhưng có lỗi — anh báo mình kiểm tra nhé.");
            }
            return;
          }
          setMsg(
            run.status === "in_progress"
              ? "Đang tải file mới từ Drive và xử lý dữ liệu…"
              : "Đã nhận yêu cầu, đang xếp hàng chạy…"
          );
        }
      } catch {
        /* giu nguyen trang thai, thu lai */
      }
      if (Date.now() - t0 > 20 * 60 * 1000) {
        setPhase("error");
        setMsg("Quá thời gian chờ — anh thử bấm lại sau ít phút nhé.");
        return;
      }
      timer.current = setTimeout(tick, 10000);
    };
    tick();
  }

  async function start() {
    if (phase === "working") return;
    setPhase("working");
    setMsg("Đang gửi yêu cầu quét…");
    try {
      const r = await fetch("/api/refresh", { method: "POST" });
      const j = await r.json();
      if (!j.ok) {
        if (j.error === "not_configured") {
          setPhase("noconfig");
        } else {
          setPhase("error");
          setMsg("Không gửi được yêu cầu — anh thử lại sau ít phút nhé.");
        }
        return;
      }
      setMsg("Đã nhận yêu cầu, đang xếp hàng chạy…");
      poll(new Date(j.at).getTime());
    } catch {
      setPhase("error");
      setMsg("Lỗi kết nối — anh thử lại sau ít phút nhé.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <button
        onClick={start}
        disabled={phase === "working"}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400 transition disabled:opacity-60 disabled:cursor-wait"
      >
        <span className={phase === "working" ? "animate-spin inline-block" : ""}>⟳</span>
        {phase === "working" ? "Đang quét…" : "Quét dữ liệu mới từ Drive"}
      </button>
      {lastSync && phase === "idle" && (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Lần đồng bộ gần nhất: {fmt(lastSync)}
        </span>
      )}
      {phase === "working" && (
        <span className="text-xs text-amber-700 dark:text-amber-400">{msg}</span>
      )}
      {phase === "done" && (
        <span className="text-xs text-emerald-700 dark:text-emerald-400">{msg}</span>
      )}
      {phase === "error" && (
        <span className="text-xs text-red-600 dark:text-red-400">{msg}</span>
      )}
      {phase === "noconfig" && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Chức năng chưa được bật — anh nhắn mình để mình bật nhé.
        </span>
      )}
    </div>
  );
}
