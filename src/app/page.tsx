'use client';

import * as React from 'react';
import Link from 'next/link';

const MONO = "'SF Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: '#000',
    color: '#fff',
    minHeight: '100vh',
    width: '100%',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  wrap: { maxWidth: 920, margin: '0 auto', padding: '0 24px' },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '28px 0',
  },
  wordmark: { fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' },
  navLink: {
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    fontSize: 14,
    marginLeft: 26,
  },
  hero: { padding: '96px 0 88px' },
  eyebrow: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    margin: '0 0 26px',
  },
  h1: {
    fontSize: 'clamp(38px, 6.2vw, 66px)',
    lineHeight: 1.06,
    letterSpacing: '-0.035em',
    fontWeight: 600,
    margin: '0 0 26px',
    maxWidth: 780,
  },
  dim: { color: 'rgba(255,255,255,0.45)' },
  sub: {
    fontSize: 19,
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.62)',
    maxWidth: 560,
    margin: '0 0 44px',
  },
  ctaRow: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  ctaSolid: {
    display: 'inline-block',
    background: '#fff',
    color: '#000',
    padding: '14px 28px',
    borderRadius: 2,
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 500,
  },
  ctaGhost: {
    display: 'inline-block',
    border: '1px solid rgba(255,255,255,0.22)',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: 2,
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 500,
  },
  rule: { height: 1, background: 'rgba(255,255,255,0.12)', border: 0, margin: 0 },
  section: { padding: '84px 0' },
  sectionLabel: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    margin: '0 0 44px',
  },
  h2: {
    fontSize: 'clamp(26px, 3.4vw, 36px)',
    lineHeight: 1.18,
    letterSpacing: '-0.025em',
    fontWeight: 600,
    margin: '0 0 18px',
    maxWidth: 640,
  },
  body: {
    fontSize: 16,
    lineHeight: 1.68,
    color: 'rgba(255,255,255,0.62)',
    maxWidth: 560,
    margin: 0,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: 1,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  cell: { background: '#000', padding: '34px 28px' },
  stepNum: {
    fontFamily: MONO,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    margin: '0 0 18px',
  },
  cellTitle: { fontSize: 17, fontWeight: 600, margin: '0 0 10px', letterSpacing: '-0.01em' },
  cellBody: { fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', margin: 0 },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 56,
    alignItems: 'start',
  },
  list: { listStyle: 'none', padding: 0, margin: '26px 0 0' },
  li: {
    fontSize: 15,
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.62)',
    padding: '13px 0',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  footer: {
    padding: '44px 0 60px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
  },
};

const STEPS = [
  {
    n: '01',
    title: 'Add a source',
    body: 'Upload a PDF — a book, a research paper, a slide deck — or scan a single page with your camera.',
  },
  {
    n: '02',
    title: 'Pick a voice',
    body: 'Choose an inspiration. Beads clones the voice, pacing, and background music from creators you admire.',
  },
  {
    n: '03',
    title: 'Listen',
    body: 'Your document comes back as short narrated lessons you can scroll through like a feed.',
  },
];

const SOURCES = [
  'Books and long-form PDFs',
  'Research papers',
  'Scanned book pages',
  'Slide decks and pitch decks',
  'Meeting notes',
];

const VOICE_STEPS = [
  'Paste links to creators you like',
  'Their speech is separated from the music',
  'Voice, tone, and pacing are cloned',
  'Every lesson is narrated in that style',
];

export default function Landing() {
  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <nav style={styles.navRow}>
          <span style={styles.wordmark}>Beads</span>
          <div>
            <Link href="/feed" style={styles.navLink}>Feed</Link>
            <Link href="/library" style={styles.navLink}>Library</Link>
            <Link href="/inspiration" style={styles.navLink}>Inspiration</Link>
          </div>
        </nav>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <section style={styles.hero}>
          <p style={styles.eyebrow}>Documents → audio lessons</p>
          <h1 style={styles.h1}>
            Anything worth reading,
            <br />
            <span style={styles.dim}>in a voice worth hearing.</span>
          </h1>
          <p style={styles.sub}>
            Beads turns a book, paper, or deck into a feed of short narrated
            lessons — spoken in a voice and style you choose.
          </p>
          <div style={styles.ctaRow}>
            <Link href="/upload" style={styles.ctaSolid}>Create your first bead</Link>
            <Link href="/feed" style={styles.ctaGhost}>Listen to the feed</Link>
          </div>
        </section>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <section style={styles.section}>
          <p style={styles.sectionLabel}>How it works</p>
          <div style={styles.grid3}>
            {STEPS.map((s) => (
              <div key={s.n} style={styles.cell}>
                <p style={styles.stepNum}>{s.n}</p>
                <h3 style={styles.cellTitle}>{s.title}</h3>
                <p style={styles.cellBody}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <section style={styles.section}>
          <div style={styles.twoCol}>
            <div>
              <p style={styles.sectionLabel}>What you can turn into beads</p>
              <h2 style={styles.h2}>Long things, made short.</h2>
              <p style={styles.body}>
                Beads reads the whole document, finds the ideas actually worth
                keeping, and writes each one as a lesson of about a minute.
              </p>
            </div>
            <ul style={styles.list}>
              {SOURCES.map((s) => (
                <li key={s} style={styles.li}>{s}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <section style={styles.section}>
          <div style={styles.twoCol}>
            <div>
              <p style={styles.sectionLabel}>Inspirations</p>
              <h2 style={styles.h2}>Learn in a voice you already like.</h2>
              <p style={styles.body}>
                Point Beads at creators whose delivery you enjoy. It listens to
                their videos and builds a profile — voice, tone, speaking pace,
                even the music underneath. Your lessons come back sounding like
                that.
              </p>
            </div>
            <ul style={styles.list}>
              {VOICE_STEPS.map((s) => (
                <li key={s} style={styles.li}>{s}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <section style={styles.section}>
          <h2 style={styles.h2}>Start with one document.</h2>
          <p style={{ ...styles.body, marginBottom: 36 }}>
            Upload something you have been meaning to read.
          </p>
          <div style={styles.ctaRow}>
            <Link href="/upload" style={styles.ctaSolid}>Create your first bead</Link>
          </div>
        </section>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <footer style={styles.footer}>
          <span>Beads</span>
          <span>Influenxers</span>
        </footer>
      </div>
    </main>
  );
}
