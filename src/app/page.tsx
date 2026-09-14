'use client';

import * as React from 'react';
import Link from 'next/link';
import HeroFan from '@/components/HeroFan';
import LibraryHome from '@/components/LibraryHome';
import { supabase } from '@/lib/supabase';
import { identify } from '@/lib/analytics';
import { claimAnonymousDocuments } from '@/lib/identity';
import SocialProof from '@/components/SocialProof';

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
  navSignIn: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 38,
    marginLeft: 22,
    padding: '0 16px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.28)',
    color: '#fff',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },
  navLink: {
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    fontSize: 14,
    marginLeft: 26,
  },
  hero: {
    padding: '48px 0 72px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  eyebrow: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    margin: '0 0 26px',
  },
  h1: {
    fontSize: 'clamp(34px, 5.6vw, 60px)',
    lineHeight: 1.06,
    letterSpacing: '-0.035em',
    fontWeight: 600,
    margin: '40px 0 22px',
    // keeps the headline to two balanced lines instead of a long widow
    maxWidth: '14ch',
    textWrap: 'balance',
  } as React.CSSProperties,
  dim: { color: 'rgba(255,255,255,0.45)' },
  sub: {
    fontSize: 18,
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.58)',
    maxWidth: 440,
    margin: '0 0 34px',
  },
  ctaRow: { display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 'clamp(18px, 5vw, 56px)',
    marginTop: 54,
  },
  badge: { display: 'flex', alignItems: 'center', gap: 8 },
  badgeText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' },
  ctaSolid: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    background: '#fff',
    color: '#000',
    padding: '0 30px',
    borderRadius: 999,
    textDecoration: 'none',
    fontSize: 15.5,
    fontWeight: 550,
  },
  ctaGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff',
    padding: '0 30px',
    borderRadius: 999,
    textDecoration: 'none',
    fontSize: 15.5,
    fontWeight: 550,
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

const BADGES = ['Free to start', 'Your own PDFs', '1-minute lessons'];

function Laurel({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="15"
      height="20"
      viewBox="0 0 16 22"
      fill="none"
      aria-hidden="true"
      style={{ transform: flip ? 'scaleX(-1)' : undefined, opacity: 0.45 }}
    >
      <path
        d="M12 1.5C6.5 4 3.2 8.5 3.2 13.4c0 3 1.2 5.6 3.3 7.1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {[3.2, 6.2, 9.2, 12.2].map((y, i) => (
        <ellipse
          key={i}
          cx={8.6 - i * 1.25}
          cy={y + 1.6}
          rx="2.6"
          ry="1.35"
          transform={`rotate(${-34 + i * 5} ${8.6 - i * 1.25} ${y + 1.6})`}
          stroke="currentColor"
          strokeWidth="1.1"
          fill="none"
        />
      ))}
    </svg>
  );
}

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

export default function Home() {
  // Signed in people get their library; everyone else gets the pitch.
  const [session, setSession] = React.useState<{ email?: string | null; id?: string } | null>(null);
  const [checked, setChecked] = React.useState(false);
  // ?preview=library renders the signed-in home without a session, so the UI
  // can be reviewed while email sign-in is rate limited. It fakes no auth: the
  // list it shows is readable with the anon key either way.
  const [preview, setPreview] = React.useState(false);

  React.useEffect(() => {
    setPreview(new URLSearchParams(window.location.search).get('preview') === 'library');
  }, []);

  React.useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }: any) => {
      if (!alive) return;
      const u = data?.session?.user;
      if (u) {
        identify(u.id, { email: u.email });
        // Hand over anything this browser made before signing in.
        claimAnonymousDocuments(u.id);
      }
      setSession(u ? { email: u.email, id: u.id } : null);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e: any, s: any) => {
      if (s?.user) {
        identify(s.user.id, { email: s.user.email });
        claimAnonymousDocuments(s.user.id);
      }
      setSession(s?.user ? { email: s.user.email, id: s.user.id } : null);
      setChecked(true);
    });
    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Render the landing markup by default so it still server-renders for
  // search engines and first-time visitors; swap to the library only once we
  // know there is a session.
  if (preview) return <LibraryHome email={session?.email ?? 'preview@beads'} userId={session?.id} />;
  if (checked && session) return <LibraryHome email={session.email} userId={session.id} />;

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <nav style={styles.navRow}>
          <span style={styles.wordmark}>Beads</span>
          <div>
            <Link href="/feed" style={styles.navLink}>Feed</Link>
            <Link href="/library" style={styles.navLink}>Library</Link>
            <Link href="/inspiration" style={styles.navLink}>Inspiration</Link>
            <Link href="/login" style={styles.navSignIn}>Sign in</Link>
          </div>
        </nav>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <section style={styles.hero}>
          <HeroFan />

          <h1 style={styles.h1}>Turn your PDFs and notes into audio you can trust.</h1>

          <p style={styles.sub}>
            Upload a reading, hear a 1-minute lesson to review on the commute.
            Cited and offline.
          </p>

          <div style={styles.ctaRow}>
            <Link href="/start" style={styles.ctaSolid}>Start free</Link>
            <Link href="/start" style={styles.ctaGhost}>Upload a PDF</Link>
          </div>

          {/* Swap these for real numbers once we have them. Nothing here claims
              a rating, an award or an install count we have not earned. */}
          <div style={styles.badgeRow}>
            {BADGES.map((b) => (
              <div key={b} style={styles.badge}>
                <Laurel />
                <span style={styles.badgeText}>{b}</span>
                <Laurel flip />
              </div>
            ))}
          </div>
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
        <SocialProof />
      </div>

      <div style={styles.wrap}>
        <section style={styles.section}>
          <h2 style={styles.h2}>Try it with one book.</h2>
          <p style={{ ...styles.body, marginBottom: 36 }}>
            Add it today. Listen to it tomorrow.
          </p>
          <div style={styles.ctaRow}>
            <Link href="/start" style={styles.ctaSolid}>Upload a file</Link>
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
