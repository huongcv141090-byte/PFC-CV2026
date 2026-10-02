import { NextResponse } from "next/server";

const OWNER = "huongcv141090-byte";
const REPO = "PFC-CV2026";
const WORKFLOW = "drive-refresh.yml";

function gh(path: string, init?: RequestInit) {
  const token = process.env.GITHUB_REFRESH_TOKEN;
  if (!token) {
    const e = new Error("not_configured") as Error & { code?: string };
    e.code = "not_configured";
    throw e;
  }
  return fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
}

function errJson(e: unknown) {
  const code = (e as { code?: string })?.code;
  if (code === "not_configured") {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
  }
  return NextResponse.json({ ok: false, error: "github_error" }, { status: 500 });
}

// POST /api/refresh -> kich hoat workflow drive-refresh tren GitHub Actions
export async function POST() {
  try {
    const r = await gh(`/actions/workflows/${WORKFLOW}/dispatches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "main" }),
    });
    if (r.status !== 204) {
      const t = await r.text();
      return NextResponse.json(
        { ok: false, error: `github_${r.status}`, detail: t.slice(0, 200) },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    return errJson(e);
  }
}

// GET /api/refresh -> trang thai run moi nhat cua workflow
export async function GET() {
  try {
    const r = await gh(`/actions/workflows/${WORKFLOW}/runs?per_page=3`);
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: `github_${r.status}` }, { status: 500 });
    }
    const j = await r.json();
    const runs = (j?.workflow_runs ?? []).map((run: Record<string, unknown>) => ({
      status: run.status,
      conclusion: run.conclusion,
      created_at: run.created_at,
      updated_at: run.updated_at,
      url: run.html_url,
    }));
    return NextResponse.json({ ok: true, runs });
  } catch (e) {
    return errJson(e);
  }
}
