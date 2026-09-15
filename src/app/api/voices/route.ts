export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Voices available for narration, with their publishing status. */
export async function GET() {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const r = await fetch(`${API.replace(/\/$/, '')}/voices`, { cache: 'no-store' });
    return Response.json(await r.json(), { status: r.ok ? 200 : r.status });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message, voices: [] }, { status: 502 });
  }
}
