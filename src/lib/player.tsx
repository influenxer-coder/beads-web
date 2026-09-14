'use client';

import * as React from 'react';
import MiniPlayer from '@/components/onboarding/MiniPlayer';

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
};

const PlayerContext = React.createContext<Ctx | null>(null);

export function usePlayer() {
  const c = React.useContext(PlayerContext);
  if (!c) throw new Error('usePlayer must be used inside PlayerProvider');
  return c;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = React.useState<Track | null>(null);
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

  const stop = React.useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    setTrack(null);
  }, []);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);
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
    () => ({ track, playing, play, toggle, stop }),
    [track, playing, play, toggle, stop],
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
          />
        </>
      )}
    </PlayerContext.Provider>
  );
}
