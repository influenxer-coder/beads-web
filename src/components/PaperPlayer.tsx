'use client';

import * as React from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import type { Lesson } from '@/lib/papers';

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
    <img src={src} alt="" loading="lazy" onError={() => setGone(true)}
         style={{ ...s.coverImg, width: size, height: size }} />
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
}: {
  lessons: Lesson[];
  paperSlug: string;
}) {
  const [active, setActive] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<number>(1);
  const [t, setT] = React.useState(0);
  const [dur, setDur] = React.useState(0);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const liveRef = React.useRef<HTMLSpanElement | null>(null);
  const lesson = lessons[active];

  const sentences = React.useMemo(
    () => splitSentences(lesson?.script_text ?? ''), [lesson?.id, lesson?.script_text],
  );
  const at = React.useMemo(() => marks(sentences), [sentences]);

  React.useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
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
    };
    audioRef.current = a;
    return () => {
      // detach before pausing: the final timeupdate would otherwise land after
      // the next lesson has reset the playhead and put the old position back
      a.onloadedmetadata = null;
      a.ontimeupdate = null;
      a.onended = null;
      a.pause();
      a.src = '';
    };
    // speed is applied separately so changing it never reloads the audio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  React.useEffect(() => () => audioRef.current?.pause(), []);

  const progress = dur ? t / dur : 0;
  const currentIdx = React.useMemo(() => {
    let idx = -1;
    for (let i = 0; i < at.length; i++) if (progress >= at[i]) idx = i;
    return t > 0 ? idx : -1;
  }, [at, progress, t]);

  React.useEffect(() => {
    liveRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIdx]);

  if (!lesson) return null;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => setPlaying(false));
      setPlaying(true);
      track('paper_play', { paper: paperSlug, lesson: lesson.title, speed });
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

  const cycleRate = () => {
    const i = SPEEDS.indexOf(speed as typeof SPEEDS[number]);
    const r = SPEEDS[(i + 1) % SPEEDS.length];
    setSpeed(r);
    track('paper_speed_changed', { paper: paperSlug, speed: r });
  };

  return (
    <div style={s.wrap}>
      <div className="pp-grid" style={s.grid}>
        {/* ------------------------------ player ------------------------------ */}
        <div className="pp-left" style={s.left}>
          <span style={s.badge}>
            <span style={s.badgeDot} aria-hidden="true" />
            {lessons.length} lesson{lessons.length === 1 ? '' : 's'}
          </span>

          <div style={s.nowRow}>
            <Cover id={lesson.id} size={104} />
            <h2 style={s.nowTitle}>{lesson.title}</h2>
          </div>

          <div style={s.controls}>
            <button type="button" onClick={toggle} style={s.playBtn}
                    aria-label={playing ? 'Pause' : 'Play'}>
              <span aria-hidden="true" style={{ fontSize: 12 }}>{playing ? '❚❚' : '▶'}</span>
              {playing ? 'Pause' : 'Play'}
            </button>
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
          <div className="pp-transcript" style={s.transcript}>
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
              onClick={() => track('paper_cta_clicked', { paper: paperSlug })}>
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
  wrap: { margin: '36px 0 0' },
  grid: { borderRadius: 22, overflow: 'hidden', border: `1px solid ${LINE}` },
  left: { background: '#0b0b0b', padding: '30px 28px 34px', minWidth: 0,
          borderRight: `1px solid ${LINE}` },
  right: { background: '#fff', padding: '30px 28px', minWidth: 0 },

  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px',
    borderRadius: 999, background: 'rgba(52,211,153,0.12)', color: '#34d399',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 18,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 999, background: '#34d399' },

  nowTitle: {
    fontSize: 'clamp(20px, 2.4vw, 25px)', lineHeight: 1.24, fontWeight: 700,
    letterSpacing: '-0.02em', color: '#fff', margin: '0 0 26px',
  },

  controls: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  playBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 52,
    padding: '0 24px', borderRadius: 999, background: '#fff', color: '#0a0a0a',
    border: 0, fontSize: 15.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  round: {
    minWidth: 48, height: 48, borderRadius: 999, background: 'transparent',
    border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.8)', fontSize: 13,
    cursor: 'pointer', padding: '0 10px', whiteSpace: 'nowrap',
  },
  speedBtn: {
    minHeight: 44, padding: '0 16px', borderRadius: 999, background: 'transparent',
    border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.8)', fontSize: 14,
    cursor: 'pointer', marginLeft: 'auto', whiteSpace: 'nowrap',
  },

  range: { display: 'block', width: '100%', margin: '26px 0 0' },
  times: {
    display: 'flex', justifyContent: 'space-between', fontSize: 13.5,
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
    display: 'block', fontSize: 15, lineHeight: 1.35, color: 'inherit',
    overflow: 'hidden', textOverflow: 'ellipsis',
  },
  rowMeta: {
    display: 'block', fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
    fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginTop: 4,
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
  rightTitle: { fontSize: 17, fontWeight: 700, color: '#141414', margin: 0 },
  sync: {
    display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5,
    fontWeight: 600, color: '#ef4444',
  },
  syncDot: { width: 7, height: 7, borderRadius: 999, background: '#ef4444' },

  transcript: {
    fontSize: 16.5, lineHeight: 1.78, color: '#8b8b8b',
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
    borderRadius: 999, background: '#fff', color: '#0a0a0a', fontSize: 16,
    fontWeight: 600, textDecoration: 'none', textAlign: 'center',
  },
};
