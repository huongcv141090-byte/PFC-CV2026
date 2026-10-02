"use client";

import { useEffect, useRef, useState } from "react";
import type { KaizenAiSettings } from "./KaizenAiSettings";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Công đoạn nào tốn nhiều thời gian nhất?",
  "Đề xuất kaizen hàng đầu hiện nay là gì?",
  "Những công đoạn nào đang làm thủ công mà nên cơ giới hóa?",
  "Thiết bị nào đang được dùng ở công đoạn gò?",
];

function renderReply(text: string) {
  return text.split("\n").map((line, i) => {
    const t = line.trim();
    if (/^\d+\.\s/.test(t)) {
      return (
        <p key={i} className="font-bold mt-3 first:mt-0">
          {t}
        </p>
      );
    }
    if (t.startsWith("-") || t.startsWith("•")) {
      return <p key={i} className="pl-4">{t}</p>;
    }
    if (!t) return <div key={i} className="h-2" />;
    return <p key={i}>{t}</p>;
  });
}

export default function TroLyChat({
  settings,
}: {
  settings: KaizenAiSettings | null;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    if (!settings) {
      setMsgs((m) => [
        ...m,
        { role: "user", content: q },
        {
          role: "assistant",
          content:
            "Anh mở mục “Kết nối AI” ở trên và lưu API key trước, rồi hỏi em nhé.",
        },
      ]);
      setInput("");
      return;
    }
    const next = [...msgs, { role: "user", content: q } as Msg];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/tro-ly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gọi AI thất bại");
      setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Gọi AI thất bại",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 480 }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh]">
        {msgs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🤖</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Trợ lý AI sản xuất
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Hỏi em về công đoạn, định mức thời gian, thiết bị, đề xuất kaizen…
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:opacity-80 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-amber-500 text-white rounded-br-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
              }`}
            >
              <div className="space-y-1">{renderReply(m.content)}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 animate-pulse">
              Đang tìm trong dữ liệu và phân tích…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Hỏi về công đoạn, kaizen, thiết bị…"
          className="flex-1 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold transition"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
