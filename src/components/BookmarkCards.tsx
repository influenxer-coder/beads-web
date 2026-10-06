'use client';

import * as React from 'react';
import type { Bookmark } from '@/lib/bookmarks';
import { type, MONO } from '@/lib/type';

/**
 * Cards made from flagged points. The front asks you to recall the point,
 * the back is the line itself, and the clip button replays the audio around
 * the moment it was flagged.
 */

function clock(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function BookmarkCards({
  cards,
  clipPlaying,
  onPlayClip,
  onRemove,
  onBack,
}: {
  cards: Bookmark[];
  clipPlaying: string | null;
  onPlayClip: (b: Bookmark) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
}) {
  const [i, setI] = React.useState(0);
  const [shown, setShown] = React.useState(false);

  // Keep the index valid when a card is removed.
  React.useEffect(() => {
    if (i > cards.length - 1) setI(Math.max(0, cards.length - 1));
  }, [cards.length, i]);

  React.useEffect(() => setShown(false), [i]);

  if (!cards.length) {
    return (
      <div style={s.empty}>
        <p style={s.emptyHead}>No cards yet.</p>
        <p style={s.emptyBody}>
          While a lesson plays, press Flag this point. The line being read
          becomes a card you can test yourself on.
        </p>
        <button type="button" onClick={onBack} style={s.ghost}>Back to the lesson</button>
      </div>
    );
  }

  const c = cards[Math.min(i, cards.length - 1)];

  return (
    <div>
      <button type="button" onClick={() => setShown((v) => !v)} style={s.card}
              aria-label={shown ? 'Hide the answer' : 'Show the answer'}>
        <span style={s.meta}>{c.lessonTitle} · {clock(c.at)}</span>
        {shown ? (
          <span style={s.line}>&ldquo;{c.line}&rdquo;</span>
        ) : (
          <>
            <span style={s.prompt}>What was the point here?</span>
            <span style={s.tap}>Tap to check</span>
          </>
        )}
      </button>

      <div style={s.row}>
        <button type="button" onClick={() => onPlayClip(c)} style={s.clip}>
          {clipPlaying === c.id ? '❚❚ Playing' : '▶ Play 8s clip'}
        </button>
        <button type="button" onClick={() => onRemove(c.id)} style={s.ghost}
                aria-label="Remove this card">Remove</button>
      </div>

      <div style={s.nav}>
        <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))}
                disabled={i === 0} style={s.round} aria-label="Previous card">&#8249;</button>
        <span style={s.count}>{String(i + 1).padStart(2, '0')} of {String(cards.length).padStart(2, '0')}</span>
        <button type="button" onClick={() => setI((n) => Math.min(cards.length - 1, n + 1))}
                disabled={i >= cards.length - 1} style={s.round} aria-label="Next card">&#8250;</button>
      </div>
    </div>
  );
}

const LINE = 'rgba(255,255,255,0.13)';

const s: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex', flexDirection: 'column', gap: 14, width: '100%', minHeight: 220,
    padding: '22px 22px 24px', borderRadius: 18, border: `1px solid ${LINE}`,
    background: '#141414', color: '#fff', textAlign: 'left', cursor: 'pointer',
  },
  meta: { ...type.captionStrong, fontFamily: MONO, color: 'rgba(255,255,255,0.5)' },
  prompt: { ...type.subhead, color: '#f5f5f7' },
  tap: { ...type.callout, color: 'rgba(255,255,255,0.45)', marginTop: 'auto' },
  line: { ...type.intro, color: '#f5f5f7' },
  row: { display: 'flex', gap: 10, marginTop: 14 },
  clip: {
    ...type.calloutStrong, flex: 1, minHeight: 44, borderRadius: 999, border: 0,
    background: '#fff', color: '#000', cursor: 'pointer',
  },
  ghost: {
    ...type.callout, minHeight: 44, padding: '0 18px', borderRadius: 999,
    border: `1px solid ${LINE}`, background: 'transparent', color: '#fff', cursor: 'pointer',
  },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  round: {
    width: 40, height: 40, borderRadius: 999, border: `1px solid ${LINE}`,
    background: 'transparent', color: '#fff', fontSize: 20, lineHeight: 1, cursor: 'pointer',
  },
  count: { ...type.caption, fontFamily: MONO, color: 'rgba(255,255,255,0.55)' },
  empty: { padding: '28px 4px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' },
  emptyHead: { ...type.bodyStrong, margin: 0 },
  emptyBody: { ...type.callout, margin: '0 0 8px', color: 'rgba(255,255,255,0.6)', maxWidth: 360 },
};
