import { NextResponse } from "next/server";

/**
 * POST /api/kaizen-ai
 * Body: { provider, apiKey, model?, rec: { type_vi, cong_doan, brand, stage,
 *         score, suggestion, evidence, ref_equipment[] } }
 *
 * Gọi LLM của nhà cung cấp để phân tích chuyên sâu một đề xuất kaizen.
 * apiKey chỉ dùng trong request này, không lưu, không log.
 */

const PROVIDERS = {
  gemini: { label: "Google Gemini", defaultModel: "gemini-2.5-flash" },
  openai: { label: "OpenAI GPT", defaultModel: "gpt-4o-mini" },
  anthropic: { label: "Anthropic Claude", defaultModel: "claude-3-5-haiku-latest" },
  experientiallabs: { label: "ExperientialLabs", defaultModel: "gpt-5.6-luna" },
  apmix: { label: "Apmix", defaultModel: "deepseek-v4.1-flash-free" },
} as const;

type Provider = keyof typeof PROVIDERS;

function buildPrompt(rec: Record<string, unknown>): string {
  const eq = Array.isArray(rec.ref_equipment) ? rec.ref_equipment.join(", ") : "";
  const mh = Array.isArray(rec.ma_hang) ? rec.ma_hang.join(", ") : "";
  const cl = Array.isArray(rec.colors) ? rec.colors.join(", ") : "";
  return `Bạn là chuyên gia cải tiến sản xuất (kaizen) trong ngành sản xuất giày da tại Việt Nam, nhiều năm kinh nghiệm triển khai cơ giới hóa và chuẩn hóa thao tác trên chuyền may, chuyền gò.

Hãy phân tích chuyên sâu đề xuất cải tiến sau đây. Toàn bộ câu trả lời viết bằng tiếng Việt đầy đủ, tuyệt đối không viết tắt (ví dụ viết "trung bình" thay vì "TB", "thủ công" thay vì "TC").

THÔNG TIN ĐỀ XUẤT:
- Loại cải tiến: ${rec.type_vi}
- Công đoạn: ${rec.cong_doan}
- Nhãn hàng: ${rec.brand} — Công đoạn sản xuất: ${rec.stage}
- Phạm vi dữ liệu: ${rec.n_ghi_nhan} lượt ghi nhận · ${mh ? `các mã hàng: ${mh}` : ""} · ${cl ? `các màu sắc: ${cl}` : ""}
- Điểm ưu tiên: ${rec.score}
- Đề xuất: ${rec.suggestion}
- Bằng chứng từ dữ liệu thực tế: ${rec.evidence}
- Thiết bị tham khảo: ${eq || "chưa có"}

TRẢ LỜI THEO ĐÚNG CẤU TRÚC SAU (giữ nguyên các tiêu đề):
1. Vấn đề hiện tại: mô tả ngắn gọn lãng phí đang tồn tại.
2. Nguyên nhân gốc: phân tích vì sao công đoạn này tốn thời gian hoặc nhân lực.
3. Giải pháp đề xuất: thiết bị hoặc máy móc cụ thể nên trang bị, cách bố trí vào chuyền, cách chuẩn hóa thao tác.
4. Các bước triển khai: liệt kê từng bước thực hiện theo thứ tự.
5. Ước tính hiệu quả: tiết kiệm thời gian, giảm nhân lực, tăng năng suất (dựa trên số liệu bằng chứng).
6. Rủi ro và lưu ý: những điểm cần kiểm soát khi triển khai để không ảnh hưởng chất lượng.

Trình bày súc tích, thực tế, hướng tới người quản lý xưởng.`;
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Bạn là chuyên gia kaizen ngành giày da. Trả lời tiếng Việt đầy đủ, không viết tắt." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
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

async function callProvider(
  provider: Provider,
  apiKey: string,
  model: string,
  prompt: string
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
            systemInstruction: {
              parts: [{ text: "Bạn là chuyên gia kaizen ngành giày da. Trả lời tiếng Việt đầy đủ, không viết tắt." }],
            },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
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
          max_tokens: 2000,
          system: "Bạn là chuyên gia kaizen ngành giày da. Trả lời tiếng Việt đầy đủ, không viết tắt.",
          messages: [{ role: "user", content: prompt }],
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
      return callOpenAICompatible("https://api.openai.com/v1", apiKey, model, prompt);
    case "experientiallabs":
      return callOpenAICompatible("https://api.experientiallabs.ai/v1", apiKey, model, prompt);
    case "apmix":
      return callOpenAICompatible("https://api.apmix.ai/v1", apiKey, model, prompt);
    default:
      throw new Error("Nhà cung cấp không được hỗ trợ");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const provider = body?.provider as Provider | undefined;
    const apiKey = (body?.apiKey as string | undefined)?.trim();
    const rec = body?.rec as Record<string, unknown> | undefined;

    if (!provider || !(provider in PROVIDERS)) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng chọn nhà cung cấp AI." },
        { status: 400 }
      );
    }
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng nhập API key." },
        { status: 400 }
      );
    }
    if (!rec || typeof rec.cong_doan !== "string") {
      return NextResponse.json(
        { ok: false, error: "Thiếu dữ liệu đề xuất." },
        { status: 400 }
      );
    }

    const model =
      (body?.model as string | undefined)?.trim() ||
      PROVIDERS[provider].defaultModel;
    const prompt = buildPrompt(rec);
    const analysis = await callProvider(provider, apiKey, model, prompt);

    return NextResponse.json({
      ok: true,
      provider: PROVIDERS[provider].label,
      model,
      analysis,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi không xác định";
    const low = msg.toLowerCase();
    const friendly =
      low.includes("401") || low.includes("api key not valid") || low.includes("invalid_api_key") || low.includes("invalid api key")
        ? "API key không hợp lệ hoặc đã hết hạn. Anh kiểm tra lại key trong mục Kết nối AI."
        : low.includes("403")
          ? "API key không có quyền dùng model này. Anh kiểm tra lại gói hoặc model."
          : low.includes("429")
            ? "Nhà cung cấp đang giới hạn tần suất. Anh thử lại sau ít phút."
            : low.includes("404")
              ? "Không tìm thấy model. Anh kiểm tra lại tên model."
              : msg;
    return NextResponse.json({ ok: false, error: friendly }, { status: 502 });
  }
}

export function GET() {
  return NextResponse.json({
    ok: true,
    providers: Object.fromEntries(
      Object.entries(PROVIDERS).map(([k, v]) => [k, { label: v.label, defaultModel: v.defaultModel }])
    ),
  });
}
