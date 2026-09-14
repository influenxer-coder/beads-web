'use client';

import * as React from 'react';
import { track } from '@/lib/analytics';

/**
 * Where an item came from in the source.
 *
 * Clickable when the surface can jump to that part of the document; otherwise
 * it stays a plain label rather than pretending to be a link.
 */
export default function Cite({
  cite,
  onCite,
}: {
  cite?: string | null;
  onCite?: (cite: string) => void;
}) {
  if (!cite) return null;
  const label = cite.replace(/^\[|\]$/g, '');

  if (!onCite) {
    return (
      <span style={styles.chip}>
        <Mark />
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        track('citation_opened', { cite: label });
        onCite(label);
      }}
      style={{ ...styles.chip, cursor: 'pointer' }}
      title="Show this part of the source"
    >
      <Mark />
      {label}
    </button>
  );
}

function Mark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12.5,
  },
};
