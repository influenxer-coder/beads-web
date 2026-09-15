import * as React from 'react';

/**
 * The Beads wordmark: the B is the sitar mark, followed by "eads".
 *
 * The glyph is inlined rather than loaded as an image so it inherits the text
 * size and never flashes in after the word. The viewBox is cropped to the
 * drawn shape so the mark sits on the same baseline as the letters instead of
 * floating inside the artwork's empty margin.
 */
export default function Wordmark({
  size = 'inherit',
  style,
}: {
  /** Font size for the word; the mark scales with it. */
  size?: string | number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.04em',
        fontSize: size,
        letterSpacing: '-0.03em',
        fontWeight: 700,
        ...style,
      }}
    >
      <SitarB />
      <span aria-hidden="true">eads</span>
      <span style={srOnly}>Beads</span>
    </span>
  );
}

function SitarB() {
  return (
    <svg
      viewBox="127 63 613 884"
      aria-hidden="true"
      focusable="false"
      style={{ height: '0.82em', width: 'auto', transform: 'translateY(0.04em)' }}
    >
      <defs>
        <linearGradient id="bw-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3347" />
          <stop offset="1" stopColor="#a90022" />
        </linearGradient>
        <linearGradient id="bw-redDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cc1232" />
          <stop offset="1" stopColor="#760018" />
        </linearGradient>
      </defs>

      <path
        fill="url(#bw-red)"
        d="M278 92c0-30 24-54 54-54h48c30 0 54 24 54 54v80h34c146 0 264 96 264 214 0 73-44 138-112 177 93 38 158 113 158 202 0 132-139 239-310 239H332c-30 0-54-24-54-54V92zm156 190v211h39c70 0 127-47 127-105s-57-106-127-106h-39zm0 321v271h48c91 0 164-61 164-136 0-74-73-135-164-135h-48z"
      />

      <g fill="url(#bw-redDark)">
        <path d="M274 150h-75c-21 0-38-17-38-38s17-38 38-38h75z" />
        <circle cx="176" cy="112" r="49" />
        <path d="M438 150h75c21 0 38-17 38-38s-17-38-38-38h-75z" />
        <circle cx="536" cy="112" r="49" />
        <path d="M274 242h-58c-18 0-32-14-32-32s14-32 32-32h58z" />
        <circle cx="196" cy="210" r="40" />
        <path d="M438 242h58c18 0 32-14 32-32s-14-32-32-32h-58z" />
        <circle cx="516" cy="210" r="40" />
      </g>

      <g fill="none" stroke="#ffd7d9" strokeLinecap="round">
        <path strokeWidth="12" d="M326 92v842M354 92v842M382 92v842" />
        <path
          strokeWidth="9"
          opacity=".9"
          d="M294 300h124M294 356h124M294 412h124M294 468h124M294 524h124M294 580h124M294 636h124M294 692h124"
        />
      </g>

      <rect x="303" y="779" width="108" height="34" rx="17" fill="#ffd7d9" />
      <circle cx="356" cy="918" r="29" fill="#ffd7d9" />
    </svg>
  );
}

const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};
