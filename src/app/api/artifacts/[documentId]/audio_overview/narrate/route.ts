export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Render the two host overview to audio. */
export async function POST(_req: Request, { params }: { params: { documentId: string } }) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const r = await fetch(
      `${API.replace(/\/$/, '')}/documents/${params.documentId}/artifacts/audio_overview/narrate`,
      { method: 'POST', cache: 'no-store' },
    );
    return Response.json(await r.json(), { status: r.ok ? 200 : r.status });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message ?? 'upstream unreachable' }, { status: 502 });
  }
}
