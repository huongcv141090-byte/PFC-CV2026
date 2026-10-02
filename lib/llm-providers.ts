/**
 * Gọi LLM của các nhà cung cấp cho tính năng AI trong PFC Visual Browser.
 * API key do người dùng nhập, chỉ dùng trong request, không lưu, không log.
 */

export const PROVIDERS = {
  gemini: { label: "Google Gemini", defaultModel: "gemini-2.5-flash" },
  openai: { label: "OpenAI GPT", defaultModel: "gpt-4o-mini" },
  anthropic: { label: "Anthropic Claude", defaultModel: "claude-3-5-haiku-latest" },
  experientiallabs: { label: "ExperientialLabs", defaultModel: "gpt-5.6-luna" },
  apmix: { label: "Apmix", defaultModel: "deepseek-v4.1-flash-free" },
  xai: { label: "Grok (xAI)", defaultModel: "grok-4.7" },
  groq: { label: "Groq — miễn phí", defaultModel: "llama-3.3-70b-versatile" },
} as const;

export type Provider = keyof typeof PROVIDERS;

export function isProvider(p: unknown): p is Provider {
  return typeof p === "string" && p in PROVIDERS;
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  system: string,
  user: string,
  maxTokens = 2000
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Phản hồi rỗng từ nhà cung cấp");
  return text;
}

export async function callProvider(
  provider: Provider,
  apiKey: string,
  model: string,
  system: string,
  user: string,
  maxTokens = 2000
): Promise<string> {
  switch (provider) {
    case "gemini": {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ parts: [{ text: user }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens },
          }),
        }
      );
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("");
      if (!text) throw new Error("Phản hồi rỗng từ nhà cung cấp");
      return text;
    }
    case "anthropic": {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data?.content
        ?.filter((b: { type?: string }) => b.type === "text")
        .map((b: { text?: string }) => b.text ?? "")
        .join("");
      if (!text) throw new Error("Phản hồi rỗng từ nhà cung cấp");
      return text;
    }
    case "openai":
      return callOpenAICompatible("https://api.openai.com/v1", apiKey, model, system, user, maxTokens);
    case "experientiallabs":
      return callOpenAICompatible("https://api.experientiallabs.ai/v1", apiKey, model, system, user, maxTokens);
    case "apmix":
      return callOpenAICompatible("https://api.apmix.ai/v1", apiKey, model, system, user, maxTokens);
    case "xai":
      return callOpenAICompatible("https://api.x.ai/v1", apiKey, model, system, user, maxTokens);
    case "groq":
      return callOpenAICompatible("https://api.groq.com/openai/v1", apiKey, model, system, user, maxTokens);
    default:
      throw new Error("Nhà cung cấp không được hỗ trợ");
  }
}

export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Lỗi không xác định";
  const low = msg.toLowerCase();
  if (
    low.includes("401") ||
    low.includes("api key not valid") ||
    low.includes("invalid_api_key") ||
    low.includes("invalid api key")
  )
    return "API key không hợp lệ hoặc đã hết hạn. Anh kiểm tra lại key trong mục Kết nối AI.";
  if (low.includes("403"))
    return "API key không có quyền dùng model này. Anh kiểm tra lại gói hoặc tên model.";
  if (low.includes("429"))
    return "Nhà cung cấp đang giới hạn tần suất. Anh thử lại sau ít phút.";
  if (low.includes("404"))
    return "Không tìm thấy model. Anh kiểm tra lại tên model.";
  return msg;
}
