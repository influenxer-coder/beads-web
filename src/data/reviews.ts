/**
 * Social proof data.
 *
 * RULES
 * 1. Only real, sourced quotes go in REVIEWS. Every entry needs a `source` and,
 *    wherever possible, an `href` a visitor can click to verify it.
 * 2. Only real, current numbers go in RATINGS. No install counts, no star
 *    averages, until the store listing actually shows them.
 * 3. Never paste a review of another app here. A quote about Speechify or
 *    ElevenReader on this page reads as a quote about Beads, which is a lie.
 *
 * The band hides itself in production while REVIEWS is empty. A quote from
 * someone who works on Beads must say so in its role, never pass as a user.
 *
 * SAMPLE_* below exists only so the layout can be reviewed in local dev. It is
 * never rendered in a production build.
 */

export type Review = {
  quote: string;
  /** Where it came from, shown in the chip. */
  source: 'App Store' | 'Play Store' | 'TikTok' | 'Reddit' | 'Email' | 'Interview' | 'Founder';
  /** Link a visitor can follow to verify the quote. */
  href?: string;
  /** Attribution. Use only what the person agreed to publish. */
  name?: string;
  role?: string;
  /** Only set once there is a real star rating attached to the review. */
  stars?: 1 | 2 | 3 | 4 | 5;
};

export type Rating = {
  /** e.g. "4.7 stars" — only when the store actually reports it. */
  value: string;
  /** e.g. "on App Store" */
  label: string;
  kind: 'appstore' | 'playstore' | 'installs';
};

/** Real reviews. Add here as they arrive. */
export const REVIEWS: Review[] = [
  {
    // The founder's own use, labelled as such. Given 2026-10-23.
    quote:
      'I study spiritual texts. I translated and understood Sanskrit books from the 12th century, to get at what the sages actually wrote.',
    source: 'Founder',
    name: 'Amritashwar Lal',
    role: 'Founder of Beads, studying spiritual texts',
  },
  {
    // Described by the founder 2026-10-23. Founder confirmed the same day
    // that Anthony agreed to the wording, his name and MIT being shown.
    quote:
      'I am a physics PhD student. I use Beads to listen through publications from fellow students when I grade their work.',
    source: 'Interview',
    name: 'Anthony',
    role: 'Physics PhD student, MIT',
  },
];

/** Real store ratings. Add here once the listings are live and rated. */
export const RATINGS: Rating[] = [];

/* ------------------------------------------------------------------------ */
/* Dev-only placeholders. Shape reference, and lets us see the layout.        */
/* These are obviously fake on purpose so they can never be mistaken for real */
/* and shipped by accident.                                                   */
/* ------------------------------------------------------------------------ */

export const SAMPLE_REVIEWS: Review[] = [
  {
    quote:
      'SAMPLE — placeholder text standing in for a real student quote. Replace with a sourced review before this ships.',
    source: 'TikTok',
    name: 'Sample name',
    role: 'Sample course, sample university',
  },
  {
    quote:
      'SAMPLE — second placeholder. A real one would be verifiable at the link in the chip below.',
    source: 'App Store',
    stars: 5,
  },
  {
    quote:
      'SAMPLE — third placeholder, shown only in local development so the card layout can be checked.',
    source: 'Reddit',
  },
  {
    quote: 'SAMPLE — fourth placeholder.',
    source: 'Interview',
    name: 'Sample name',
    role: 'Sample role',
  },
];

export const SAMPLE_RATINGS: Rating[] = [
  { value: '0.0 stars', label: 'SAMPLE, not a real rating', kind: 'appstore' },
  { value: '0.0 stars', label: 'SAMPLE, not a real rating', kind: 'playstore' },
];
