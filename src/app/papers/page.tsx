import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/SiteHeader';
import TrackedLink from '@/components/TrackedLink';
import { PAPERS, paperSummaries, paperBySlug, lessonsFor } from '@/lib/papers';
import PaperPlayer from '@/components/PaperPlayer';

/**
 * The shelf.
 *
 * The landing page for the "papers to become dangerously well read" post,
 * when the ad promises a set rather than one paper. Each row goes to its own
 * page, which is where the audio is.
 */

const TITLE = 'Must-read papers, as one-minute audio';
const DESCRIPTION =
  'The papers everyone cites and nobody finishes, as one-minute audio lessons. '
  + 'Press play, no account needed.';
const URL = 'https://app.influenxers.com/papers';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL,
               type: 'website', siteName: 'Beads' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export const revalidate = 3600;

/** The paper the shelf opens on, and starts playing. */
const FEATURED = 'computing-machinery-and-intelligence';

export default async function Page() {
  const papers = await paperSummaries();
  const lead = paperBySlug(FEATURED);
  const leadLessons = lead ? await lessonsFor(lead) : [];

  return (
    <main style={s.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: TITLE,
            description: DESCRIPTION,
            url: URL,
            hasPart: PAPERS.map((p) => ({
              '@type': 'Article',
              name: p.title,
              url: `https://app.influenxers.com/papers/${p.slug}`,
            })),
          }),
        }}
      />

      <SiteHeader />

      <div style={s.wrap}>
        <h1 style={s.h1}>Must-read papers. Just listen.</h1>

        {lead && leadLessons.length > 0 && (
          <section style={s.lead}>
            <PaperPlayer lessons={leadLessons} paperSlug={lead.slug} autoplay />
          </section>
        )}

        <h2 style={s.more}>More papers</h2>

        <ul className="pl-list" style={s.list}>
          {papers.map((p) => (
            <li key={p.slug}>
              <TrackedLink
                href={`/papers/${p.slug}`}
                event="papers_shelf_paper_clicked"
                tiktokEvent="ViewContent"
                props={{ paper: p.slug, lessons: p.lessons }}
                style={s.row}
              >
                <span style={s.art}>
                  {p.coverId ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/beads-assets/covers-lesson/${p.coverId}.png`}
                      alt="" width={144} height={144} style={s.artImg}
                    />
                  ) : (
                    <span style={s.artFallback} aria-hidden="true" />
                  )}
                  <span style={s.artPlay} aria-hidden="true">&#9654;</span>
                </span>

                <span style={s.rowBody}>
                  <span style={s.rowTitle}>{p.title}</span>
                  <span style={s.rowMeta}>
                    {p.authors} &middot; {p.year}
                    {p.lessons > 0 && (
                      <> &middot; {p.lessons} lesson{p.lessons === 1 ? '' : 's'}</>
                    )}
                  </span>
                  <span style={s.rowBlurb}>{p.blurb}</span>
                </span>

                <span style={s.rowGo} aria-hidden="true">&rarr;</span>
              </TrackedLink>
            </li>
          ))}
        </ul>

        <div style={s.ctaBar}>
          <p style={s.ctaNote}>Got a paper of your own you have not got through?</p>
          <TrackedLink href="/start" event="papers_shelf_cta_clicked"
                       tiktokEvent="ClickButton" style={s.ctaBtn}>
            Upload a PDF. Free.
          </TrackedLink>
        </div>
      </div>

      <style>{`
        /* On a phone the blurb wraps to six lines, which made the row taller
           than the art and left the cover floating in the middle of a gap --
           and one paper filled the screen. Pin the art to the top and clamp
           the blurb so three rows fit above the fold. */
        @media (max-width: 560px) {
          .pl-list a { align-items: flex-start !important; gap: 12px !important; }
          .pl-list a > span:first-child { width: 56px !important; height: 56px !important; }
          .pl-list a > span:nth-child(2) > span:last-child {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      `}</style>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    background: '#000', color: '#fff', minHeight: '100vh',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  wrap: { maxWidth: 860, margin: '0 auto', padding: '44px 24px 96px' },

  h1: {
    fontSize: 'clamp(30px, 4.6vw, 46px)', lineHeight: 1.08, fontWeight: 700,
    letterSpacing: '-0.035em', margin: '0 0 24px', maxWidth: '16ch',
  },

  lead: { margin: '0 0 40px' },
  more: {
    fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em',
    margin: '0 0 16px', color: 'rgba(255,255,255,0.9)',
  },

  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 },

  // the signed-in library's row: art, title, meta, hairline card
  row: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
    borderRadius: 14, border: '1px solid rgba(255,255,255,0.09)',
    background: 'rgba(255,255,255,0.03)', textDecoration: 'none',
    color: 'inherit', minHeight: 96,
  },
  art: {
    position: 'relative', width: 72, height: 72, borderRadius: 12,
    overflow: 'hidden', flexShrink: 0, display: 'block',
    border: '1px solid rgba(255,255,255,0.14)',
  },
  artImg: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'cover',
  },
  artFallback: {
    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.06)',
  },
  artPlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'rgba(0,0,0,0.42)', color: '#fff',
    fontSize: 15,
  },

  rowBody: { display: 'grid', gap: 5, minWidth: 0, flex: 1 },
  rowTitle: {
    fontSize: 'clamp(17px, 2vw, 20px)', lineHeight: 1.28, fontWeight: 600,
    letterSpacing: '-0.015em', color: '#fff',
  },
  rowMeta: {
    fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: 11.5,
    color: 'rgba(255,255,255,0.4)',
  },
  rowBlurb: {
    fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.58)',
    maxWidth: 560,
  },
  rowGo: { color: 'rgba(255,255,255,0.35)', fontSize: 20, flexShrink: 0 },

  ctaBar: {
    marginTop: 56, padding: 24, borderRadius: 18,
    background: 'rgba(255,255,255,0.045)',
    border: '1px solid rgba(255,255,255,0.13)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
  },
  ctaNote: { margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.68)', textAlign: 'center' },
  ctaBtn: {
    display: 'inline-flex', alignItems: 'center', minHeight: 52, padding: '0 28px',
    borderRadius: 999, background: '#fff', color: '#0a0a0a', fontSize: 16,
    fontWeight: 600, textDecoration: 'none',
  },
};
