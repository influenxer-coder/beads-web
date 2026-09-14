'use client';

import * as React from 'react';
import { track } from '@/lib/analytics';
import Cite from './Cite';

/**
 * Flashcard reviewer with spaced repetition.
 *
 * Scheduling is a trimmed SM-2: each card carries an ease, an interval and a
 * due date. "Again" resets the interval and lowers ease; "Good" multiplies the
 * interval by the ease. Only cards that are due appear in a session, so a
 * second pass on the same day is short rather than a full re-run.
 *
 * Review state lives in localStorage, keyed by document, so it survives
 * reloads without needing an account. It is per device, which is the honest
 * trade for a flow that works signed out.
 */

export type Card = { front: string; back: string; cite?: string };

type Sched = { ease: number; intervalDays: number; dueAt: number; reps: number; lapses: number };

const DAY = 86_400_000;
const key = (documentId: string) => `beads.srs.${documentId}`;

function loadSched(documentId: string): Record<string, Sched> {
  try {
    return JSON.parse(localStorage.getItem(key(documentId)) || '{}');
  } catch {
    return {};
  }
}

function saveSched(documentId: string, s: Record<string, Sched>) {
  try {
    localStorage.setItem(key(documentId), JSON.stringify(s));
  } catch {
    /* private mode */
  }
}

const fresh = (): Sched => ({ ease: 2.5, intervalDays: 0, dueAt: 0, reps: 0, lapses: 0 });

function next(s: Sched, grade: 'again' | 'good'): Sched {
  if (grade === 'again') {
    return {
      ease: Math.max(1.3, s.ease - 0.2),
      intervalDays: 0,
      // Back within the session, roughly ten minutes.
      dueAt: Date.now() + 10 * 60_000,
      reps: s.reps + 1,
      lapses: s.lapses + 1,
    };
  }
  const interval = s.intervalDays === 0 ? 1 : s.intervalDays === 1 ? 3 : Math.round(s.intervalDays * s.ease);
  return {
    ease: Math.min(2.8, s.ease + 0.05),
    intervalDays: interval,
    dueAt: Date.now() + interval * DAY,
    reps: s.reps + 1,
    lapses: s.lapses,
  };
}

