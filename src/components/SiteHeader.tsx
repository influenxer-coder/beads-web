import * as React from 'react';
import Link from 'next/link';
import Wordmark from '@/components/Wordmark';

/**
 * The bar on the marketing pages.
 *
 * These routes render full-bleed, outside the signed-in app chrome, which left
 * them with no header at all: someone arriving from an ad landed on a paper
 * with no way back to anything and no sign of whose site it was. This is the
 * minimum that fixes both.
 */
export default function SiteHeader() {
  return (
    <header style={s.bar}>
      <div style={s.inner}>
        <Link href="/" style={s.brand} aria-label="Beads home">
          <Wordmark style={s.wordmark} />
        </Link>
        <nav style={s.nav}>
          <Link href="/papers" style={s.link}>Papers</Link>
          <Link href="/audios" style={s.link}>All audios</Link>
          <Link href="/start" style={s.cta}>Upload a PDF</Link>
        </nav>
      </div>
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  bar: {
    position: 'sticky', top: 0, zIndex: 40,
    background: 'rgba(0,0,0,0.82)',
    backdropFilter: 'saturate(140%) blur(10px)',
    WebkitBackdropFilter: 'saturate(140%) blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  inner: {
    maxWidth: 1020, margin: '0 auto', padding: '0 24px', minHeight: 62,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 16,
  },
  brand: { color: '#fff', textDecoration: 'none', display: 'inline-flex' },
  wordmark: { fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' },

  nav: { display: 'flex', alignItems: 'center', gap: 8 },
  link: {
    color: 'rgba(255,255,255,0.62)', textDecoration: 'none', fontSize: 14.5,
    padding: '8px 10px', borderRadius: 8, whiteSpace: 'nowrap',
  },
  cta: {
    display: 'inline-flex', alignItems: 'center', minHeight: 38,
    padding: '0 16px', marginLeft: 6, borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.28)', color: '#fff',
    textDecoration: 'none', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
  },
};
