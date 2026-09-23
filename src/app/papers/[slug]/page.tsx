import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import TrackedLink from '@/components/TrackedLink';
import { notFound } from 'next/navigation';
import PaperPlayer from '@/components/PaperPlayer';
import { PAPERS, paperBySlug, lessonsFor } from '@/lib/papers';

/**
 * One paper, one URL, playable with no account.
 *
 * This is the page an ad lands on. If a post promises Pluribus, the click
 * arrives here and Pluribus plays, rather than arriving at the home page and
 * being offered a different set of papers.
 *
 * A server component so the lesson text is in the HTML: it is what a crawler
 * reads for "how to read <paper>", and it is the only content on the page
 * worth ranking.
 */

export const revalidate = 3600;

export function generateStaticParams() {
  return PAPERS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const paper = paperBySlug(slug);
  if (!paper) return {};

  const title = `${paper.title} — explained in 1-minute audio`;
  const description =
    `${paper.authors}, ${paper.year}. ${paper.blurb} Listen free, no account needed.`;
  const url = `https://app.influenxers.com/papers/${paper.slug}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', siteName: 'Beads' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = paperBySlug(slug);
  if (!paper) notFound();

  const lessons = await lessonsFor(paper);

  return (
    <main style={s.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${paper.title} — explained in 1-minute audio`,
            description: paper.blurb,
            about: { '@type': 'ScholarlyArticle', name: paper.title,
                     author: paper.authors, datePublished: paper.year },
            mainEntityOfPage: `https://app.influenxers.com/papers/${paper.slug}`,
            publisher: { '@type': 'Organization', name: 'Beads' },
          }),
        }}
      />

      <div style={s.wrap}>
        <nav style={s.crumbs}>
          <Link href="/papers" style={s.crumb}>Papers</Link>
          <span style={s.crumbSep}>/</span>
          <span>{paper.year}</span>
        </nav>

        <h1 style={s.h1}>{paper.title}</h1>
        <p style={s.byline}>{paper.authors} &middot; {paper.year}</p>
        <p style={s.blurb}>{paper.blurb}</p>

        {lessons.length > 0 ? (
          <PaperPlayer lessons={lessons} paperSlug={paper.slug} />
        ) : (
          <p style={s.empty}>
            The audio for this one is still being made. In the meantime the
            paper itself is free to read below.
          </p>
        )}

        {/* The transcripts, server-rendered. The player highlights them; a
            crawler reads them here. */}
        {lessons.length > 0 && (
          <section style={s.readSection}>
            <h2 style={s.h2}>What the lessons say</h2>
            {lessons.map((l) => (
              <article key={l.id} style={s.lessonBlock}>
                <h3 style={s.lessonTitle}>{l.title}</h3>
                {l.script_text && <p style={s.lessonText}>{l.script_text}</p>}
              </article>
            ))}
          </section>
        )}

        <section style={s.sourceSection}>
          <h2 style={s.h2}>Read the original</h2>
          <p style={s.body}>
            We do not host the paper. It is free at the source, and it is worth
            having open while you listen.
          </p>
          <TrackedLink href={paper.source} external style={s.sourceLink}
                       event="paper_source_clicked" props={{ paper: paper.slug }}>
            {paper.title} &rarr;
          </TrackedLink>
        </section>

        <section style={s.more}>
          <h2 style={s.h2}>Other papers</h2>
          <ul style={s.moreList}>
            {PAPERS.filter((p) => p.slug !== paper.slug).map((p) => (
              <li key={p.slug} style={s.moreItem}>
                <TrackedLink href={`/papers/${p.slug}`} style={s.moreLink}
                             event="paper_cross_link_clicked"
                             props={{ from: paper.slug, to: p.slug }}>
                  {p.title}
                </TrackedLink>
                <span style={s.moreMeta}>{p.authors}, {p.year}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    background: '#000', color: '#fff', minHeight: '100vh',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  wrap: { maxWidth: 940, margin: '0 auto', padding: '48px 24px 96px' },

  crumbs: {
    display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5,
    color: 'rgba(255,255,255,0.45)', marginBottom: 22,
  },
  crumb: { color: 'rgba(255,255,255,0.7)', textDecoration: 'none' },
  crumbSep: { color: 'rgba(255,255,255,0.25)' },

  h1: {
    fontSize: 'clamp(30px, 4.6vw, 46px)', lineHeight: 1.12, fontWeight: 700,
    letterSpacing: '-0.03em', margin: '0 0 12px',
  },
  byline: { fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: '0 0 18px' },
  blurb: {
    fontSize: 18.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)',
    maxWidth: 640, margin: 0,
  },
  empty: {
    marginTop: 30, fontSize: 16, lineHeight: 1.7,
    color: 'rgba(255,255,255,0.6)',
  },

  readSection: { marginTop: 64 },
  h2: {
    fontSize: 'clamp(22px, 2.8vw, 28px)', lineHeight: 1.2, fontWeight: 600,
    letterSpacing: '-0.02em', margin: '0 0 18px',
  },
  lessonBlock: {
    padding: '22px 0', borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  lessonTitle: { fontSize: 18, fontWeight: 600, margin: '0 0 10px' },
  lessonText: {
    fontSize: 16, lineHeight: 1.72, color: 'rgba(255,255,255,0.62)', margin: 0,
  },

  sourceSection: { marginTop: 64 },
  body: {
    fontSize: 16.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)',
    maxWidth: 620, margin: '0 0 18px',
  },
  sourceLink: {
    color: '#fff', fontSize: 16.5, textDecoration: 'underline',
    textUnderlineOffset: 4,
  },

  more: { marginTop: 64 },
  moreList: { listStyle: 'none', padding: 0, margin: 0 },
  moreItem: {
    padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'baseline',
  },
  moreLink: { color: '#fff', fontSize: 17, textDecoration: 'none', fontWeight: 500 },
  moreMeta: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
};
