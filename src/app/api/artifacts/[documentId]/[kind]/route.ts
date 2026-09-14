export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const KINDS = ['audio_overview', 'mind_map', 'flashcards', 'quiz'];

/** Generate one artifact, replacing any earlier one of the same kind. */
export async function POST(
  _req: Request,
  { params }: { params: { documentId: string; kind: string } },
) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  if (!KINDS.includes(params.kind)) {
    return Response.json({ success: false, error: `Unknown artifact ${params.kind}` }, { status: 400 });
  }
  try {
    const r = await fetch(
      `${API.replace(/\/$/, '')}/documents/${params.documentId}/artifacts/${params.kind}`,
      { method: 'POST', cache: 'no-store' },
    );
    return Response.json(await r.json(), { status: r.ok ? 200 : r.status });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message ?? 'upstream unreachable' }, { status: 502 });
  }
}
