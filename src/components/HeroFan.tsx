'use client';

import * as React from 'react';

/**
 * Hero fan of source cards, modelled on ElevenReader's book-cover fan.
 *
 * Cards sit on an arc around a pivot below the stack. The active card is
 * upright and in front; neighbours rotate away and sit behind it. The arrows
 * move the active index, which rotates the whole fan.
 */

type CardKind = 'pdf' | 'slides' | 'textbook' | 'notes' | 'paper';

type Card = { kind: CardKind; title: string; sub?: string };

const CARDS: Card[] = [
  { kind: 'notes', title: 'Lecture 4', sub: 'handwritten' },
  { kind: 'slides', title: 'Week 7', sub: 'Thermodynamics' },
  { kind: 'paper', title: 'Attention Is All You Need', sub: 'arXiv' },
  { kind: 'textbook', title: 'Organic Chemistry', sub: 'Ch. 12' },
  { kind: 'pdf', title: 'Course reader', sub: '48 pages' },
  { kind: 'slides', title: 'Seminar', sub: 'Macroeconomics' },
  { kind: 'paper', title: 'A Survey of Graph Networks', sub: 'PDF' },
];

/** Geometry of the fan. */
const STEP_DEG = 9;       // rotation between neighbouring cards
const STEP_X = 62;        // horizontal travel between neighbours
const LIFT = 26;          // how far back cards drop down
const SCALE_FALLOFF = 0.055;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/* ------------------------------- card faces ------------------------------ */

const line = (w: string, o = 0.55): React.CSSProperties => ({
  height: 4,
  width: w,
  borderRadius: 2,
  background: `rgba(0,0,0,${o})`,
});

function Lines({ widths, gap = 7 }: { widths: string[]; gap?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {widths.map((w, i) => (
        <div key={i} style={line(w, 0.18)} />
      ))}
    </div>
  );
}

function CardFace({ card }: { card: Card }) {
  const pad = { padding: '14px 13px', height: '100%', boxSizing: 'border-box' as const };

  if (card.kind === 'textbook') {
    return (
      <div style={{ ...pad, background: '#111', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.18em', opacity: 0.6, textTransform: 'uppercase' }}>Textbook</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{card.title}</div>
          <div style={{ fontSize: 9, opacity: 0.55, marginTop: 6 }}>{card.sub}</div>
        </div>
        <div style={{ height: 3, width: 34, background: 'rgba(255,255,255,0.5)' }} />
      </div>
    );
  }

  if (card.kind === 'slides') {
    return (
      <div style={{ ...pad, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: '#111', color: '#fff', borderRadius: 3, padding: '7px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 650, lineHeight: 1.2 }}>{card.title}</div>
          <div style={{ fontSize: 7, opacity: 0.6 }}>{card.sub}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['84%', '70%', '78%', '56%'].map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 4, height: 4, borderRadius: 4, background: 'rgba(0,0,0,0.35)', flexShrink: 0 }} />
              <div style={line(w, 0.16)} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', height: 26, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }} />
      </div>
    );
  }

  if (card.kind === 'notes') {
    return (
      <div style={{ ...pad, background: '#fffdf5', position: 'relative' }}>
        <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 10 }}>{card.title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ position: 'relative', height: 7, borderBottom: '1px solid rgba(0,0,0,0.10)' }}>
              <svg width="100%" height="7" style={{ position: 'absolute', bottom: 1, left: 0 }} aria-hidden="true">
                <path
                  d={`M2 5 q 6 -5 12 0 t 12 0 t 12 0 t 12 0 t 12 0`}
                  fill="none"
                  stroke="rgba(0,0,0,0.32)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  style={{ transform: `scaleX(${0.72 + ((i * 37) % 26) / 100})`, transformOrigin: 'left' }}
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.kind === 'paper') {
    return (
      <div style={{ ...pad, background: '#fff' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, lineHeight: 1.2, textAlign: 'center', marginBottom: 4 }}>
          {card.title}
        </div>
        <div style={{ fontSize: 7, opacity: 0.45, textAlign: 'center', marginBottom: 10 }}>{card.sub}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Lines widths={['100%', '92%', '100%', '84%', '96%', '70%', '100%', '88%']} gap={5} />
          <Lines widths={['100%', '86%', '100%', '94%', '78%', '100%', '90%', '62%']} gap={5} />
        </div>
      </div>
    );
  }

  // pdf
  return (
    <div style={{ ...pad, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.08em', color: '#fff', background: '#111', padding: '3px 5px', borderRadius: 2 }}>
          PDF
        </div>
        <div style={{ fontSize: 8, opacity: 0.5 }}>{card.sub}</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 650, lineHeight: 1.25, marginBottom: 12 }}>{card.title}</div>
      <Lines widths={['100%', '88%', '96%', '74%', '100%', '82%', '90%', '58%']} gap={7} />
    </div>
  );
}

/* --------------------------------- fan ---------------------------------- */

export default function HeroFan() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = React.useState(Math.floor(CARDS.length / 2));
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // next frame, so the collapsed state paints first and the fan animates open
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const open = mounted || reduced;
  const move = (dir: -1 | 1) =>
    setActive((a) => Math.min(CARDS.length - 1, Math.max(0, a + dir)));

  return (
    <div style={styles.fanWrap}>
      <button
        type="button"
        aria-label="Previous source"
        onClick={() => move(-1)}
        disabled={active === 0}
        style={{ ...styles.arrow, left: 0, opacity: active === 0 ? 0.2 : 0.65 }}
      >
        <Chevron dir="left" />
      </button>

      <div style={styles.stage} aria-hidden="true">
        {CARDS.map((card, i) => {
          const offset = i - active;
          const abs = Math.abs(offset);

          const angle = open ? offset * STEP_DEG : 0;
          const x = open ? offset * STEP_X : 0;
          const y = open ? abs * LIFT : 0;
          const scale = open ? 1 - abs * SCALE_FALLOFF : 0.94;

          return (
            <div
              key={i}
              style={{
                ...styles.card,
                zIndex: CARDS.length - abs,
                opacity: open ? 1 : 0,
                transform: `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) rotate(${angle}deg) scale(${scale})`,
                transition: reduced
                  ? 'none'
                  : 'transform 900ms cubic-bezier(.16,1,.3,1), opacity 600ms ease',
                transitionDelay: reduced || mounted ? `${Math.min(abs, 4) * 55}ms` : '0ms',
              }}
            >
              <CardFace card={card} />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Next source"
        onClick={() => move(1)}
        disabled={active === CARDS.length - 1}
        style={{ ...styles.arrow, right: 0, opacity: active === CARDS.length - 1 ? 0.2 : 0.65 }}
      >
        <Chevron dir="right" />
      </button>
    </div>
  );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fanWrap: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // shrinks the whole fan on small screens
    height: 'clamp(230px, 34vw, 360px)',
  },
  stage: {
    position: 'relative',
    width: '100%',
    maxWidth: 640,
    height: '100%',
  },
  card: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 'clamp(104px, 13vw, 150px)',
    aspectRatio: '3 / 4.2',
    borderRadius: 9,
    overflow: 'hidden',
    background: '#fff',
    color: '#111',
    transformOrigin: '50% 160%',
    boxShadow: '0 18px 40px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)',
    willChange: 'transform',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    background: 'transparent',
    border: 0,
    color: '#fff',
    cursor: 'pointer',
    padding: 0,
  },
};