export default function FlashcardReviewer({
  documentId,
  cards,
  onCite,
}: {
  documentId: string;
  cards: Card[];
  onCite?: (cite: string) => void;
}) {
  const [sched, setSched] = React.useState<Record<string, Sched>>({});
  const [queue, setQueue] = React.useState<number[]>([]);
  const [pos, setPos] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [counts, setCounts] = React.useState({ again: 0, good: 0 });
  const [loaded, setLoaded] = React.useState(false);

  // Build the due queue once the stored schedule is known.
  React.useEffect(() => {
    const s = loadSched(documentId);
    setSched(s);
    const now = Date.now();
    const due = cards.map((_, i) => i).filter((i) => (s[String(i)]?.dueAt ?? 0) <= now);
    setQueue(due);
    setPos(0);
    setFlipped(false);
    setCounts({ again: 0, good: 0 });
    setLoaded(true);
  }, [documentId, cards]);

  const grade = (g: 'again' | 'good') => {
    const idx = queue[pos];
    if (idx == null) return;
    const id = String(idx);
    const updated = { ...sched, [id]: next(sched[id] ?? fresh(), g) };
    setSched(updated);
    saveSched(documentId, updated);
    setCounts((c) => ({ ...c, [g]: c[g] + 1 }));
    track('flashcard_graded', { grade: g });

    // "Again" sends the card to the back of this session.
    setQueue((q) => (g === 'again' ? [...q, idx] : q));
    setPos((p) => p + 1);
    setFlipped(false);
  };

  // Space flips, 1 marks again, 2 marks good.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea/i.test(t.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && e.key === '1') grade('again');
      else if (flipped && e.key === '2') grade('good');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!loaded) return <div style={styles.pad} />;

  if (!cards.length) {
    return <p style={styles.empty}>No cards in this set.</p>;
  }

  // Everything scheduled into the future.
  if (queue.length === 0 || pos >= queue.length) {
    const soonest = Math.min(
      ...cards.map((_, i) => sched[String(i)]?.dueAt ?? 0).filter((d) => d > Date.now()),
    );
    const when =
      isFinite(soonest) && soonest > Date.now()
        ? describeWhen(soonest)
        : 'now';
    return (
      <div style={styles.done}>
        <p style={styles.doneTitle}>Done for now.</p>
        <p style={styles.doneSub}>
          {counts.good + counts.again > 0
            ? `${counts.good} good, ${counts.again} to repeat. `
            : ''}
          Next cards due {when}.
        </p>
        <button
          type="button"
          onClick={() => {
            setQueue(cards.map((_, i) => i));
            setPos(0);
            setFlipped(false);
          }}
          style={styles.secondary}
        >
          Review everything anyway
        </button>
      </div>
    );
  }

  const idx = queue[pos];
  const card = cards[idx];
  const progress = ((pos / queue.length) * 100).toFixed(0);

  return (
    <div style={styles.pad}>
      <div style={styles.progressTrack} role="progressbar" aria-valuenow={Number(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
      <div style={styles.progressRow}>
        <span>
          {pos + 1} of {queue.length}
        </span>
        <span>
          <span style={{ color: '#ff9f9f' }}>✕ {counts.again}</span>
          <span style={{ marginLeft: 12, color: '#5ee08a' }}>✓ {counts.good}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        style={styles.card}
        aria-label={flipped ? 'Show the question' : 'Show the answer'}
      >
        <span style={styles.cardSide}>{flipped ? 'Answer' : 'Question'}</span>
        <span style={styles.cardText}>{flipped ? card.back : card.front}</span>
        {!flipped && <span style={styles.tapHint}>Tap, or press space, to flip</span>}
      </button>

      {card.cite && <Cite cite={card.cite} onCite={onCite} />}

      {flipped ? (
        <div style={styles.gradeRow}>
          <button type="button" onClick={() => grade('again')} style={{ ...styles.grade, ...styles.again }}>
            Again
            <span style={styles.gradeHint}>1</span>
          </button>
          <button type="button" onClick={() => grade('good')} style={{ ...styles.grade, ...styles.good }}>
            Good
            <span style={styles.gradeHint}>2</span>
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setFlipped(true)} style={styles.reveal}>
          Show answer
        </button>
      )}
    </div>
  );
}

function describeWhen(ts: number) {
  const mins = Math.round((ts - Date.now()) / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

const styles: Record<string, React.CSSProperties> = {
  pad: { padding: '18px 16px 20px' },
  progressTrack: { height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#fff', transition: 'width 260ms ease' },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    margin: '10px 0 18px',
  },
  card: {
    width: '100%',
    minHeight: 190,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 12,
    padding: '26px 24px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
  },
  cardSide: { fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' },
  cardText: { fontSize: 20, lineHeight: 1.4, fontWeight: 500 },
  tapHint: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  gradeRow: { display: 'flex', gap: 10, marginTop: 16 },
  grade: {
    flex: 1,
    minHeight: 50,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: '#fff',
    fontSize: 15.5,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  again: { borderColor: 'rgba(255,140,140,0.45)' },
  good: { borderColor: 'rgba(94,224,138,0.5)' },
  gradeHint: {
    fontSize: 11,
    opacity: 0.45,
    border: '1px solid currentColor',
    borderRadius: 4,
    padding: '0 5px',
    lineHeight: '16px',
  },
  reveal: {
    width: '100%',
    minHeight: 50,
    marginTop: 16,
    borderRadius: 999,
    border: 0,
    background: '#fff',
    color: '#000',
    fontSize: 15.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondary: {
    minHeight: 44,
    marginTop: 16,
    padding: '0 20px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'transparent',
    color: '#fff',
    fontSize: 14.5,
    cursor: 'pointer',
  },
  done: { padding: '38px 20px', textAlign: 'center' },
  doneTitle: { fontSize: 18, fontWeight: 600, margin: '0 0 8px' },
  doneSub: { fontSize: 14.5, color: 'rgba(255,255,255,0.55)', margin: 0 },
  empty: { padding: 26, color: 'rgba(255,255,255,0.5)', fontSize: 14.5 },
};
