export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Render page one of a document into a cover image. */
export async function POST(_req: Request, { params }: { params: { documentId: string } }) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const r = await fetch(`${API.replace(/\/$/, '')}/documents/${params.documentId}/cover`, {
      method: 'POST',
      cache: 'no-store',
    });
    return Response.json(await r.json(), { status: r.ok ? 200 : r.status });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message }, { status: 502 });
  }
}
