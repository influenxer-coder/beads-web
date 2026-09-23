import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

/**
 * How to Read a Research Paper Efficiently (Audio-First Method).
 *
 * A server component, so it can export its own metadata and render its text
 * into the HTML a crawler receives rather than into a client bundle.
 *
 * Page one for this query is already answered well by Keshav's three-pass
 * method and the question-first method, so this does not try to out-explain
 * them. It credits both by name and adds the one thing neither has: the same
 * reading order as something you listen to while the PDF is open.
 */

const TITLE = 'How to Read a Research Paper Efficiently (Audio-First Method)';
const DESCRIPTION =
  'A narrated walkthrough of the abstract, figures, conclusion, intro and methods, '
  + 'built on the three-pass and question-first methods, so you can listen while the PDF is open.';
const URL = 'https://app.influenxers.com/learn/how-to-read-a-research-paper';

export const metadata: Metadata = {
  // absolute: the layout's template would append the brand and push this
  // past the length a search result shows
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: 'article',
    siteName: 'Beads',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

/** The reading order this page argues for, as a narrated track. */
const WALKTHROUGH = [
  {
    at: '0:00',
    part: 'Abstract',
    doing: 'What question the paper asks, and what it claims to have found.',
  },
  {
    at: '1:20',
    part: 'Figures and tables',
    doing: 'The result itself, before any of the prose about it. Read the captions.',
  },
  {
    at: '3:00',
    part: 'Conclusion',
    doing: 'What the authors think it means, and what they admit it does not show.',
  },
  {
    at: '4:30',
    part: 'Introduction',
    doing: 'Why the question mattered, and what was already known.',
  },
  {
    at: '6:10',
    part: 'Methods',
    doing: 'How they got the result, and whether you believe it.',
  },
];

const THREE_PASS = [
  'A quick first pass for the shape: title, abstract, headings, conclusions.',
  'A second pass for the argument, reading figures properly but skipping proofs.',
  'A third pass only when you need it, reconstructing the work yourself.',
];

export default function Page() {
  return (
    <main style={s.page}>
      {/* Article schema. Nothing here claims a rating, an author credential or
          a count we cannot support. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: TITLE,
            description: DESCRIPTION,
            mainEntityOfPage: URL,
            publisher: { '@type': 'Organization', name: 'Beads' },
          }),
        }}
      />

      <SiteHeader />

      <article style={s.wrap}>
        <p style={s.eyebrow}>Guide</p>
        <h1 style={s.h1}>{TITLE}</h1>

        {/* 1. the question people actually type */}
        <p style={s.lede}>
          The question, as students keep asking it on r/math and everywhere else:{' '}
          <em style={s.em}>how do I read a research paper efficiently without getting lost?</em>
        </p>
        <p style={s.body}>
          Usually it goes like this. You open the PDF, start at the first
          sentence, and read forwards. By page three you are in the methods, you
          have lost the thread of why any of it is being done, and you are
          re-reading the same paragraph. The problem is not that the paper is too
          hard. It is that page order is not reading order.
        </p>

        {/* 2. the two frameworks that already answer this well */}
        <h2 style={s.h2}>Two methods that already solve this</h2>
        <p style={s.body}>
          This is a well-answered question, and it would be dishonest to pretend
          otherwise. Two guides do the job, and both are worth reading in full.
        </p>

        <h3 style={s.h3}>The three-pass method</h3>
        <p style={s.body}>
          S. Keshav&rsquo;s three-pass method, hosted at{' '}
          <a href="https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf"
             style={s.link} rel="noopener">stanford.edu</a>, is the one most
          people are eventually pointed at. Instead of reading once and slowly,
          you read three times and quickly:
        </p>
        <ol style={s.ol}>
          {THREE_PASS.map((p) => <li key={p} style={s.li}>{p}</li>)}
        </ol>
        <p style={s.body}>
          The point is that most papers do not need the third pass. Deciding that
          early is the whole saving.
        </p>

        <h3 style={s.h3}>The question-first method</h3>
        <p style={s.body}>
          The four-step, question-first method published at{' '}
          <a href="https://khanh-duong.medium.com" style={s.link}
             rel="noopener nofollow">khanh-duong.medium.com</a> comes at it from
          the other side: work out the question the paper is answering before you
          read anything that answers it. Once you can state the question in your
          own words, the rest of the paper has somewhere to go.
        </p>

        {/* 3. the angle page one does not have */}
        <h2 style={s.h2}>What neither one gives you: something to listen to</h2>
        <p style={s.body}>
          Both are written guides about reading. So you read the guide, then you
          read the paper, and while you are in the paper the guide is somewhere
          else. The order you were told to use is the thing you lose first.
        </p>
        <p style={s.body}>
          An audio companion fixes that by splitting the work between your eyes
          and your ears. The narration tells you where to be and what you are
          looking for. Your eyes stay on the PDF. You are not alternating between
          two documents, and you cannot drift back into reading page one to page
          twelve, because the audio is already somewhere else.
        </p>
        <p style={s.body}>
          The order it walks is the one both methods converge on:{' '}
          <strong style={s.strong}>
            abstract, then figures, then conclusion, then introduction, then methods
          </strong>. Claim first, evidence second, meaning third, context fourth,
          machinery last.
        </p>

        {/* 4. the format, made concrete */}
        <h2 style={s.h2}>What the walkthrough looks like</h2>
        <p style={s.note}>
          An example of the format, to show the shape. Real timings depend on
          the paper.
        </p>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th} scope="col">Time</th>
                <th style={s.th} scope="col">Where to look</th>
                <th style={s.th} scope="col">What you are listening for</th>
              </tr>
            </thead>
            <tbody>
              {WALKTHROUGH.map((r) => (
                <tr key={r.at}>
                  <td style={{ ...s.td, ...s.tdAt }}>{r.at}</td>
                  <td style={{ ...s.td, ...s.tdPart }}>{r.part}</td>
                  <td style={s.td}>{r.doing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={s.body}>
          Roughly eight minutes, against the hour you would lose reading front to
          back and giving up in the methods. If the abstract and the figures tell
          you the paper is not what you needed, you stop at 3:00 and you have
          lost three minutes.
        </p>

        {/* 5. cta */}
        <h2 style={s.h2}>Try it on a paper you are stuck on</h2>
        <p style={s.body}>
          Upload a PDF to Beads and it comes back as short audio lessons you can
          listen to with the paper open. Free to start, and no account needed to
          hear a sample first.
        </p>
        <div style={s.ctaRow}>
          <Link href="/start" style={s.ctaSolid}>Upload a PDF</Link>
          <Link href="/" style={s.ctaGhost}>Hear a sample first</Link>
        </div>
      </article>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    background: '#000',
    color: '#fff',
    minHeight: '100vh',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  wrap: { maxWidth: 720, margin: '0 auto', padding: '44px 24px 96px' },

  eyebrow: {
    fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
    fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)', margin: '0 0 18px',
  },
  h1: {
    fontSize: 'clamp(32px, 5vw, 46px)', lineHeight: 1.12, fontWeight: 700,
    letterSpacing: '-0.03em', margin: '0 0 26px',
  },
  h2: {
    fontSize: 'clamp(23px, 3vw, 29px)', lineHeight: 1.2, fontWeight: 600,
    letterSpacing: '-0.02em', margin: '52px 0 16px',
  },
  h3: {
    fontSize: 19, lineHeight: 1.3, fontWeight: 600,
    letterSpacing: '-0.01em', margin: '32px 0 12px',
  },
  lede: {
    fontSize: 19, lineHeight: 1.62, color: 'rgba(255,255,255,0.82)',
    margin: '0 0 22px',
  },
  em: { color: '#fff', fontStyle: 'italic' },
  body: {
    fontSize: 17, lineHeight: 1.72, color: 'rgba(255,255,255,0.68)',
    margin: '0 0 18px',
  },
  strong: { color: '#fff', fontWeight: 600 },
  note: {
    fontSize: 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.45)',
    margin: '0 0 16px', fontStyle: 'italic',
  },
  link: { color: '#fff', textDecoration: 'underline', textUnderlineOffset: 3 },

  ol: { margin: '0 0 18px', paddingLeft: 22 },
  li: {
    fontSize: 17, lineHeight: 1.72, color: 'rgba(255,255,255,0.68)',
    margin: '0 0 8px',
  },

  // the table scrolls rather than squashing the last column on a phone
  tableWrap: { overflowX: 'auto', margin: '0 0 22px' },
  table: {
    width: '100%', borderCollapse: 'collapse', minWidth: 520,
    border: '1px solid rgba(255,255,255,0.12)',
  },
  th: {
    textAlign: 'left', fontSize: 12.5, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
    padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)',
    fontWeight: 600, whiteSpace: 'nowrap',
  },
  td: {
    fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.68)',
    padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
    verticalAlign: 'top',
  },
  tdAt: {
    fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
    color: '#fff', whiteSpace: 'nowrap',
  },
  tdPart: { color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' },

  ctaRow: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 26 },
  ctaSolid: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 50, background: '#fff', color: '#000', padding: '0 28px',
    borderRadius: 999, textDecoration: 'none', fontSize: 16, fontWeight: 600,
  },
  ctaGhost: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 50, border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
    padding: '0 28px', borderRadius: 999, textDecoration: 'none',
    fontSize: 16, fontWeight: 600,
  },
};
