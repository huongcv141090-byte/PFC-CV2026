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

interface GhStep {
  name: string;
  status: string;
  conclusion: string | null;
}
interface GhJob {
  id: number;
  name: string;
  steps: GhStep[];
}

// GET /api/refresh -> run moi nhat kem chi tiet tung step
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // ?logs=<job_id> -> tra ve duoi log cua job (de xem loi chi tiet)
    const logsJob = searchParams.get("logs");
    if (logsJob) {
      const r = await gh(`/actions/jobs/${logsJob}/logs`);
      if (!r.ok) {
        return NextResponse.json({ ok: false, error: `github_${r.status}` }, { status: 500 });
      }
      const text = await r.text();
      const lines = text.split("\n");
      // uu tien cac dong bao loi, kem duoi log
      const errLines = lines.filter((l) => /error|failed|exception|traceback/i.test(l)).slice(-15);
      const tail = lines.slice(-40);
      return NextResponse.json({ ok: true, tail: tail.join("\n").slice(-4000), errLines });
    }

    const r = await gh(`/actions/workflows/${WORKFLOW}/runs?per_page=2`);
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: `github_${r.status}` }, { status: 500 });
    }
    const j = await r.json();
    const runs = await Promise.all(
      (j?.workflow_runs ?? []).map(async (run: Record<string, unknown>) => {
        let jobs: { id: number; name: string; steps: GhStep[] }[] = [];
        try {
          const jr = await gh(`/actions/runs/${run.id}/jobs?per_page=10`);
          if (jr.ok) {
            const jj = await jr.json();
            jobs = (jj?.jobs ?? []).map((job: Record<string, unknown>) => ({
              id: job.id as number,
              name: job.name,
              steps: ((job.steps ?? []) as Record<string, unknown>[]).map((s) => ({
                name: s.name,
                status: s.status,
                conclusion: s.conclusion,
              })),
            }));
          }
        } catch {
          /* bo qua, van tra run */
        }
        return {
          status: run.status,
          conclusion: run.conclusion,
          created_at: run.created_at,
          updated_at: run.updated_at,
          url: run.html_url,
          jobs: jobs as { id: number; name: string; steps: GhStep[] }[],
        };
      })
    );
    return NextResponse.json({ ok: true, runs });
  } catch (e) {
    return errJson(e);
  }
}
