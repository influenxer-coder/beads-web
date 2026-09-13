'use client';

import * as React from 'react';
import { ui } from './ui';

export type Voice = {
  id: string;
  name: string;
  language?: string;
  /** Clean sample of this voice taken from the creator's own video. */
  sampleUrl?: string | null;
};

const LAST_VOICE_KEY = 'beads.lastVoiceId';

export function loadLastVoiceId(): string | null {
  try {
    return localStorage.getItem(LAST_VOICE_KEY);
  } catch {
    return null;
  }
}

export default function VoicesPanel({
  open,
  voices,
  loading,
  currentId,
  onApply,
  onClose,
  sampleText,
}: {
  open: boolean;
  voices: Voice[];
  loading: boolean;
  currentId?: string | null;
  onApply: (v: Voice) => void;
  onClose: () => void;
  /** The user's own text, so the sample is of their material, not a demo script. */
  sampleText: string;
}) {
  const [selected, setSelected] = React.useState<string | null>(currentId ?? null);
  const [samplingId, setSamplingId] = React.useState<string | null>(null);
  const sampleAudio = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => setSelected(currentId ?? null), [currentId]);

  React.useEffect(() => {
    if (!open) {
      sampleAudio.current?.pause();
      setSamplingId(null);
    }
  }, [open]);

  // Escape closes, as with any dialog.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /** Play a 15 second sample of this voice reading the user's own words. */
  const sample = async (v: Voice) => {
    sampleAudio.current?.pause();
    if (samplingId === v.id) {
      setSamplingId(null);
      return;
    }
    setSamplingId(v.id);
    try {
      const r = await fetch('/api/voice-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId: v.id, text: sampleText.slice(0, 320) }),
      });
      const data = await r.json();
      const url = data?.audio_url || v.sampleUrl;
      if (!url) {
        setSamplingId(null);
        return;
      }
      const a = new Audio(url);
      sampleAudio.current = a;
      a.onended = () => setSamplingId(null);
      await a.play();
    } catch {
      setSamplingId(null);
    }
  };

  if (!open) return null;

  return (
    <>
      <div style={styles.scrim} onClick={onClose} aria-hidden="true" />
      <aside style={styles.panel} role="dialog" aria-modal="true" aria-label="Choose a voice">
        <header style={styles.head}>
          <h3 style={styles.h3}>Voices</h3>
          <button type="button" onClick={onClose} style={styles.close} aria-label="Close voices">
            ✕
          </button>
        </header>

        <p style={styles.blurb}>Tap any voice to hear it read your own text.</p>

        <div style={styles.list}>
          {loading && <p style={styles.muted}>Loading voices...</p>}

          {!loading && voices.length === 0 && (
            <div style={styles.empty}>
              <p style={styles.muted}>No voices yet.</p>
              <p style={{ ...styles.muted, fontSize: 13.5 }}>
                Add an inspiration and Beads will learn that voice.
              </p>
            </div>
          )}

          {voices.map((v) => {
            const isSel = selected === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelected(v.id)}
                style={{
                  ...styles.voiceRow,
                  borderColor: isSel ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)',
                  background: isSel ? 'rgba(255,255,255,0.07)' : 'transparent',
                }}
                aria-pressed={isSel}
              >
                <span style={styles.avatar}>{v.name.slice(0, 1).toUpperCase()}</span>
                <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <span style={styles.voiceName}>{v.name}</span>
                  <span style={styles.voiceLang}>{v.language || 'English'}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Play a sample of ${v.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    sample(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      sample(v);
                    }
                  }}
                  style={styles.samplePlay}
                >
                  {samplingId === v.id ? '❚❚' : '▶'}
                </span>
              </button>
            );
          })}
        </div>

        <footer style={styles.foot}>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              const v = voices.find((x) => x.id === selected);
              if (!v) return;
              try {
                localStorage.setItem(LAST_VOICE_KEY, v.id);
              } catch {
                /* private mode */
              }
              onApply(v);
            }}
            style={{ ...ui.primaryBtn, width: '100%', opacity: selected ? 1 : 0.5 }}
          >
            Apply and re-narrate
          </button>
        </footer>
      </aside>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scrim: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 950 },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 'min(420px, 92vw)',
    zIndex: 960,
    background: '#0d0d0d',
    borderLeft: '1px solid rgba(255,255,255,0.12)',
    display: 'flex',
    flexDirection: 'column',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 10px',
  },
  h3: { margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' },
  close: {
    width: 44,
    height: 44,
    borderRadius: 999,
    border: 0,
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    cursor: 'pointer',
  },
  blurb: { margin: '0 20px 16px', fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  list: { flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 9 },
  voiceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 13,
    width: '100%',
    minHeight: 64,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    cursor: 'pointer',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 600,
    flexShrink: 0,
  },
  voiceName: { display: 'block', fontSize: 15.5, fontWeight: 550 },
  voiceLang: { display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  samplePlay: {
    width: 44,
    height: 44,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    flexShrink: 0,
  },
  foot: { padding: 20, borderTop: '1px solid rgba(255,255,255,0.1)' },
  muted: { color: 'rgba(255,255,255,0.5)', fontSize: 14.5, margin: '6px 0' },
  empty: { padding: '24px 4px' },
};
