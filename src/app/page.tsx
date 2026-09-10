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
  ctaNote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    margin: '20px 0 0',
  },
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
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 1,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  momentWhen: { fontSize: 17, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em' },
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
    title: 'Add your file',
    body: 'Upload a book, a PDF, or your notes. You can also take a photo of one page.',
  },
  {
    n: '02',
    title: 'Pick a voice',
    body: 'Choose a voice you like. Beads will read to you in that voice.',
  },
  {
    n: '03',
    title: 'Press play',
    body: 'You get short audio lessons. About one minute each. Listen anywhere.',
  },
];

const SOURCES = [
  'Books',
  'Research papers',
  'A photo of one page',
  'Slide decks',
  'Meeting notes',
];

const MOMENTS = [
  { when: 'Driving', what: 'Learn on the way to work.' },
  { when: 'Walking', what: 'No screen needed. Just listen.' },
  { when: 'At the gym', what: 'Use the time you already spend.' },
  { when: 'Waiting in line', what: 'One idea instead of scrolling.' },
];

const VOICE_STEPS = [
  'Share a link to someone you like listening to',
  'Beads learns how they sound',
  'Your lessons are read in that voice',
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
          <p style={styles.eyebrow}>Read less. Learn more.</p>
          <h1 style={styles.h1}>
            Turn your reading
            <br />
            <span style={styles.dim}>into short audio.</span>
          </h1>
          <p style={styles.sub}>
            Add a book, a PDF, or your notes. Beads turns it into one minute
            lessons, read in a voice you pick. Listen while you drive or walk.
          </p>
          <div style={styles.ctaRow}>
            <Link href="/upload" style={styles.ctaSolid}>Upload a file</Link>
            <Link href="/feed" style={styles.ctaGhost}>Hear an example</Link>
          </div>
          <p style={styles.ctaNote}>Start with one book. See how it sounds.</p>
        </section>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <section style={styles.section}>
          <p style={styles.sectionLabel}>When to use it</p>
          <h2 style={{ ...styles.h2, marginBottom: 44 }}>
            Listen when you cannot read.
          </h2>
          <div style={styles.grid2}>
            {MOMENTS.map((m) => (
              <div key={m.when} style={styles.cell}>
                <h3 style={styles.momentWhen}>{m.when}</h3>
                <p style={styles.cellBody}>{m.what}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Three steps</p>
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
              <p style={styles.sectionLabel}>What you can add</p>
              <h2 style={styles.h2}>Long reading, made short.</h2>
              <p style={styles.body}>
                Beads reads the whole file. It keeps the important ideas. Then
                it turns each one into a short lesson you can listen to. A long
                book becomes a list of short audio clips.
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
              <p style={styles.sectionLabel}>The voice</p>
              <h2 style={styles.h2}>Pick a voice you like.</h2>
              <p style={styles.body}>
                Most people stop listening when the voice sounds like a robot.
                So you choose. Share a link to someone you like listening to,
                and Beads reads your lessons in a voice like theirs.
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
          <h2 style={styles.h2}>Try it with one book.</h2>
          <p style={{ ...styles.body, marginBottom: 36 }}>
            Add it today. Listen to it tomorrow.
          </p>
          <div style={styles.ctaRow}>
            <Link href="/upload" style={styles.ctaSolid}>Upload a file</Link>
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
