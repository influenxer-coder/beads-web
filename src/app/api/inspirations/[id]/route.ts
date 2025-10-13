export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const body = await req.json();
    const r = await fetch(`${API.replace(/\/$/, '')}/profiles/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) return new Response(await r.text(), { status: r.status });
    const data = await r.json();
    return Response.json(data);
  } catch (e:any) {
    return new Response(`Upstream error: ${e.message}`, { status: 502 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const API = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const r = await fetch(`${API.replace(/\/$/, '')}/profiles/${params.id}`, { method: 'DELETE' });
    if (!r.ok) return new Response(await r.text(), { status: r.status });
    const data = await r.json();
    return Response.json(data);
  } catch (e:any) {
    return new Response(`Upstream error: ${e.message}`, { status: 502 });
  }
}
