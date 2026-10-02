import { NextResponse } from "next/server";
import {
  PROVIDERS,
  callProvider,
  friendlyError,
  isProvider,
} from "@/lib/llm-providers";

/**
 * POST /api/kaizen-ai
 * Body: { provider, apiKey, model?, rec: { type_vi, cong_doan, brand, stage,
 *         score, suggestion, evidence, ref_equipment[], n_ghi_nhan?,
 *         ma_hang?, colors? } }
 *
 * Gọi LLM của nhà cung cấp để phân tích chuyên sâu một đề xuất kaizen.
 * apiKey chỉ dùng trong request này, không lưu, không log.
 */

const SYSTEM =
  "Bạn là chuyên gia kaizen ngành giày da. Trả lời tiếng Việt đầy đủ, không viết tắt.";

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const provider = body?.provider;
    const apiKey = (body?.apiKey as string | undefined)?.trim();
    const rec = body?.rec as Record<string, unknown> | undefined;

    if (!isProvider(provider)) {
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
    const analysis = await callProvider(
      provider,
      apiKey,
      model,
      SYSTEM,
      buildPrompt(rec)
    );

    return NextResponse.json({
      ok: true,
      provider: PROVIDERS[provider].label,
      model,
      analysis,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: friendlyError(e) }, { status: 502 });
  }
}

export function GET() {
  return NextResponse.json({
    ok: true,
    providers: Object.fromEntries(
      Object.entries(PROVIDERS).map(([k, v]) => [
        k,
        { label: v.label, defaultModel: v.defaultModel },
      ])
    ),
  });
}
