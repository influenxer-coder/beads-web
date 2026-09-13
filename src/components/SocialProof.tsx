'use client';

import * as React from 'react';
import {
  REVIEWS,
  RATINGS,
  SAMPLE_REVIEWS,
  SAMPLE_RATINGS,
  type Review,
  type Rating,
} from '@/data/reviews';

/**
 * Social proof band, modelled on ElevenReader's "Loved by listeners".
 *
 * Left column: eyebrow chip, headline, rating stats.
 * Right column: review cards. On mobile the cards become a horizontal
 * scroll-snap row instead of a stack.
 *
 * It renders nothing in production while there are no real reviews, so the
 * page can never show social proof Beads has not earned.
 */

const isDev = process.env.NODE_ENV !== 'production';

export default function SocialProof() {
  const reviews: Review[] = REVIEWS.length ? REVIEWS : isDev ? SAMPLE_REVIEWS : [];
  const ratings: Rating[] = RATINGS.length ? RATINGS : isDev ? SAMPLE_RATINGS : [];

  // Nothing real to show, and not in dev: render nothing at all.
  if (!reviews.length) return null;

  const showingSamples = isDev && !REVIEWS.length;

  return (
    <section style={styles.section} aria-labelledby="social-proof-heading">
      <div style={styles.grid}>
        <div className="sp-left" style={styles.left}>
          <div style={styles.eyebrowChip}>
            <Heart />
            <span>What students say</span>
          </div>

          <h2 id="social-proof-heading" style={styles.h2}>
            Built with students, in their words
          </h2>

          {ratings.length > 0 && (
            <div style={styles.ratings}>
              {ratings.map((r) => (
                <div key={r.kind + r.value} style={styles.ratingRow}>
                  <div style={styles.ratingIcon}>
                    <RatingIcon kind={r.kind} />
                  </div>
                  <div>
                    <div style={styles.ratingValue}>{r.value}</div>
                    <div style={styles.ratingLabel}>{r.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showingSamples && (
            <p style={styles.devNote}>
              Dev only. These are placeholders, not real reviews, and are not
              rendered in production. Add real ones in src/data/reviews.ts.
            </p>
          )}
        </div>

        <div className="sp-scroller" style={styles.cardsScroller}>
          <div className="sp-cards" style={styles.cards}>
            {reviews.map((r, i) => (
              <article key={i} style={styles.card}>
                {r.stars && (
                  <div style={styles.stars} aria-label={`${r.stars} out of 5 stars`}>
                    {Array.from({ length: r.stars }).map((_, s) => (
                      <Star key={s} />
                    ))}
                  </div>
                )}

                <p style={styles.quote}>{r.quote}</p>

                <div style={styles.cardFoot}>
                  {r.name ? (
                    <div>
                      <div style={styles.name}>{r.name}</div>
                      {r.role && <div style={styles.role}>{r.role}</div>}
                      <div style={{ ...styles.chip, marginTop: 10 }}>
                        <SourceIcon source={r.source} />
                        <SourceLabel review={r} />
                      </div>
                    </div>
                  ) : (
                    <div style={styles.chip}>
                      <SourceIcon source={r.source} />
                      <SourceLabel review={r} />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceLabel({ review }: { review: Review }) {
  const text = `Review on ${review.source}`;
  if (!review.href) return <span>{text}</span>;
  return (
    <a href={review.href} target="_blank" rel="noopener noreferrer" style={styles.chipLink}>
      {text}
    </a>
  );
}

/* --------------------------------- icons --------------------------------- */

function Heart() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.9-9.4-9A5.3 5.3 0 0 1 12 6.6 5.3 5.3 0 0 1 21.4 12c-1.9 4.1-9.4 9-9.4 9z" />
    </svg>
  );
}

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z" />
    </svg>
  );
}

function RatingIcon({ kind }: { kind: Rating['kind'] }) {
  if (kind === 'installs') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'playstore') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4 2.8v18.4c0 .5.5.8.9.6l13.4-8.9c.4-.3.4-.9 0-1.2L4.9 2.2c-.4-.3-.9 0-.9.6z" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.2 1.3-2.5 1.3-2.5s-2.5-1-2.5-3.6zM14.3 5.4c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 0 2.1-.5 2.7-1.3z" />
    </svg>
  );
}

function SourceIcon({ source }: { source: Review['source'] }) {
  if (source === 'Play Store') return <RatingIcon kind="playstore" />;
  if (source === 'App Store') return <RatingIcon kind="appstore" />;
  if (source === 'TikTok') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.5 2h-3v13.2a2.6 2.6 0 1 1-2-2.5V9.6a5.8 5.8 0 1 0 5 5.7V8.9a6.6 6.6 0 0 0 3.8 1.2V7a3.9 3.9 0 0 1-3.8-3.9V2z" />
      </svg>
    );
  }
  if (source === 'Reddit') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16v12H4z M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/* --------------------------------- styles -------------------------------- */

const styles: Record<string, React.CSSProperties> = {
  section: { padding: '84px 0' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 56,
    alignItems: 'start',
  },
  left: { position: 'sticky', top: 40 },
  eyebrowChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    padding: '7px 14px 7px 11px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.16)',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13.5,
    marginBottom: 26,
  },
  h2: {
    fontSize: 'clamp(28px, 3.8vw, 44px)',
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    fontWeight: 600,
    margin: '0 0 34px',
    maxWidth: '13ch',
  },
  ratings: { display: 'flex', flexDirection: 'column', gap: 20 },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 14 },
  ratingIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    background: 'rgba(255,255,255,0.09)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ratingValue: { fontSize: 17, fontWeight: 600, lineHeight: 1.2 },
  ratingLabel: { fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  devNote: {
    marginTop: 30,
    fontSize: 12.5,
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.38)',
    border: '1px dashed rgba(255,255,255,0.2)',
    padding: '10px 12px',
    borderRadius: 6,
    maxWidth: 320,
  },
  // On mobile this becomes a horizontal scroller; on desktop it is a stack.
  cardsScroller: {},
  cards: {},
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 16,
    padding: '26px 26px 22px',
    scrollSnapAlign: 'start',
  },
  stars: { display: 'flex', gap: 4, color: '#F5A524', marginBottom: 16 },
  quote: { fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.88)', margin: 0 },
  cardFoot: {
    marginTop: 20,
    paddingTop: 18,
    borderTop: '1px solid rgba(255,255,255,0.09)',
  },
  name: { fontSize: 15, fontWeight: 600 },
  role: { fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.45)',
  },
  chipLink: { color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 },
};
