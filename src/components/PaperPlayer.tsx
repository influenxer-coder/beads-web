'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { track } from '@/lib/analytics';
import { tiktokTrack } from '@/lib/tiktok';
import type { Lesson } from '@/lib/papers';
import { type, MONO } from '@/lib/type';
import BookmarkCards from '@/components/BookmarkCards';
import { type Bookmark, loadBookmarks, saveBookmarks, isDuplicate } from '@/lib/bookmarks';

/**
 * The player on a paper page.
 *
 * Playback only. The lesson text is rendered on the server by the page so a
 * crawler sees it without running any of this, and this component highlights
 * the line being spoken on top of that.
 *
 * No account, no gate. The whole point of the page is that an ad can land on
 * it and something plays.
 */

const SPEEDS = [1, 1.25, 1.5, 2] as const;

/** Per-lesson episode art, at the same path the signed-in library uses. */
function lessonArt(beadId: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base
    ? `${base}/storage/v1/object/public/beads-assets/covers-lesson/${beadId}.png`
    : null;
}

/** The cover, or a quiet placeholder where one was never rendered. */
function Cover({ id, size }: { id: string; size: number }) {
  const [gone, setGone] = React.useState(false);
  const src = lessonArt(id);
  if (!src || gone) {
    return <span style={{ ...s.coverFallback, width: size, height: size }} aria-hidden="true" />;
  }
  return (
    <Image
      src={src} alt="" width={size * 2} height={size * 2}
      onError={() => setGone(true)}
      style={{ ...s.coverImg, width: size, height: size }}
    />
  );
}

function clock(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function splitSentences(text: string): string[] {
  const parts = (text || '').replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g);
  return (parts || []).map((s) => s.trim()).filter(Boolean);
}

/** Where each sentence starts as a fraction of the whole, by character count. */
function marks(sentences: string[]): number[] {
  const total = sentences.reduce((n, s) => n + s.length, 0) || 1;
  let acc = 0;
  return sentences.map((s) => {
    const at = acc / total;
    acc += s.length;
    return at;
  });
}

