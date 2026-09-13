'use client';

import * as React from 'react';
import { ui, fmtTime } from './ui';

export type Lesson = {
  id: string;
  title: string;
  sourceTitle: string;
  /** Page or section the lesson was drawn from, when we know it. */
  citedTo?: string | null;
  durationSec?: number | null;
  audioUrl?: string | null;
  script?: string | null;
};

export default function LessonCard({
  lesson,
  playing,
  onPlay,
  onOpenVoices,
  others,
}: {
  lesson: Lesson;
  playing: boolean;
  onPlay: () => void;
  onOpenVoices: () => void;
  others: { id: string; title: string }[];
}) {
  const [offline, setOffline] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // "Offline" here means a real file on the device, not a promise. We fetch the
  // audio and hand it to the browser, so the toggle only turns on if it worked.
  const toggleOffline = async () => {
    if (offline || !lesson.audioUrl) return;
    setSaving(true);
    try {
      const res = await fetch(lesson.audioUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lesson.title.replace(/[^\w\s-]/g, '').slice(0, 60) || 'lesson'}.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOffline(true);
    } catch {
      setOffline(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={{ ...ui.card, ...styles.card }}>
        <div style={styles.meta}>
          <span>{lesson.sourceTitle}</span>
          {lesson.durationSec ? (
            <>
              <Dot />
              <span>{fmtTime(lesson.durationSec)}</span>
            </>
          ) : null}
        </div>

        <h2 style={styles.title}>{lesson.title}</h2>

        <div style={styles.chips}>
          {lesson.citedTo && (
            <span style={ui.chip} title="Where this came from in your document">
              <BookIcon />
              cited to {lesson.citedTo}
            </span>
          )}

          <button
            type="button"
            onClick={toggleOffline}
            disabled={!lesson.audioUrl || saving}
            aria-pressed={offline}
            style={{
              ...ui.chip,
              cursor: lesson.audioUrl ? 'pointer' : 'not-allowed',
              background: offline ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: offline ? '#fff' : 'rgba(255,255,255,0.72)',
            }}
          >
            <DownloadIcon />
            {saving ? 'Saving...' : offline ? 'Saved offline' : 'Save offline'}
          </button>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={onPlay}
            style={styles.bigPlay}
            aria-label={playing ? 'Pause lesson' : 'Play lesson'}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <div>
            <div style={styles.playLabel}>{playing ? 'Playing' : 'Play your lesson'}</div>
            <button type="button" onClick={onOpenVoices} style={styles.voiceLink}>
              Change the voice
            </button>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <div style={styles.library}>
          <div style={styles.libraryLabel}>More from this document</div>
          <ul style={styles.libraryList}>
            {others.map((o) => (
              <li key={o.id} style={styles.libraryItem}>
                <span style={styles.libraryDot} />
                {o.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const Dot = () => <span style={{ opacity: 0.4 }}>·</span>;

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a.6.6 0 0 0 .9.5l10-6.5a.6.6 0 0 0 0-1l-10-6.5a.6.6 0 0 0-.9.5z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { width: '100%', maxWidth: 560, margin: '0 auto' },
  card: { padding: '26px 26px 24px' },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  title: { fontSize: 24, lineHeight: 1.22, letterSpacing: '-0.02em', fontWeight: 600, margin: '0 0 18px' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  actions: { display: 'flex', alignItems: 'center', gap: 16 },
  bigPlay: {
    width: 60,
    height: 60,
    borderRadius: 999,
    border: 0,
    background: '#fff',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  playLabel: { fontSize: 16, fontWeight: 550 },
  voiceLink: {
    background: 'none',
    border: 0,
    padding: 0,
    marginTop: 4,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    cursor: 'pointer',
  },
  library: { marginTop: 30, opacity: 0.5 },
  libraryLabel: {
    fontSize: 12,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 12,
  },
  libraryList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 11 },
  libraryItem: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'rgba(255,255,255,0.75)' },
  libraryDot: { width: 5, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.35)', flexShrink: 0 },
};
