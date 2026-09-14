'use client';

import * as React from 'react';
import { track } from '@/lib/analytics';
import FlashcardReviewer from './FlashcardReviewer';
import MindMap from './MindMap';
import Quiz from './Quiz';
import AudioOverview from './AudioOverview';

/**
 * Study artifacts for one document.
 *
 * A row of one-click generators, each producing an artifact that persists
 * against the source, plus the viewer for whichever is open.
 */

export type Kind = 'audio_overview' | 'mind_map' | 'flashcards' | 'quiz';

export type Artifact = {
  id?: string;
  kind: Kind;
  content: any;
  audio_url?: string | null;
};

const TILES: { kind: Kind; label: string; blurb: string; icon: React.ReactNode }[] = [
  { kind: 'audio_overview', label: 'Audio overview', blurb: 'Two hosts talk it through', icon: <Waves /> },
  { kind: 'mind_map', label: 'Mind map', blurb: 'How the ideas connect', icon: <Branch /> },
  { kind: 'flashcards', label: 'Flashcards', blurb: 'Test yourself, spaced out', icon: <Cards /> },
  { kind: 'quiz', label: 'Quiz', blurb: 'Multiple choice, with answers', icon: <Check /> },
];

export default function Studio({
  documentId,
  documentTitle,
  onCite,
}: {
  documentId: string;
  documentTitle: string;
  /** Jump to the cited part of the source. */
  onCite?: (cite: string) => void;
}) {
  const [artifacts, setArtifacts] = React.useState<Record<string, Artifact>>({});
  const [open, setOpen] = React.useState<Kind | null>(null);
  const [busy, setBusy] = React.useState<Kind | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Load whatever already exists for this source.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/artifacts/${documentId}`);
        const d = await r.json();
        if (!alive) return;
        const map: Record<string, Artifact> = {};
        for (const a of d?.artifacts ?? []) map[a.kind] = a;
        setArtifacts(map);
      } catch {
        /* first run, nothing stored yet */
      }
    })();
    return () => {
      alive = false;
    };
  }, [documentId]);

  const generate = async (kind: Kind) => {
    setBusy(kind);
    setError(null);
    const startedAt = Date.now();
    track('artifact_generate_started', { kind });
    try {
      const r = await fetch(`/api/artifacts/${documentId}/${kind}`, { method: 'POST' });
      const d = await r.json();
      if (!d?.success) throw new Error(d?.error ?? 'Could not generate that.');
      setArtifacts((prev) => ({ ...prev, [kind]: { kind, content: d.content, id: d.id } }));
      setOpen(kind);
      track('artifact_generated', { kind, seconds: Math.round((Date.now() - startedAt) / 1000) });
    } catch (e: any) {
      setError(e?.message ?? 'Could not generate that.');
      track('artifact_failed', { kind, reason: e?.message });
    } finally {
      setBusy(null);
    }
  };

  const current = open ? artifacts[open] : null;

  return (
    <section style={styles.wrap} aria-label="Studio">
      <header style={styles.head}>
        <h2 style={styles.h2}>Studio</h2>
        <p style={styles.sub}>Make study material from {documentTitle}</p>
      </header>

      <div style={styles.grid}>
        {TILES.map((t) => {
          const have = !!artifacts[t.kind];
          const loading = busy === t.kind;
          return (
            <button
              key={t.kind}
              type="button"
              onClick={() => (have && !loading ? setOpen(t.kind) : generate(t.kind))}
              disabled={busy !== null}
              style={{
                ...styles.tile,
                borderColor: open === t.kind ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)',
                opacity: busy !== null && !loading ? 0.5 : 1,
              }}
            >
              <span style={styles.tileIcon}>{loading ? <Spin /> : t.icon}</span>
              <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span style={styles.tileLabel}>{t.label}</span>
                <span style={styles.tileBlurb}>
                  {loading ? 'Working on it…' : have ? 'Ready — open' : t.blurb}
                </span>
              </span>
              {have && !loading && <span style={styles.readyDot} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {error && (
        <p style={styles.error} role="alert">
          {error}
        </p>
      )}

      {current && (
        <div style={styles.viewer}>
          <div style={styles.viewerHead}>
            <span style={styles.viewerTitle}>{TILES.find((t) => t.kind === open)?.label}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => generate(open!)} style={styles.smallBtn} disabled={busy !== null}>
                Regenerate
              </button>
              <button type="button" onClick={() => setOpen(null)} style={styles.smallBtn}>
                Close
              </button>
            </div>
          </div>

          {open === 'flashcards' && (
            <FlashcardReviewer
              documentId={documentId}
              cards={current.content?.cards ?? []}
              onCite={onCite}
            />
          )}
          {open === 'mind_map' && <MindMap data={current.content} onCite={onCite} />}
          {open === 'quiz' && <Quiz questions={current.content?.questions ?? []} onCite={onCite} />}
          {open === 'audio_overview' && (
            <AudioOverview documentId={documentId} content={current.content} audioUrl={current.audio_url} />
          )}
        </div>
      )}
    </section>
  );
}

/* --------------------------------- icons --------------------------------- */

function Waves() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12h2m2-5v10m4-14v18m4-13v8m4-5v2m2-1h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function Branch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="5" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="19" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="19" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.4 11L16.6 6.8M7.4 13l9.2 4.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function Cards() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="13" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4h11a2 2 0 0 1 2 2v11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.4 12.4l2.6 2.6 4.6-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Spin() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="onb-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="40 18" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { width: '100%' },
  head: { marginBottom: 16 },
  h2: { fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: 0 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: '8px 0 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 },
  tile: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 66,
    padding: '12px 14px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.09)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tileLabel: { display: 'block', fontSize: 15, fontWeight: 600 },
  tileBlurb: { display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  readyDot: { width: 7, height: 7, borderRadius: 999, background: '#5ee08a', flexShrink: 0 },
  error: {
    marginTop: 14,
    fontSize: 14,
    color: '#ffb0b0',
    background: 'rgba(255,90,90,0.08)',
    border: '1px solid rgba(255,90,90,0.24)',
    borderRadius: 10,
    padding: '10px 12px',
  },
  viewer: {
    marginTop: 18,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  viewerHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '13px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  viewerTitle: { fontSize: 14.5, fontWeight: 600 },
  smallBtn: {
    minHeight: 36,
    padding: '0 14px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: '#fff',
    fontSize: 13.5,
    cursor: 'pointer',
  },
};
