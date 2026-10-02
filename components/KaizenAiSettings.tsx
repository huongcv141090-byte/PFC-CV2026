"use client";

import { useEffect, useState } from "react";

export interface KaizenAiSettings {
  provider: string;
  apiKey: string;
  model: string;
}

export const SETTINGS_KEY = "pfc-kaizen-ai-settings";

export const PROVIDER_DEFAULTS: Record<
  string,
  { label: string; model: string; keyUrl?: string; keyNote?: string }
> = {
  gemini: {
    label: "Google Gemini",
    model: "gemini-2.5-flash",
    keyUrl: "https://aistudio.google.com/apikey",
    keyNote: "Key miễn phí",
  },
  openai: {
    label: "OpenAI GPT",
    model: "gpt-4o-mini",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    label: "Anthropic Claude",
    model: "claude-3-5-haiku-latest",
    keyUrl: "https://console.anthropic.com/",
  },
  experientiallabs: {
    label: "ExperientialLabs",
    model: "gpt-5.6-luna",
    keyUrl: "https://experientiallabs.ai",
  },
  apmix: {
    label: "Apmix",
    model: "deepseek-v4.1-flash-free",
    keyUrl: "https://apmix.ai",
    keyNote: "Có gói miễn phí",
  },
  xai: {
    label: "Grok (xAI)",
    model: "grok-4.7",
    keyUrl: "https://console.x.ai/",
    keyNote: "Cần tài khoản có thanh toán",
  },
  groq: {
    label: "Groq (key miễn phí)",
    model: "llama-3.3-70b-versatile",
    keyUrl: "https://console.groq.com/keys",
    keyNote: "Key miễn phí",
  },
  moonshot: {
    label: "Kimi (Moonshot AI)",
    model: "kimi-k3",
    keyUrl: "https://platform.moonshot.ai/console/api-keys",
  },
};

export function loadSettings(): KaizenAiSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.provider || !s?.apiKey) return null;
    return s as KaizenAiSettings;
  } catch {
    return null;
  }
}

export default function KaizenAiSettingsPanel({
  onSaved,
}: {
  onSaved: (s: KaizenAiSettings | null) => void;
}) {
  const [provider, setProvider] = useState("gemini");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    if (s) {
      setProvider(s.provider);
      setApiKey(s.apiKey);
      setModel(s.model);
      setSaved(true);
    }
  }, []);

  const def = PROVIDER_DEFAULTS[provider] ?? PROVIDER_DEFAULTS.gemini;

  function save() {
    if (!apiKey.trim()) return;
    const s: KaizenAiSettings = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || def.model,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    setSaved(true);
    onSaved(s);
  }

  function clear() {
    localStorage.removeItem(SETTINGS_KEY);
    setApiKey("");
    setModel("");
    setSaved(false);
    onSaved(null);
  }

  return (
    <details className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <summary className="px-4 py-3 cursor-pointer font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-950 flex items-center gap-2">
        <span>🔑</span>
        <span>Kết nối AI để phân tích chuyên sâu</span>
        {saved && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
            Đã kết nối · {def.label}
          </span>
        )}
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chọn nhà cung cấp và nhập API key của anh để AI phân tích sâu từng đề xuất
          kaizen (nguyên nhân gốc, giải pháp thiết bị, bước triển khai, ước tính hiệu quả).
          Key chỉ lưu trên trình duyệt của anh, không gửi đi đâu khác ngoài máy chủ của
          nhà cung cấp đã chọn.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Nhà cung cấp
            </span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {Object.entries(PROVIDER_DEFAULTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              API key
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Dán API key tại đây"
              autoComplete="off"
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {def.keyUrl && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                {def.keyNote ? `${def.keyNote} — ` : ""}lấy key tại{" "}
                <a
                  href={def.keyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 dark:text-amber-400 underline"
                >
                  {def.keyUrl.replace("https://", "").split("/")[0]}
                </a>
              </span>
            )}
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Model (để trống dùng mặc định)
            </span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={def.model}
              autoComplete="off"
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!apiKey.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold transition"
          >
            Lưu kết nối
          </button>
          {saved && (
            <button
              onClick={clear}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Xóa key
            </button>
          )}
        </div>
      </div>
    </details>
  );
}
