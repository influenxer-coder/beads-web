'use client';

import * as React from 'react';
import MiniPlayer from '@/components/onboarding/MiniPlayer';
import { track as capture } from '@/lib/analytics';

/**
 * One player for the whole app.
 *
 * The audio element lives in the root layout, so playback survives route
 * changes: starting a lesson in the library and navigating elsewhere keeps
 * the mini-player docked and the audio running.
 */

export type Track = {
  id: string;
  title: string;
  sourceTitle: string;
  audioUrl: string;
  voiceName?: string | null;
};

type Ctx = {
  track: Track | null;
  playing: boolean;
  play: (t: Track) => void;
  toggle: () => void;
  stop: () => void;
  /** Up Next, in order. */
  queue: Track[];
  enqueue: (t: Track) => void;
  dequeue: (id: string) => void;
  reorder: (from: number, to: number) => void;
  next: () => void;
  prev: () => void;
  /** Lessons played to the end, so the feed can mark them completed. */
  completed: Set<string>;
};

const PlayerContext = React.createContext<Ctx | null>(null);

export function usePlayer() {
  const c = React.useContext(PlayerContext);
  if (!c) throw new Error('usePlayer must be used inside PlayerProvider');
  return c;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = React.useState<Track | null>(null);
  const [queue, setQueue] = React.useState<Track[]>([]);
  const [history, setHistory] = React.useState<Track[]>([]);
  const [completed, setCompleted] = React.useState<Set<string>>(new Set());

  // Completion survives reloads so the Completed filter still means something.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('beads.completed');
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch {
      /* private mode */
    }
  }, []);

  const markCompleted = React.useCallback((id: string) => {
    setCompleted((prev) => {
      if (prev.has(id)) return prev;
      const nextSet = new Set(prev).add(id);
      try {
        localStorage.setItem('beads.completed', JSON.stringify([...nextSet]));
      } catch {
        /* ignore */
      }
      return nextSet;
    });
  }, []);
  const trackRef = React.useRef<Track | null>(null);
  React.useEffect(() => {
    trackRef.current = track;
  }, [track]);
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const play = React.useCallback((t: Track) => {
    setTrack((current) => {
      // Same track: treat as a toggle rather than restarting it.
      if (current?.id === t.id && current.audioUrl === t.audioUrl) return current;
      return t;
    });
    // Let the src land before asking the element to play.
    requestAnimationFrame(() => {
      const a = audioRef.current;
      if (!a) return;
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    });
  }, []);

  const toggle = React.useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else {
      a.pause();
      setPlaying(false);
    }
  }, []);

  const enqueue = React.useCallback((t: Track) => {
    setQueue((q) => (q.some((x) => x.id === t.id) ? q : [...q, t]));
  }, []);

  const dequeue = React.useCallback((id: string) => {
    setQueue((q) => q.filter((t) => t.id !== id));
  }, []);

  const reorder = React.useCallback((from: number, to: number) => {
    setQueue((q) => {
      if (from === to || from < 0 || to < 0 || from >= q.length || to >= q.length) return q;
      const copy = [...q];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }, []);

  const next = React.useCallback(() => {
    setQueue((q) => {
      if (!q.length) return q;
      const [head, ...rest] = q;
      setTrack((cur) => {
        if (cur) setHistory((h) => [cur, ...h].slice(0, 20));
        return head;
      });
      requestAnimationFrame(() => {
        audioRef.current?.load();
        audioRef.current?.play().catch(() => undefined);
      });
      return rest;
    });
  }, []);

  const prev = React.useCallback(() => {
    setHistory((h) => {
      if (!h.length) {
        // Nothing behind us: restart the current lesson, as players do.
        if (audioRef.current) audioRef.current.currentTime = 0;
        return h;
      }
      const [last, ...rest] = h;
      setTrack((cur) => {
        if (cur) setQueue((q) => [cur, ...q]);
        return last;
      });
      requestAnimationFrame(() => {
        audioRef.current?.load();
        audioRef.current?.play().catch(() => undefined);
      });
      return rest;
    });
  }, []);

  const stop = React.useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    setTrack(null);
  }, []);

  // Fire 25/50/100% once each per track: how far people actually get is the
  // real measure of whether a lesson landed.
  const milestones = React.useRef<Set<number>>(new Set());
  React.useEffect(() => {
    milestones.current = new Set();
  }, [track?.id]);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onProgress = () => {
      if (!a.duration || !isFinite(a.duration)) return;
      const pct = (a.currentTime / a.duration) * 100;
      for (const m of [25, 50, 100]) {
        if (pct >= m && !milestones.current.has(m)) {
          milestones.current.add(m);
          capture('play_progress', { percent: m, title: trackRef.current?.title });
        }
      }
    };
    a.addEventListener('timeupdate', onProgress);
    return () => a.removeEventListener('timeupdate', onProgress);
  }, [track]);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      if (trackRef.current) markCompleted(trackRef.current.id);
      next();
    };
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnd);
    };
  }, [track]);

  const value = React.useMemo(
    () => ({ track, playing, play, toggle, stop, queue, enqueue, dequeue, reorder, next, prev, completed }),
    [track, playing, play, toggle, stop, queue, enqueue, dequeue, reorder, next, prev, completed],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {track && (
        <>
          <audio ref={audioRef} src={track.audioUrl} preload="auto" />
          <MiniPlayer
            audioRef={audioRef}
            title={track.title}
            sourceTitle={track.sourceTitle}
            voiceName={track.voiceName}
            playing={playing}
            onTogglePlay={toggle}
            queue={queue}
            onNext={next}
            onPrev={prev}
            onReorder={reorder}
            onRemove={dequeue}
          />
        </>
      )}
    </PlayerContext.Provider>
  );
}
