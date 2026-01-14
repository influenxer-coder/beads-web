export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const formData = await req.formData();
    const r = await fetch(`${API.replace(/\/$/, '')}/process-page-image`, {
      method: 'POST',
      body: formData,
    });
    if (!r.ok) return new Response(await r.text(), { status: r.status });
    const data = await r.json();
    return Response.json(data);
  } catch (e: any) {
    return new Response(`Upstream error: ${e.message}`, { status: 502 });
  }
}
