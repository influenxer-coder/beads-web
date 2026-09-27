'use client';

import * as React from 'react';
import Link from 'next/link';
import HeroFan from '@/components/HeroFan';
import Wordmark from '@/components/Wordmark';
import LibraryHome from '@/components/LibraryHome';
import { supabase } from '@/lib/supabase';
import { identify } from '@/lib/analytics';
import { claimAnonymousDocuments } from '@/lib/identity';
import SocialProof from '@/components/SocialProof';
import MicroBriefPreview from '@/components/MicroBriefPreview';
import { type, SANS, MONO } from '@/lib/type';

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: '#000',
    color: '#fff',
    minHeight: '100vh',
    width: '100%',
    fontFamily: SANS,
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
    ...type.calloutStrong,
  },
  navLink: {
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    ...type.callout,
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
    ...type.caption,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    margin: '0 0 26px',
  },
  h1: {
    ...type.hero,
    margin: '40px 0 22px',
    // keeps the headline to two balanced lines instead of a long widow
    maxWidth: '14ch',
    textWrap: 'balance',
  } as React.CSSProperties,
  dim: { color: 'rgba(255,255,255,0.45)' },
  sub: {
    ...type.intro,
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
  badgeText: { ...type.body, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' },
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
    ...type.bodyStrong,
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
    ...type.bodyStrong,
  },
  rule: { height: 1, background: 'rgba(255,255,255,0.12)', border: 0, margin: 0 },
  section: { padding: '84px 0' },
  sectionLabel: {
    fontFamily: MONO,
    ...type.caption,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    margin: '0 0 44px',
  },
  h2: {
    ...type.headline,
    margin: '0 0 18px',
    maxWidth: 640,
  },
  body: {
    ...type.body,
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
  momentWhen: { ...type.bodyStrong, margin: '0 0 8px' },
  stepNum: {
    fontFamily: MONO,
    ...type.caption,
    color: 'rgba(255,255,255,0.4)',
    margin: '0 0 18px',
  },
  cellTitle: { ...type.bodyStrong, margin: '0 0 10px' },
  cellBody: { ...type.body, color: 'rgba(255,255,255,0.55)', margin: 0 },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 56,
    alignItems: 'start',
  },
  list: { listStyle: 'none', padding: 0, margin: '26px 0 0' },
  li: {
    ...type.body,
    color: 'rgba(255,255,255,0.62)',
    padding: '13px 0',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  seeAll: { margin: '4px 0 0', textAlign: 'center' },
  seeAllLink: {
    display: 'inline-flex', alignItems: 'center', minHeight: 44,
    color: '#fff', ...type.bodyStrong, textDecoration: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.3)',
  },
  footer: {
    padding: '44px 0 60px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    ...type.callout,
    color: 'rgba(255,255,255,0.35)',
  },
};

const BADGES = ['No account needed', 'Any paper PDF', '1-minute lessons'];

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
    title: 'Add a paper.',
    body: 'Upload the PDF. Or start with one of ours.',
  },
  {
    n: '02',
    title: 'Pick a voice.',
    body: 'Warm, deep, bright or energetic. Your call.',
  },
  {
    n: '03',
    title: 'Press play.',
    body: 'A few short lessons. About a minute each.',
  },
];

const SOURCES = [
  'arXiv preprints',
  'Journal articles',
  'Classic papers',
  'Assigned readings',
  'Your own drafts',
];

const MOMENTS = [
  { when: 'One idea per lesson.', what: 'Each lesson takes one part of the paper.' },
  { when: 'Read along.', what: 'The words light up as you listen.' },
  { when: 'The source, one tap away.', what: 'Every paper on our shelf links to the original.' },
];

const VOICE_STEPS = [
  'Warm',
  'Deep',
  'Bright',
  'Energetic',
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
          <Wordmark style={styles.wordmark} />
          <div>
            <Link href="/papers" style={styles.navLink}>Papers</Link>
            <Link href="/audios" style={styles.navLink}>All audios</Link>
            <Link href="/login" style={styles.navSignIn}>Sign in</Link>
          </div>
        </nav>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <section style={styles.hero}>
          <HeroFan />

          <h1 style={styles.h1}>The real paper. One minute at a time.</h1>

          <p style={styles.sub}>
            Beads turns a research paper into short audio lessons. Listen
            first. Then read it with the paper open.
          </p>

          <div style={styles.ctaRow}>
            <Link href="/papers" style={styles.ctaSolid}>Play a paper</Link>
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
        <MicroBriefPreview />
        {/* The preview shows three. Without this the section is a dead end
            and the shelf is unreachable from the page most people land on. */}
        <p style={styles.seeAll}>
          <Link href="/papers" style={styles.seeAllLink}>
            See all papers &rarr;
          </Link>
        </p>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <section style={styles.section}>
          <p style={styles.sectionLabel}>How it helps</p>
          <h2 style={{ ...styles.h2, marginBottom: 44 }}>
            Get the idea. Then the details.
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
              <p style={styles.sectionLabel}>What to add</p>
              <h2 style={styles.h2}>The paper you meant to finish.</h2>
              <p style={styles.body}>
                Beads reads the whole PDF, not just the abstract. It pulls out
                the main ideas. Each one becomes a short lesson.
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
              <h2 style={styles.h2}>A voice worth hearing.</h2>
              <p style={styles.body}>
                A flat robot voice makes a hard paper harder. So you pick the
                voice before you press play.
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
          <h2 style={styles.h2}>Try it with one paper.</h2>
          <p style={{ ...styles.body, marginBottom: 36 }}>
            The one open in your other tab.
          </p>
          <div style={styles.ctaRow}>
            <Link href="/start" style={styles.ctaSolid}>Upload a PDF</Link>
          </div>
        </section>
      </div>

      <hr style={styles.rule} />

      <div style={styles.wrap}>
        <footer style={styles.footer}>
          <Wordmark />
          <span>Influenxers</span>
        </footer>
      </div>
    </main>
  );
}
