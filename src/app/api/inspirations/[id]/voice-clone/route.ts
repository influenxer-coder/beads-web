export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const r = await fetch(`${API.replace(/\/$/, '')}/profiles/${params.id}/voice-clone`, { 
      cache: 'no-store' 
    });
    if (!r.ok) return new Response(await r.text(), { status: r.status });
    const data = await r.json();
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e:any) {
    return new Response(`Upstream error: ${e.message}`, { status: 502 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';
    const r = await fetch(`${API.replace(/\/$/, '')}/profiles/${params.id}/clone-voice?force=${force}`, {
      method: 'POST',
    });
    if (!r.ok) return new Response(await r.text(), { status: r.status });
    const data = await r.json();
    return Response.json(data);
  } catch (e:any) {
    return new Response(`Upstream error: ${e.message}`, { status: 502 });
  }
}

