'use client';

import * as React from 'react';
import { fmtTime } from './ui';

const SPEEDS = [1, 1.25, 1.5, 2, 2.5, 3];

/**
 * Persistent bottom player.
 *
 * Owns the single <audio> element for the whole flow and registers Media
 * Session handlers so the lock screen, AirPods and headset buttons control it.
 */
export default function MiniPlayer({
  audioRef,
  title,
  sourceTitle,
  voiceName,
  playing,
  onTogglePlay,
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  title: string;
  sourceTitle: string;
  voiceName?: string | null;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  const [time, setTime] = React.useState(0);
  const [dur, setDur] = React.useState(0);
  const [speed, setSpeed] = React.useState(1);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDur(a.duration || 0);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('durationchange', onMeta);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('durationchange', onMeta);
    };
  }, [audioRef]);

  const seekBy = React.useCallback(
    (delta: number) => {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + delta));
    },
    [audioRef],
  );

  // Lock screen / headset controls.
  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title,
      artist: voiceName ? `Read by ${voiceName}` : 'Beads',
      album: sourceTitle,
    });
    ms.setActionHandler('play', onTogglePlay);
    ms.setActionHandler('pause', onTogglePlay);
    ms.setActionHandler('seekbackward', () => seekBy(-15));
    ms.setActionHandler('seekforward', () => seekBy(15));
    ms.setActionHandler('seekto', (d: any) => {
      const a = audioRef.current;
      if (a && d.seekTime != null) a.currentTime = d.seekTime;
    });
    return () => {
      ['play', 'pause', 'seekbackward', 'seekforward', 'seekto'].forEach((k) => {
        try {
          ms.setActionHandler(k as MediaSessionAction, null);
        } catch {
          /* older browsers */
        }
      });
    };
  }, [title, sourceTitle, voiceName, onTogglePlay, seekBy, audioRef]);

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    }
  }, [playing]);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed, audioRef]);

  // Space toggles play, arrows scrub, as long as focus is not in a field.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/i.test(t.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        seekBy(-15);
      } else if (e.code === 'ArrowRight') {
        seekBy(15);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onTogglePlay, seekBy]);

  const pct = dur ? (time / dur) * 100 : 0;

  return (
    <div style={styles.bar} role="region" aria-label="Player">
      <input
        type="range"
        min={0}
        max={dur || 0}
        step={0.1}
        value={time}
        onChange={(e) => {
          const a = audioRef.current;
          if (a) a.currentTime = Number(e.target.value);
        }}
        aria-label="Seek"
        className="onb-scrub"
        style={{ ...styles.scrub, backgroundSize: `${pct}% 100%` }}
      />

      <div style={styles.row}>
        <div style={styles.left}>
          <div style={styles.title}>{title}</div>
          <div style={styles.sub}>
            {fmtTime(time)} / {fmtTime(dur)}
            {voiceName ? ` · ${voiceName}` : ''}
          </div>
        </div>

        <div style={styles.center}>
          <button type="button" onClick={() => seekBy(-15)} style={styles.iconBtn} aria-label="Back 15 seconds">
            <Skip back />
          </button>
          <button type="button" onClick={onTogglePlay} style={styles.play} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1.2" />
                <rect x="14" y="5" width="4" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13a.6.6 0 0 0 .9.5l10-6.5a.6.6 0 0 0 0-1l-10-6.5a.6.6 0 0 0-.9.5z" />
              </svg>
            )}
          </button>
          <button type="button" onClick={() => seekBy(15)} style={styles.iconBtn} aria-label="Forward 15 seconds">
            <Skip />
          </button>
        </div>

        <div style={styles.right}>
          <button
            type="button"
            onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
            style={styles.speed}
            aria-label={`Playback speed ${speed} times`}
          >
            {speed}×
          </button>
        </div>
      </div>
    </div>
  );
}

function Skip({ back = false }: { back?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ transform: back ? 'scaleX(-1)' : undefined }}
    >
      <path d="M4 12a8 8 0 1 1 2.6 5.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 7v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fill="currentColor" stroke="none">15</text>
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
    background: 'rgba(12,12,12,0.94)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderTop: '1px solid rgba(255,255,255,0.12)',
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  scrub: { display: 'block', width: '100%' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '10px 16px 14px',
    maxWidth: 980,
    margin: '0 auto',
  },
  left: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 14.5,
    fontWeight: 550,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sub: { fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  center: { display: 'flex', alignItems: 'center', gap: 6 },
  right: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    border: 0,
    background: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  play: {
    width: 48,
    height: 48,
    borderRadius: 999,
    border: 0,
    background: '#fff',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  speed: {
    minWidth: 48,
    minHeight: 44,
    padding: '0 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
  },
};
