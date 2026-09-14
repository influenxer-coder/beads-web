'use client';

import * as React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Studio from '@/components/studio/Studio';

/**
 * Studio for one source, openable directly.
 *
 * The same panel that appears under a freshly made lesson, reachable for any
 * document without walking the upload flow again.
 */
export default function StudioPage({ params }: { params: { documentId: string } }) {
  const [title, setTitle] = React.useState<string | null>(null);
  const [missing, setMissing] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('documents')
        .select('title')
        .eq('id', params.documentId)
        .maybeSingle();
      if (!alive) return;
      if (data?.title) setTitle(data.title);
      else setMissing(true);
    })();
    return () => {
      alive = false;
    };
  }, [params.documentId]);

  return (
    <main style={styles.page}>
      <div style={styles.inner}>
        <Link href="/" style={styles.back}>
          ← Back
        </Link>

        {missing ? (
          <p style={styles.missing}>That document does not exist.</p>
        ) : (
          <>
            <h1 style={styles.h1}>{title ?? 'Loading…'}</h1>
            {title && <Studio documentId={params.documentId} documentTitle={title} />}
          </>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0A0A0A', color: '#fff', padding: '32px 20px 160px' },
  inner: { maxWidth: 640, margin: '0 auto' },
  back: {
    display: 'inline-block',
    marginBottom: 20,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14.5,
    textDecoration: 'none',
  },
  h1: { fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 26px', lineHeight: 1.25 },
  missing: { color: 'rgba(255,255,255,0.55)' },
};
