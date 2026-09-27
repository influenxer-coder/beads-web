'use client';

import * as React from 'react';
import Phone from '@/components/Phone';
import { type } from '@/lib/type';

/**
 * "Get the highlights": a row of cards, one line and one real screen each,
 * that scrolls sideways. Modelled on the highlights band on apple.com
 * product pages.
 */

const CARDS = [
  { head: 'Read along.', sub: 'The words light up as you listen.', src: '/screens/transcript.webp',
    alt: 'A lesson transcript with the sentence being read highlighted' },
  { head: 'One idea per lesson.', sub: 'Each lesson takes one part of the paper.', src: '/screens/lessons.webp',
    alt: 'The list of lessons for Attention Is All You Need' },
  { head: 'No account needed.', sub: 'Open a paper and press play.', src: '/screens/player.webp',
    alt: 'The player for Attention Is All You Need' },
  { head: 'The source, one tap away.', sub: 'Keep the original open while you listen.', src: '/screens/source.webp',
    alt: 'A link to the original paper under the lessons' },
];

export default function Highlights() {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);

  const onScroll = () => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.firstElementChild as HTMLElement | null;
    if (!card) return;
    // Near the end the row cannot scroll a card to the start, so count
    // reaching the end as the last card.
    const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 2;
    setActive(atEnd ? CARDS.length - 1 : Math.round(row.scrollLeft / (card.offsetWidth + GAP)));
  };

  const go = (i: number) => {
    const row = rowRef.current;
    const card = row?.firstElementChild as HTMLElement | null;
    if (!row || !card) return;
    const n = Math.max(0, Math.min(CARDS.length - 1, i));
    row.scrollTo({ left: n * (card.offsetWidth + GAP), behavior: 'smooth' });
  };

  return (
    <section style={s.section} aria-labelledby="hl-heading">
      <div style={s.column}>
        <h2 id="hl-heading" style={s.h2}>Get the highlights.</h2>
      </div>

      <div ref={rowRef} onScroll={onScroll} className="hl-row" style={s.row}>
        {CARDS.map((c) => (
          <article key={c.head} style={s.card}>
            <p style={s.cardHead}>
              {c.head}
              <br />
              <span style={s.cardSub}>{c.sub}</span>
            </p>
            <div style={s.phoneWrap}>
              <Phone src={c.src} alt={c.alt} width={260} />
            </div>
          </article>
        ))}
      </div>

      <div style={{ ...s.column, ...s.controls }}>
        <div style={s.dots} role="tablist" aria-label="Highlights">
          {CARDS.map((c, i) => (
            <button key={c.head} type="button" role="tab" aria-selected={i === active}
                    aria-label={c.head} onClick={() => go(i)}
                    style={{ ...s.dot, ...(i === active ? s.dotOn : null) }} />
          ))}
        </div>
        <div style={s.arrows}>
          <button type="button" aria-label="Previous" onClick={() => go(active - 1)}
                  disabled={active === 0} style={s.arrow}>&#8249;</button>
          <button type="button" aria-label="Next" onClick={() => go(active + 1)}
                  disabled={active === CARDS.length - 1} style={s.arrow}>&#8250;</button>
        </div>
      </div>
    </section>
  );
}

const GAP = 20;
const INSET = 'max(24px, calc((100vw - 920px) / 2 + 24px))';

const s: Record<string, React.CSSProperties> = {
  section: { padding: '96px 0 72px' },
  column: { maxWidth: 920, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' },
  h2: { ...type.headline, margin: '0 0 40px' },
  row: {
    display: 'flex',
    gap: GAP,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    // Full width, but the first card lines up with the page column. The
    // page column is 920px wide with 24px padding.
    paddingLeft: INSET,
    paddingRight: INSET,
    scrollPaddingLeft: INSET,
    WebkitOverflowScrolling: 'touch',
  },
  card: {
    flex: '0 0 auto',
    width: 'min(86vw, 520px)',
    height: 560,
    scrollSnapAlign: 'start',
    borderRadius: 28,
    background: '#161617',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  cardHead: { ...type.subhead, textAlign: 'center', margin: '40px 28px 32px', color: '#f5f5f7' },
  cardSub: { fontWeight: 400, color: 'rgba(255,255,255,0.6)' },
  // The phone runs off the bottom edge of the card, the way Apple crops it.
  phoneWrap: { flex: 1, display: 'flex', justifyContent: 'center' },
  controls: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
  dots: { display: 'flex', gap: 10, padding: '10px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)' },
  dot: { width: 8, height: 8, padding: 0, border: 0, borderRadius: 999, background: 'rgba(255,255,255,0.35)', cursor: 'pointer' },
  dotOn: { width: 28, background: '#f5f5f7' },
  arrows: { display: 'flex', gap: 12 },
  arrow: {
    width: 36, height: 36, borderRadius: 999, border: 0, cursor: 'pointer',
    background: 'rgba(255,255,255,0.12)', color: '#f5f5f7', fontSize: 22, lineHeight: 1,
  },
};
