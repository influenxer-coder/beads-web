import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Store a square cover for a document.
 *
 * Kept beside the card cover under a separate prefix, so the portrait render
 * used in the grid and the 1:1 render Spotify needs can differ.
 */
export async function POST(req: Request, { params }: { params: { documentId: string } }) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof Blob)) {
      return Response.json({ success: false, error: 'file required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const path = `covers-square/${params.documentId}.png`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from('beads-assets')
      .upload(path, bytes, { contentType: 'image/png', upsert: true });
    if (error) throw error;

    return Response.json({
      success: true,
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/beads-assets/${path}`,
    });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message ?? 'upload failed' }, { status: 500 });
  }
}
