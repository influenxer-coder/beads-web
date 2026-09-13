export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Renders a short sample of one voice reading the user's OWN text.
 *
 * Goes through the backend's Chatterbox path, which clones from the
 * inspiration's separated voice track, so the sample is representative of what
 * the full lesson will sound like.
 */
export async function POST(req: Request) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const { voiceId, text } = await req.json();
    if (!voiceId || !text) {
      return Response.json({ success: false, error: 'voiceId and text required' }, { status: 400 });
    }

    const r = await fetch(
      `${API.replace(/\/$/, '')}/profiles/${voiceId}/voice-sample`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        cache: 'no-store',
      },
    );

    if (!r.ok) {
      return Response.json({ success: false, error: await r.text() }, { status: r.status });
    }
    return Response.json(await r.json());
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message ?? 'failed' }, { status: 502 });
  }
}
