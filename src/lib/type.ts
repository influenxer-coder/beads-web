import type { CSSProperties } from 'react';

/**
 * One type scale for the whole site, measured off apple.com product pages.
 *
 * Two weights only: 400 for reading, 600 for anything that is a heading or a
 * control. Big sizes shrink on phones through clamp(), so no media queries are
 * needed where these are spread into inline styles or MUI `sx`.
 *
 *   hero      80 → 48   the one line a page is about
 *   headline  48 → 32   section headings
 *   title     28 → 21   card and sub-section headings
 *   subhead   21 → 19   small headings, 600
 *   intro     21 → 19   the lead paragraph under a headline, 400
 *   body      17        reading text, buttons, list rows
 *   callout   14        secondary text, meta, small controls
 *   caption   12        timestamps, badges, legal
 */

export const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'Segoe UI', Roboto, Arial, sans-serif";
export const MONO = "'SF Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export const REGULAR = 400;
export const SEMIBOLD = 600;

export const type = {
  hero: { fontSize: 'clamp(48px, 5.6vw, 80px)', lineHeight: 1.05, fontWeight: SEMIBOLD, letterSpacing: '-0.015em' },
  headline: { fontSize: 'clamp(32px, 3.4vw, 48px)', lineHeight: 1.083, fontWeight: SEMIBOLD, letterSpacing: '-0.003em' },
  title: { fontSize: 'clamp(21px, 2vw, 28px)', lineHeight: 1.143, fontWeight: SEMIBOLD, letterSpacing: '0.007em' },
  subhead: { fontSize: 'clamp(19px, 1.5vw, 21px)', lineHeight: 1.19, fontWeight: SEMIBOLD, letterSpacing: '0.011em' },
  intro: { fontSize: 'clamp(19px, 1.5vw, 21px)', lineHeight: 1.381, fontWeight: REGULAR, letterSpacing: '0.011em' },
  body: { fontSize: 17, lineHeight: 1.47, fontWeight: REGULAR, letterSpacing: '-0.022em' },
  bodyStrong: { fontSize: 17, lineHeight: 1.47, fontWeight: SEMIBOLD, letterSpacing: '-0.022em' },
  callout: { fontSize: 14, lineHeight: 1.43, fontWeight: REGULAR, letterSpacing: '-0.016em' },
  calloutStrong: { fontSize: 14, lineHeight: 1.43, fontWeight: SEMIBOLD, letterSpacing: '-0.016em' },
  caption: { fontSize: 12, lineHeight: 1.33, fontWeight: REGULAR, letterSpacing: '-0.01em' },
  captionStrong: { fontSize: 12, lineHeight: 1.33, fontWeight: SEMIBOLD, letterSpacing: '-0.01em' },
} satisfies Record<string, CSSProperties>;
