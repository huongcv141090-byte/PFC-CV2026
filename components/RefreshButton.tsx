"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "working" | "done" | "error" | "noconfig";

interface StepInfo {
  name: string;
  status: string; // queued | in_progress | completed
  conclusion: string | null; // success | failure | skipped | null
  jobId: number;
}

const STEP_LABELS: [RegExp, string][] = [
  [/scan drive/i, "Quét Drive tìm file mới"],
  [/rebuild web data/i, "Xử lý dữ liệu (định mức, công đoạn, ảnh)"],
  [/verify production build/i, "Kiểm tra bản build"],
  [/commit and push/i, "Đẩy lên GitHub → Vercel tự deploy"],
];

function friendlyStep(name: string): string {
  for (const [re, label] of STEP_LABELS) {
    if (re.test(name)) return label;
  }
  return name;
}

// chi lay cac step chinh cua job "refresh" (bo qua step he thong Set up job/Complete job)
function mainSteps(job: { id: number; steps: { name: string; status: string; conclusion: string | null }[] }): StepInfo[] {
  return job.steps
    .filter((s) => !/set up job|complete job|checkout|setup-python|setup-node|install python deps|restore drive files cache/i.test(s.name))
    .map((s) => ({ name: friendlyStep(s.name), status: s.status, conclusion: s.conclusion, jobId: job.id }));
}

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    const t = new Date(d.getTime() + 7 * 3600 * 1000);
    return `${p(t.getUTCHours())}:${p(t.getUTCMinutes())} ${p(t.getUTCDate())}/${p(t.getUTCMonth() + 1)}/${t.getUTCFullYear()}`;
  } catch {
    return iso;
  }
}

export default function RefreshButton({ lastSync }: { lastSync: string | null }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<StepInfo[]>([]);
  const [note, setNote] = useState("");
  const [failedJobId, setFailedJobId] = useState<number | null>(null);
  const [logTail, setLogTail] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function loadLog(jobId: number) {
    setLogOpen(true);
    setLogTail("Đang tải log…");
    try {
      const r = await fetch(`/api/refresh?logs=${jobId}`, { cache: "no-store" });
      const j = await r.json();
      if (j.ok) {
        const errPart = (j.errLines ?? []).length
          ? "=== DÒNG BÁO LỖI ===\n" + (j.errLines as string[]).join("\n") + "\n\n"
          : "";
        setLogTail(errPart + "=== ĐUÔI LOG ===\n" + j.tail);
      } else {
        setLogTail("Không tải được log.");
      }
    } catch {
      setLogTail("Không tải được log.");
    }
  }

  async function poll(since: number) {
    const t0 = Date.now();
    const tick = async () => {
      try {
        const r = await fetch("/api/refresh", { cache: "no-store" });
        const j = await r.json();
        const run = (j.runs ?? []).find(
          (x: { created_at: string }) => new Date(x.created_at).getTime() >= since - 60000
        );
        if (run) {
          const job = (run.jobs ?? [])[0];
          const ms = job ? mainSteps(job) : [];
          setSteps(ms);

          if (run.status === "completed") {
            const failed = ms.find((s) => s.conclusion === "failure");
            const skippedAll = ms.length > 0 && ms.every((s) => s.conclusion === "skipped");
            if (failed) {
              setPhase("error");
              setFailedJobId(failed.jobId);
              setNote(`Lỗi ở bước "${failed.name}" — bấm "Xem chi tiết lỗi" để biết cách xử lý.`);
            } else if (run.conclusion === "success" && skippedAll) {
              setPhase("done");
              setNote("Không có file mới — dữ liệu web đã là bản mới nhất.");
            } else if (run.conclusion === "success") {
              setPhase("done");
              setNote("Hoàn tất! Web đang cập nhật bản mới, tự tải lại sau 90 giây…");
              timer.current = setTimeout(() => window.location.reload(), 90000);
            } else {
              setPhase("error");
              setNote(`Quét dừng với trạng thái "${run.conclusion}" — bấm "Xem chi tiết lỗi" để biết thêm.`);
              if (job) setFailedJobId(job.id);
            }
            return;
          }
          // dang chay
          const cur = ms.find((s) => s.status === "in_progress");
          setNote(cur ? `Đang: ${cur.name}…` : "Đã nhận yêu cầu, đang xếp hàng chạy…");
        }
      } catch {
        /* giu nguyen, thu lai */
      }
      if (Date.now() - t0 > 20 * 60 * 1000) {
        setPhase("error");
        setNote("Quá thời gian chờ — anh thử bấm lại sau ít phút nhé.");
        return;
      }
      timer.current = setTimeout(tick, 8000);
    };
    tick();
  }

  async function start() {
    if (phase === "working") return;
    setPhase("working");
    setSteps([]);
    setLogTail(null);
    setLogOpen(false);
    setFailedJobId(null);
    setNote("Đang gửi yêu cầu quét…");
    try {
      const r = await fetch("/api/refresh", { method: "POST" });
      const j = await r.json();
      if (!j.ok) {
        if (j.error === "not_configured") setPhase("noconfig");
        else {
          setPhase("error");
          setNote("Không gửi được yêu cầu — anh thử lại sau ít phút nhé.");
        }
        return;
      }
      setNote("Đã nhận yêu cầu, đang xếp hàng chạy…");
      poll(new Date(j.at).getTime());
    } catch {
      setPhase("error");
      setNote("Lỗi kết nối — anh thử lại sau ít phút nhé.");
    }
  }

  const doneCount = steps.filter((s) => s.status === "completed").length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <div className="w-full">
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
        {(phase === "working" || phase === "done") && note && (
          <span
            className={`text-xs ${phase === "done" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}
          >
            {note}
          </span>
        )}
        {phase === "error" && note && (
          <span className="text-xs text-red-600 dark:text-red-400">{note}</span>
        )}
        {phase === "noconfig" && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Chức năng chưa được bật — anh nhắn mình để mình bật nhé.
          </span>
        )}
      </div>

      {(phase === "working" || phase === "done" || phase === "error") && steps.length > 0 && (
        <div className="mt-3 max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${phase === "error" ? "bg-red-500" : "bg-amber-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span className="w-5 text-center">
                  {s.conclusion === "success" ? "✅" : s.conclusion === "failure" ? "❌" : s.conclusion === "skipped" ? "⏭️" : s.status === "in_progress" ? "⏳" : "⚪"}
                </span>
                <span
                  className={
                    s.conclusion === "failure"
                      ? "text-red-600 dark:text-red-400 font-medium"
                      : "text-slate-700 dark:text-slate-300"
                  }
                >
                  {s.name}
                </span>
                {s.conclusion === "skipped" && (
                  <span className="text-slate-400 dark:text-slate-500">(bỏ qua)</span>
                )}
              </li>
            ))}
          </ul>
          {phase === "error" && failedJobId !== null && (
            <div className="mt-3">
              <button
                onClick={() => (logOpen ? setLogOpen(false) : loadLog(failedJobId))}
                className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
              >
                {logOpen ? "Ẩn chi tiết lỗi" : "Xem chi tiết lỗi"}
              </button>
              {logOpen && (
                <pre className="mt-2 max-h-64 overflow-auto text-[11px] leading-relaxed bg-slate-950 text-slate-200 rounded-lg p-3 whitespace-pre-wrap">
                  {logTail}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
