import type { CSSProperties } from 'react';

/** Shared bits so the onboarding screens stay visually consistent. */
export const ui: Record<string, CSSProperties> = {
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    padding: '0 28px',
    borderRadius: 999,
    border: 0,
    background: '#fff',
    color: '#000',
    fontSize: 15.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  ghostBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    padding: '0 24px',
    borderRadius: 999,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff',
    fontSize: 15.5,
    fontWeight: 550,
    cursor: 'pointer',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.16)',
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
};

export function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}
