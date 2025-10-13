export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const r = await fetch(`${API.replace(/\/$/, '')}/feed`, { cache: 'no-store' });
    if (!r.ok) return new Response(await r.text(), { status: r.status });
    const data = await r.json();
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return new Response(`Upstream error: ${e.message}`, { status: 502 });
  }
}
