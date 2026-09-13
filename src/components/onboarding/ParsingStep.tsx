'use client';

import * as React from 'react';
import { ui } from './ui';

export type Phase = {
  key: string;
  label: string;
  /** Fraction of the whole job this phase represents. */
  weight: number;
};

export const PHASES: Phase[] = [
  { key: 'upload', label: 'Uploading your file', weight: 0.1 },
  { key: 'parse', label: 'Reading the document', weight: 0.2 },
  { key: 'chunk', label: 'Finding the sections', weight: 0.15 },
  { key: 'beads', label: 'Picking the key idea', weight: 0.15 },
  { key: 'scripts', label: 'Writing your lesson', weight: 0.15 },
  { key: 'audio', label: 'Recording the narration', weight: 0.25 },
];

export default function ParsingStep({
  activeKey,
  detail,
  etaSeconds,
  degraded,
}: {
  activeKey: string;
  /** Live status line, e.g. "Reading page 3 of 7". */
  detail?: string | null;
  etaSeconds?: number | null;
  /** True when we fell back to a plain text read. */
  degraded?: boolean;
}) {
  const idx = Math.max(0, PHASES.findIndex((p) => p.key === activeKey));
  const done = PHASES.slice(0, idx).reduce((a, p) => a + p.weight, 0);
  const pct = Math.round(Math.min(0.99, done + PHASES[idx].weight * 0.45) * 100);

  return (
    <div style={styles.wrap}>
      <h2 style={styles.h2}>Making your lesson</h2>

      <div
        style={styles.track}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress making your lesson"
      >
        <div style={{ ...styles.fill, width: `${pct}%` }} />
      </div>

      <div style={styles.statusRow}>
        <span style={styles.status}>
          {detail || PHASES[idx].label}
          <span style={styles.dots} aria-hidden="true">…</span>
        </span>
        <span style={styles.eta}>
          {etaSeconds != null && etaSeconds > 0 ? `about ${etaSeconds}s left` : `${pct}%`}
        </span>
      </div>

      {degraded && (
        <p style={styles.degraded}>
          This file was hard to read, so we are using the plain text instead. The
          lesson will still play.
        </p>
      )}

      <ol style={styles.phases}>
        {PHASES.map((p, i) => (
          <li key={p.key} style={styles.phase}>
            <span style={{ ...styles.tick, ...(i < idx ? styles.tickDone : i === idx ? styles.tickNow : {}) }}>
              {i < idx ? <Check /> : i === idx ? <Spinner /> : null}
            </span>
            <span
              style={{
                fontSize: 14.5,
                color: i <= idx ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              }}
            >
              {p.label}
            </span>
          </li>
        ))}
      </ol>

      {/* Skeleton of the card that is coming, so the wait feels like progress
          toward something specific rather than a blank screen. */}
      <div style={{ ...ui.card, ...styles.skeleton }} aria-hidden="true">
        <div style={{ ...styles.bone, width: '62%', height: 18 }} />
        <div style={{ ...styles.bone, width: '38%', height: 12, marginTop: 12 }} />
        <div style={styles.skelRow}>
          <div style={styles.skelPlay} />
          <div style={{ ...styles.bone, width: '45%', height: 10 }} />
        </div>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="onb-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="40 18" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { width: '100%', maxWidth: 560, margin: '0 auto' },
  h2: { fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 22px' },
  track: {
    height: 6,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    background: '#fff',
    borderRadius: 999,
    transition: 'width 600ms cubic-bezier(.4,0,.2,1)',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 12,
  },
  status: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  dots: { opacity: 0.5 },
  eta: { fontSize: 13.5, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' },
  degraded: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.7)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    padding: '11px 13px',
  },
  phases: { listStyle: 'none', padding: 0, margin: '28px 0 0', display: 'flex', flexDirection: 'column', gap: 13 },
  phase: { display: 'flex', alignItems: 'center', gap: 12 },
  tick: {
    width: 20,
    height: 20,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#000',
  },
  tickDone: { background: '#fff', borderColor: '#fff' },
  tickNow: { color: '#fff', borderColor: 'rgba(255,255,255,0.5)' },
  skeleton: { marginTop: 30, padding: 22 },
  bone: { background: 'rgba(255,255,255,0.09)', borderRadius: 5 },
  skelRow: { display: 'flex', alignItems: 'center', gap: 14, marginTop: 22 },
  skelPlay: { width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.09)', flexShrink: 0 },
};
