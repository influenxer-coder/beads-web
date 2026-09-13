export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Drives one stage of the document pipeline.
 *
 * The backend also has a 30 second poller that runs these stages on its own,
 * but polling gives the user nothing to look at. Calling the stages explicitly
 * lets the onboarding screen show real, determinate progress instead of a
 * "we'll notify you when it's ready" toast.
 */

type Stage = 'parse' | 'chunk' | 'beads' | 'scripts' | 'audio';

const STAGES: Record<Stage, { method: 'GET' | 'POST'; path: (id: string) => string }> = {
  parse: { method: 'GET', path: (id) => `/test-parse/${id}` },
  chunk: { method: 'GET', path: (id) => `/test-chunk/${id}` },
  beads: { method: 'GET', path: (id) => `/test-bead-generation/${id}?count=1` },
  scripts: { method: 'POST', path: (id) => `/generate-scripts/${id}` },
  audio: { method: 'POST', path: (id) => `/generate-audio-document/${id}?limit=1` },
};

export async function POST(
  _req: Request,
  { params }: { params: { documentId: string; stage: string } },
) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const stage = STAGES[params.stage as Stage];

  if (!stage) {
    return Response.json({ success: false, error: `unknown stage ${params.stage}` }, { status: 400 });
  }

  const url = `${API.replace(/\/$/, '')}${stage.path(params.documentId)}`;

  try {
    const r = await fetch(url, { method: stage.method, cache: 'no-store' });
    const text = await r.text();

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!r.ok) {
      return Response.json({ success: false, stage: params.stage, error: data }, { status: r.status });
    }
    return Response.json({ success: true, stage: params.stage, data });
  } catch (e: any) {
    // Never surface a bare network error to the flow; the caller decides how to
    // degrade (raw text read) rather than dead-ending the user.
    return Response.json(
      { success: false, stage: params.stage, error: e?.message ?? 'upstream unreachable' },
      { status: 502 },
    );
  }
}