export default function PaperPlayer({
  lessons,
  paperSlug,
  autoplay = false,
}: {
  lessons: Lesson[];
  paperSlug: string;
  /** start on load; on phones the browser refuses, so the first tap is armed */
  autoplay?: boolean;
}) {
  const [active, setActive] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<number>(1);
  const [t, setT] = React.useState(0);
  const [dur, setDur] = React.useState(0);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const liveRef = React.useRef<HTMLSpanElement | null>(null);
  const paneRef = React.useRef<HTMLDivElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [armed, setArmed] = React.useState(false);
  // Playing with the sound off, because the browser allowed muted autoplay
  // but not audible autoplay. The page is moving; the tap only adds sound.
  const [muted, setMuted] = React.useState(false);
  const autoTried = React.useRef(false);
  // Detaches the waiting-for-a-gesture listeners, so switching lessons or
  // leaving the page cannot leave them behind.
  const cleanupWake = React.useRef<(() => void) | null>(null);
  const lesson = lessons[active];

  // Flagged points and the cards made from them. Loaded after mount because
  // they live in localStorage, which the server cannot see.
  const [view, setView] = React.useState<'listen' | 'cards'>('listen');
  const [cards, setCards] = React.useState<Bookmark[]>([]);
  const [toast, setToast] = React.useState('');
  const [clipPlaying, setClipPlaying] = React.useState<string | null>(null);
  const clipRef = React.useRef<{ audio: HTMLAudioElement; timer: number } | null>(null);
  const flagRef = React.useRef<((via: 'button' | 'earbud') => void) | null>(null);

  React.useEffect(() => { setCards(loadBookmarks(paperSlug)); }, [paperSlug]);

  React.useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const sentences = React.useMemo(
    () => splitSentences(lesson?.script_text ?? ''), [lesson?.id, lesson?.script_text],
  );
  const at = React.useMemo(() => marks(sentences), [sentences]);

  React.useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
    setArmed(false);
    setMuted(false);
    setT(0);
    setDur(0);
    if (!lesson) return;

    const a = new Audio(lesson.audio_url);
    a.playbackRate = speed;
    a.onloadedmetadata = () => setDur(a.duration || 0);
    a.ontimeupdate = () => setT(a.currentTime);
    a.onended = () => {
      setPlaying(false);
      track('paper_lesson_completed', { paper: paperSlug, lesson: lesson.title });
      tiktokTrack('CompletePayment', { content_id: paperSlug, content_type: 'product' });
    };
    audioRef.current = a;

    // Ads land here, so the page should be moving rather than waiting. Audible
    // autoplay is refused without a gesture, which is a browser rule, but
    // MUTED autoplay is allowed: fall back to that so the scrubber runs and
    // the transcript scrolls on arrival, and the first tap only has to add
    // sound. If even muted playback is refused, arm the tap to start it.
    //
    // Every one of these paths ends in real listening, so every one of them
    // reports paper_play with how it started. The old code tracked only the
    // button, which made the recovered listens invisible.
    if (autoplay && !autoTried.current) {
      autoTried.current = true;

      const reportPlay = (via: string) => {
        track('paper_play', { paper: paperSlug, lesson: lesson.title, speed, via });
        tiktokTrack('ViewContent', { content_id: paperSlug, content_type: 'product',
                                     content_name: lesson.title });
      };

      const wake = (e: Event) => {
        // A tap on our own controls is the button's job; handling it here too
        // would fire twice and then immediately pause.
        const target = e.target;
        if (e.type === 'pointerdown' && target instanceof Node
            && rootRef.current?.contains(target)) return;
        a.muted = false;
        a.play().then(() => {
          setPlaying(true);
          setMuted(false);
          setArmed(false);
          reportPlay('gesture');
          detach();
        }).catch(() => {});
      };
      const detach = () => {
        window.removeEventListener('pointerdown', wake);
        window.removeEventListener('keydown', wake);
      };

      a.play().then(() => {
        setPlaying(true);
        track('paper_autoplay', { paper: paperSlug, blocked: false, muted: false });
        reportPlay('autoplay');
      }).catch(() => {
        a.muted = true;
        a.play().then(() => {
          setPlaying(true);
          setMuted(true);
          track('paper_autoplay', { paper: paperSlug, blocked: true, muted: true });
          window.addEventListener('pointerdown', wake);
          window.addEventListener('keydown', wake);
        }).catch(() => {
          a.muted = false;
          setArmed(true);
          track('paper_autoplay', { paper: paperSlug, blocked: true, muted: false });
          window.addEventListener('pointerdown', wake);
          window.addEventListener('keydown', wake);
        });
      });

      cleanupWake.current = detach;
    }

    return () => {
      // detach before pausing: the final timeupdate would otherwise land after
      // the next lesson has reset the playhead and put the old position back
      a.onloadedmetadata = null;
      a.ontimeupdate = null;
      a.onended = null;
      a.pause();
      a.src = '';
      cleanupWake.current?.();
      cleanupWake.current = null;
    };
    // speed is applied separately so changing it never reloads the audio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  React.useEffect(() => () => {
    audioRef.current?.pause();
    if (clipRef.current) {
      clipRef.current.audio.pause();
      window.clearTimeout(clipRef.current.timer);
    }
  }, []);

  // Earbuds: most send "next track" on a double tap. While this page is open
  // that gesture flags the current point instead, so a listener can save a
  // line without taking the phone out. Browsers that do not pass the gesture
  // through still have the on-screen button.
  React.useEffect(() => {
    const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
    if (!ms) return;
    try {
      ms.setActionHandler('nexttrack', () => flagRef.current?.('earbud'));
    } catch {
      return;
    }
    return () => {
      try { ms.setActionHandler('nexttrack', null); } catch { /* unsupported */ }
    };
  }, []);

  const progress = dur ? t / dur : 0;
  const currentIdx = React.useMemo(() => {
    let idx = -1;
    for (let i = 0; i < at.length; i++) if (progress >= at[i]) idx = i;
    return t > 0 ? idx : -1;
  }, [at, progress, t]);

  React.useEffect(() => {
    // Scroll the transcript pane itself. scrollIntoView walks up to the
    // nearest scrollable ancestor, which is the page, so on load it dragged
    // the whole layout down and pushed the player off screen.
    const pane = paneRef.current, live = liveRef.current;
    if (!pane || !live) return;
    const top = live.offsetTop - pane.offsetTop - pane.clientHeight / 2;
    pane.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [currentIdx]);

  if (!lesson) return null;

  const reportPlay = (via: string) => {
    track('paper_play', { paper: paperSlug, lesson: lesson.title, speed, via });
    // TikTok's own vocabulary: the ad platform can only optimise towards
    // events it recognises.
    tiktokTrack('ViewContent', { content_id: paperSlug, content_type: 'product',
                                 content_name: lesson.title });
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;

    // Running silently after a muted autoplay. The first press means "sound
    // on", not "pause" -- pausing something the visitor has not heard yet
    // would read as the button being broken.
    if (muted) {
      a.muted = false;
      setMuted(false);
      setArmed(false);
      if (a.paused) a.play().catch(() => setPlaying(false));
      setPlaying(true);
      cleanupWake.current?.();
      reportPlay('unmute');
      return;
    }

    if (a.paused) {
      a.play().catch(() => setPlaying(false));
      setPlaying(true);
      setArmed(false);
      cleanupWake.current?.();
      reportPlay('button');
    } else {
      a.pause();
      setPlaying(false);
      track('paper_pause', { paper: paperSlug, at: Math.round(a.currentTime) });
    }
  };

  const skip = (by: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + by));
    setT(a.currentTime);
    track('paper_skip', { paper: paperSlug, by });
  };

  const pick = (i: number) => {
    if (i === active) return;
    setActive(i);
    track('paper_lesson_selected', { paper: paperSlug, lesson: lessons[i]?.title });
  };

  const flag = (via: 'button' | 'earbud') => {
    const a = audioRef.current;
    if (!a || !lesson) return;
    if (a.currentTime <= 0) {
      setToast('Press play first, then flag a point.');
      return;
    }
    const p = a.duration ? a.currentTime / a.duration : 0;
    let idx = 0;
    for (let i = 0; i < at.length; i++) if (p >= at[i]) idx = i;
    const line = sentences[idx];
    if (!line) return;
    const draft = { lessonId: lesson.id, lessonTitle: lesson.title, at: a.currentTime, line };
    if (isDuplicate(cards, draft)) {
      setToast('Already in your cards.');
      return;
    }
    const b: Bookmark = {
      ...draft,
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    const next = [...cards, b];
    setCards(next);
    saveBookmarks(paperSlug, next);
    setToast(`Saved to Cards at ${clock(b.at)}`);
    track('paper_point_flagged', { paper: paperSlug, lesson: lesson.title, at: Math.round(b.at), via });
  };
  flagRef.current = flag;

  const stopClip = () => {
    if (!clipRef.current) return;
    clipRef.current.audio.pause();
    window.clearTimeout(clipRef.current.timer);
    clipRef.current = null;
    setClipPlaying(null);
  };

  // Replays about eight seconds around a flagged point on its own audio
  // element, so the lesson that is loaded keeps its place.
  const playClip = (b: Bookmark) => {
    if (clipPlaying === b.id) { stopClip(); return; }
    stopClip();
    const src = lessons.find((l) => l.id === b.lessonId)?.audio_url;
    if (!src) return;
    const main = audioRef.current;
    if (main && !main.paused) { main.pause(); setPlaying(false); }
    const c = new Audio(src);
    c.onloadedmetadata = () => {
      c.currentTime = Math.max(0, b.at - 4);
      c.play().catch(() => stopClip());
    };
    c.onended = () => stopClip();
    clipRef.current = { audio: c, timer: window.setTimeout(stopClip, 8500) };
    setClipPlaying(b.id);
    track('paper_card_clip_played', { paper: paperSlug, lesson: b.lessonTitle });
  };

  const removeCard = (id: string) => {
    if (clipPlaying === id) stopClip();
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    saveBookmarks(paperSlug, next);
  };

  const openView = (v: 'listen' | 'cards') => {
    setView(v);
    if (v === 'cards') track('paper_cards_opened', { paper: paperSlug, cards: cards.length });
  };

  const cycleRate = () => {
    const i = SPEEDS.indexOf(speed as typeof SPEEDS[number]);
    const r = SPEEDS[(i + 1) % SPEEDS.length];
    setSpeed(r);
    track('paper_speed_changed', { paper: paperSlug, speed: r });
  };

  return (
    <div ref={rootRef} style={s.wrap}>
      <div className="pp-grid" style={s.grid}>
        {/* ------------------------------ player ------------------------------ */}
        <div className="pp-left" style={s.left}>
          <div style={s.badgeRow}>
            <span style={s.badge}>
              <span style={s.badgeDot} aria-hidden="true" />
              {lessons.length} lesson{lessons.length === 1 ? '' : 's'}
            </span>
            {/* True today: nothing on this page checks for a session. Three of
                the four rivals put a signup in front of playback, so it is
                worth saying out loud. */}
            <span style={s.badgeQuiet}>No account needed</span>
            <span style={s.tabs} role="tablist" aria-label="Lesson view">
              <button type="button" role="tab" aria-selected={view === 'listen'}
                      onClick={() => openView('listen')}
                      style={{ ...s.tab, ...(view === 'listen' ? s.tabOn : null) }}>Listen</button>
              <button type="button" role="tab" aria-selected={view === 'cards'}
                      onClick={() => openView('cards')}
                      style={{ ...s.tab, ...(view === 'cards' ? s.tabOn : null) }}>
                Cards ({cards.length})
              </button>
            </span>
          </div>

          {view === 'cards' ? (
            <BookmarkCards cards={cards} clipPlaying={clipPlaying} onPlayClip={playClip}
                           onRemove={removeCard} onBack={() => openView('listen')} />
          ) : (<>

          <div style={s.nowRow}>
            <Cover id={lesson.id} size={104} />
            <div style={{ minWidth: 0 }}>
              <h2 style={s.nowTitle}>{lesson.title}</h2>
              {dur > 0 && <p style={s.nowMeta}>{clock(dur)} listen</p>}
            </div>
          </div>

          {/* The play control is the object of the page, not one button in a
              row of four. Mobile refuses audible autoplay, so for most ad
              traffic this is the thing that actually starts the audio. */}
          <button type="button" onClick={toggle} style={s.playBtn}
                  aria-label={muted ? 'Turn sound on' : playing ? 'Pause' : 'Play'}>
            <span aria-hidden="true" style={s.playGlyph}>
              {muted ? '🔊' : playing ? '❚❚' : '▶'}
            </span>
            {muted ? 'Tap for sound' : playing ? 'Pause' : 'Play this lesson'}
          </button>

          {(armed || muted) && (
            <p style={s.hint}>
              {muted
                ? 'Playing silently because your browser blocks sound until you tap.'
                : 'Your browser needs a tap before it will play audio.'}
            </p>
          )}

          <div style={s.controls}>
            <button type="button" onClick={() => skip(-5)} style={s.round}
                    aria-label="Back 5 seconds">↺ 5</button>
            <button type="button" onClick={() => skip(5)} style={s.round}
                    aria-label="Forward 5 seconds">5 ↻</button>
            <button type="button" onClick={cycleRate} style={s.speedBtn}
                    aria-label={`Speed ${speed}x, tap to change`}>
              {Number.isInteger(speed) ? `${speed.toFixed(1)}x` : `${speed}x`}
            </button>
          </div>

          <input
            type="range" min={0} max={dur || 0} step={0.1} value={t}
            onChange={(e) => {
              const a = audioRef.current;
              if (a) { a.currentTime = Number(e.target.value); setT(a.currentTime); }
            }}
            aria-label="Seek"
            className="pp-scrub"
            style={{ ...s.range, backgroundSize: `${progress * 100}% 100%` }}
          />
          <div style={s.times}>
            <span>{clock(t)}</span>
            <span>{clock(dur)}</span>
          </div>

          <div className="pp-flag" style={s.flagBox}>
            <span style={s.flagIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z" />
              </svg>
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={s.flagTitle}>Save the line you just heard</span>
              <span style={s.flagSub}>It becomes a card. On some earbuds, a double tap does it too.</span>
            </span>
            <button type="button" onClick={() => flag('button')} style={s.flagBtn}>
              Flag this point
            </button>
          </div>
          <p role="status" aria-live="polite" style={{ ...s.toast, opacity: toast ? 1 : 0 }}>
            {toast || '\u00a0'}
          </p>

          {lessons.length > 1 && (
            <ol style={s.list}>
              {lessons.map((l, i) => (
                <li key={l.id}>
                  <button type="button" onClick={() => pick(i)}
                          style={{ ...s.listItem, ...(i === active ? s.listItemOn : null) }}>
                    <span style={s.rowArt}>
                      <Cover id={l.id} size={56} />
                      <span style={s.rowArtPlay} aria-hidden="true">
                        {i === active && playing ? '❚❚' : '▶'}
                      </span>
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={s.rowTitle}>{l.title}</span>
                      <span style={s.rowMeta}>
                        {String(i + 1).padStart(2, '0')} of {String(lessons.length).padStart(2, '0')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          </>)}
        </div>

        {/* ---------------------------- transcript ---------------------------- */}
        <div className="pp-right" style={s.right}>
          <div style={s.rightHead}>
            <h3 style={s.rightTitle}>Transcript</h3>
            <span style={s.sync}>
              <span style={s.syncDot} aria-hidden="true" />
              follows the audio
            </span>
          </div>
          <div ref={paneRef} className="pp-transcript" style={s.transcript}>
            {sentences.map((line, i) => {
              const state = i === currentIdx ? 'on' : i < currentIdx ? 'done' : 'ahead';
              return (
                <span key={i} ref={state === 'on' ? liveRef : undefined} style={{
                  ...s.sentence,
                  ...(state === 'on' ? s.sentenceOn : null),
                  ...(state === 'ahead' ? s.sentenceAhead : null),
                }}>
                  {line}{' '}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div style={s.ctaBar}>
        <Link href="/start" style={s.ctaBtn}
              onClick={() => {
                track('paper_cta_clicked', { paper: paperSlug });
                tiktokTrack('ClickButton', { content_id: paperSlug });
              }}>
          Do this with your own PDF. Free.
        </Link>
      </div>

      <style>{`
        .pp-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
        .pp-scrub{-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;
          background:rgba(255,255,255,.18);background-image:linear-gradient(#fff,#fff);
          background-repeat:no-repeat;cursor:pointer;width:100%}
        .pp-scrub::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;
          border-radius:50%;background:#fff;cursor:pointer}
        .pp-scrub::-moz-range-thumb{width:14px;height:14px;border:0;border-radius:50%;
          background:#fff;cursor:pointer}
        @media (max-width: 860px){
          .pp-grid{grid-template-columns:1fr}
          .pp-left{border-right:0 !important;border-bottom:1px solid rgba(255,255,255,.13)}
          .pp-transcript{max-height:220px}
        }
        @media (max-width: 460px){ .pp-left,.pp-right{padding:22px 18px !important} }
      `}</style>
    </div>
  );
}

const LINE = 'rgba(255,255,255,0.13)';

const s: Record<string, React.CSSProperties> = {
  tabs: {
    display: 'inline-flex', marginLeft: 'auto', padding: 3, borderRadius: 999,
    border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.04)',
  },
  tab: {
    ...type.calloutStrong, minHeight: 32, padding: '0 14px', borderRadius: 999, border: 0,
    background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
  },
  tabOn: { background: '#fff', color: '#000' },
  flagBox: {
    display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, padding: '14px 14px 14px 16px',
    borderRadius: 16, border: '1px dashed rgba(255,255,255,0.22)',
  },
  flagIcon: {
    flex: '0 0 auto', width: 38, height: 38, borderRadius: 999, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', color: '#fff',
  },
  flagTitle: { ...type.calloutStrong, display: 'block', color: '#fff' },
  flagSub: { ...type.caption, display: 'block', color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  flagBtn: {
    ...type.calloutStrong, flex: '0 0 auto', minHeight: 40, padding: '0 16px', borderRadius: 999,
    border: 0, background: '#e11d2e', color: '#fff', cursor: 'pointer',
  },
  toast: { ...type.caption, margin: '8px 2px 0', color: '#7ee2a8', transition: 'opacity 200ms ease' },
  wrap: { margin: '36px 0 0' },
  grid: { borderRadius: 22, overflow: 'hidden', border: `1px solid ${LINE}` },
  left: { background: '#0b0b0b', padding: '30px 28px 34px', minWidth: 0,
          borderRight: `1px solid ${LINE}` },
  right: { background: '#fff', padding: '30px 28px', minWidth: 0 },

  badgeRow: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    marginBottom: 18,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px',
    borderRadius: 999, background: 'rgba(52,211,153,0.12)', color: '#34d399',
    ...type.captionStrong,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 999, background: '#34d399' },
  badgeQuiet: {
    display: 'inline-flex', alignItems: 'center', padding: '7px 14px',
    borderRadius: 999, border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.62)',
    ...type.captionStrong,
  },

  nowTitle: {
    ...type.title, color: '#fff', margin: 0,
  },
  nowMeta: {
    margin: '8px 0 0', ...type.caption, fontFamily: MONO,
    color: 'rgba(255,255,255,0.45)',
  },

  controls: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    marginTop: 14,
  },
  playBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    width: '100%', minHeight: 62, padding: '0 24px', borderRadius: 16,
    background: '#fff', color: '#0a0a0a', border: 0, ...type.bodyStrong,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  playGlyph: { fontSize: 15 },
  hint: {
    margin: '12px 0 0', ...type.callout,
    color: 'rgba(255,255,255,0.58)',
  },
  round: {
    minWidth: 48, height: 48, borderRadius: 999, background: 'transparent',
    border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.8)', ...type.callout,
    cursor: 'pointer', padding: '0 10px', whiteSpace: 'nowrap',
  },
  speedBtn: {
    minHeight: 44, padding: '0 16px', borderRadius: 999, background: 'transparent',
    border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.8)', ...type.callout,
    cursor: 'pointer', marginLeft: 'auto', whiteSpace: 'nowrap',
  },

  range: { display: 'block', width: '100%', margin: '26px 0 0' },
  times: {
    display: 'flex', justifyContent: 'space-between', ...type.callout,
    color: 'rgba(255,255,255,0.45)', marginTop: 10,
  },

  coverImg: {
    display: 'block', borderRadius: 12, objectFit: 'cover',
    border: '1px solid rgba(255,255,255,0.14)', flexShrink: 0,
  },
  coverFallback: {
    display: 'block', borderRadius: 12, flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
  },

  nowRow: { display: 'flex', gap: 18, alignItems: 'flex-start', margin: '0 0 26px' },

  rowArt: {
    position: 'relative', width: 56, height: 56, borderRadius: 12,
    overflow: 'hidden', flexShrink: 0, display: 'block',
  },
  rowArtPlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'rgba(0,0,0,0.42)', color: '#fff',
    fontSize: 12,
  },
  rowTitle: {
    display: 'block', ...type.body, color: 'inherit',
    overflow: 'hidden', textOverflow: 'ellipsis',
  },
  rowMeta: {
    display: 'block', ...type.caption, fontFamily: MONO,
    color: 'rgba(255,255,255,0.35)', marginTop: 4,
  },

  list: { listStyle: 'none', padding: 0, margin: '26px 0 0' },
  // the signed-in library's row: art, title, meta, hairline card
  listItem: {
    display: 'flex', gap: 14, width: '100%', textAlign: 'left', minHeight: 80,
    alignItems: 'center', padding: '10px 14px', borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)',
    color: 'rgba(255,255,255,0.72)', cursor: 'pointer', marginBottom: 10,
  },
  listItemOn: {
    background: 'rgba(255,255,255,0.07)', color: '#fff',
    borderColor: 'rgba(255,255,255,0.3)',
  },

  rightHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 14, flexWrap: 'wrap', paddingBottom: 16,
    borderBottom: '1px solid #e8e8e8', marginBottom: 20,
  },
  rightTitle: { ...type.bodyStrong, color: '#141414', margin: 0 },
  sync: {
    display: 'inline-flex', alignItems: 'center', gap: 7, ...type.calloutStrong,
    color: '#ef4444',
  },
  syncDot: { width: 7, height: 7, borderRadius: 999, background: '#ef4444' },

  transcript: {
    ...type.body, lineHeight: 1.6, color: '#8b8b8b',
    maxHeight: 330, overflowY: 'auto',
  },
  sentence: { transition: 'background 140ms ease, color 140ms ease' },
  sentenceOn: {
    background: '#fde4b0', boxShadow: '0 0 0 3px #fde4b0', borderRadius: 3,
    color: '#141414', fontWeight: 600,
  },
  sentenceAhead: { color: '#a9a9a9' },

  ctaBar: {
    marginTop: 18, padding: 20, borderRadius: 18,
    background: 'rgba(255,255,255,0.045)', border: `1px solid ${LINE}`,
    display: 'flex', justifyContent: 'center',
  },
  ctaBtn: {
    display: 'inline-flex', alignItems: 'center', minHeight: 52, padding: '0 28px',
    borderRadius: 999, background: '#fff', color: '#0a0a0a', ...type.bodyStrong,
    textDecoration: 'none', textAlign: 'center',
  },
};
