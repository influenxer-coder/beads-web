export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Everything already generated for a source. */
export async function GET(_req: Request, { params }: { params: { documentId: string } }) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const r = await fetch(`${API.replace(/\/$/, '')}/documents/${params.documentId}/artifacts`, {
      cache: 'no-store',
    });
    return Response.json(await r.json(), { status: r.ok ? 200 : r.status });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message, artifacts: [] }, { status: 502 });
  }
}
