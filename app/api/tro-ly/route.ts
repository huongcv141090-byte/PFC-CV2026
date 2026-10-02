import { NextResponse } from "next/server";
import {
  PROVIDERS,
  callProvider,
  friendlyError,
  isProvider,
} from "@/lib/llm-providers";
import { getKaizen, getStages } from "@/lib/data-server";

/**
 * POST /api/tro-ly
 * Body: { provider, apiKey, model?, messages: [{role: "user"|"assistant", content}] }
 *
 * Trợ lý AI cho vận hành: tìm kiếm mini-RAG trên dữ liệu PFC (công đoạn,
 * định mức, kaizen) rồi gọi LLM trả lời tiếng Việt, không viết tắt.
 */

const SYSTEM = `Bạn là trợ lý AI cho quản lý sản xuất giày da tại Công ty Giầy Tuấn Việt.
Nhiệm vụ: trả lời câu hỏi về công đoạn sản xuất, định mức thời gian, thiết bị,
và đề xuất kaizen — dựa trên DỮ LIỆU THAM KHẢO được cung cấp cùng câu hỏi.

Quy tắc:
- Toàn bộ câu trả lời bằng tiếng Việt đầy đủ, tuyệt đối không viết tắt
  (viết "trung bình" thay vì "TB", "thủ công" thay vì "TC", "mã hàng" đầy đủ).
- Chỉ dùng số liệu có trong dữ liệu tham khảo; không bịa số.
- Khi không đủ dữ liệu, nói rõ và gợi ý xem thêm ở đâu trên web.
- Trả lời súc tích, thực tế, có cấu trúc khi cần (gạch đầu dòng).
- Đơn vị thời gian: giây, phút, giờ.`;

const STOP = new Set([
  "va", "cua", "cho", "voi", "cac", "de", "duoc", "theo", "trong", "tren",
  "la", "gi", "nao", "nhat", "co", "khong", "bao", "nhieu", "the", "nao",
]);

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toks(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((t) => t && !STOP.has(t)));
}

function fmtSec(s: number): string {
  if (s >= 3600) return `${(s / 3600).toFixed(1).replace(".", ",")} giờ`;
  if (s >= 60) return `${(s / 60).toFixed(1).replace(".", ",")} phút`;
  return `${s.toFixed(1).replace(".", ",")} giây`;
}

async function buildContext(question: string): Promise<string> {
  const stages = await getStages();
  const kz = await getKaizen();
  const parts: string[] = [];

  // 1. Tổng quan
  const brandLines: string[] = [];
  let totalCd = 0;
  for (const [bid, b] of Object.entries(stages.brands)) {
    const stNames = Object.keys(b.stages);
    const nCd = stNames.reduce((n, s) => n + b.stages[s].cong_doan.length, 0);
    totalCd += nCd;
    brandLines.push(
      `- ${b.name}: công đoạn sản xuất ${stNames.join(", ")} (${nCd} công đoạn)`
    );
  }
  parts.push(
    `TỔNG QUAN DỮ LIỆU:\n${brandLines.join("\n")}\nTổng số: ${totalCd} công đoạn.`
  );

  // 2. Tìm công đoạn liên quan theo từ khóa
  const q = toks(question);
  const scored: { s: number; line: string }[] = [];
  for (const [bid, b] of Object.entries(stages.brands)) {
    for (const [sname, st] of Object.entries(b.stages)) {
      for (const cd of st.cong_doan) {
        const ct = toks(cd.ten);
        if (q.size === 0 || ct.size === 0) continue;
        const inter = Array.from(q).filter((t) => ct.has(t)).length;
        if (inter === 0) continue;
        const score = inter / Math.min(q.size, ct.size);
        if (score < 0.34) continue;
        const times = cd.files
          .map((f) => Number(f.thoi_gian_s) || 0)
          .filter((t) => t > 0);
        const avg = times.length
          ? times.reduce((a, v) => a + v, 0) / times.length
          : 0;
        const eq = Array.from(
          new Set(
            cd.files.flatMap((f) => [
              ...(f.dung_cu ?? []),
              ...(f.thiet_bi ? [f.thiet_bi] : []),
            ])
          )
        ).slice(0, 3);
        scored.push({
          s: score,
          line:
            `- "${cd.ten}" (${b.name} · ${sname}): ` +
            `${cd.files.length} lượt ghi nhận` +
            (avg ? `, trung bình ${fmtSec(avg)}/lần` : "") +
            (eq.length ? `, thiết bị: ${eq.join(", ")}` : ", làm thủ công") +
            (cd.images.length ? `, ${cd.images.length} ảnh minh họa` : ""),
        });
      }
    }
  }
  scored.sort((a, b) => b.s - a.s);
  if (scored.length > 0) {
    parts.push(
      `CÔNG ĐOẠN LIÊN QUAN NHẤT:\n${scored.slice(0, 8).map((x) => x.line).join("\n")}`
    );
  }

  // 3. Đề xuất kaizen hàng đầu
  if (kz && kz.recommendations.length > 0) {
    const top = kz.recommendations.slice(0, 8).map(
      (r) =>
        `- [${r.type_vi}] "${r.cong_doan}" (${r.brand} · ${r.stage}): ${r.suggestion}. ${r.evidence}`
    );
    parts.push(
      `ĐỀ XUẤT KAIZEN HÀNG ĐẦU (tổng ${kz.stats.n_recommendations} đề xuất):\n${top.join("\n")}`
    );
  }

  return parts.join("\n\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const provider = body?.provider;
    const apiKey = (body?.apiKey as string | undefined)?.trim();
    const messages = body?.messages as
      | { role: string; content: string }[]
      | undefined;

    if (!isProvider(provider)) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng chọn nhà cung cấp AI." },
        { status: 400 }
      );
    }
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng nhập API key trong mục Kết nối AI." },
        { status: 400 }
      );
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Thiếu nội dung câu hỏi." },
        { status: 400 }
      );
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const question = lastUser?.content ?? "";
    const context = await buildContext(question);

    const model =
      (body?.model as string | undefined)?.trim() ||
      PROVIDERS[provider].defaultModel;

    const history = messages
      .slice(-8)
      .map(
        (m) =>
          `${m.role === "user" ? "Người dùng" : "Trợ lý"}: ${m.content}`
      )
      .join("\n");
    const user = `DỮ LIỆU THAM KHẢO:\n${context}\n\nLỊCH SỬ TRAO ĐỔI:\n${history}\n\nHãy trả lời câu hỏi cuối cùng của người dùng.`;

    const reply = await callProvider(provider, apiKey, model, SYSTEM, user, 2500);

    return NextResponse.json({
      ok: true,
      provider: PROVIDERS[provider].label,
      model,
      reply,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: friendlyError(e) }, { status: 502 });
  }
}
