'use client';

import * as React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

/**
 * Sample a 1-Minute Micro-Brief.
 *
 * Speechify and ElevenReader both put account creation in front of narration
 * and synchronized highlighting, so nobody hears the thing before deciding.
 * This plays a real lesson on the public page with no account, with the
 * transcript following along, and only asks for a sign-up afterwards.
 *
 * The samples are real lessons from real papers already in the library rather
 * than invented corporate briefs, so the transcript and the audio are the
 * genuine article. Curation is by data: documents tagged with the anon_id
 * below, so the shelf changes by ingesting a paper, not by shipping code.
 */

const CURATED_ANON_ID = 'popular-lessons';
const SPEEDS = [1, 1.25, 1.5, 2] as const;

type Sample = {
  id: string;
  title: string;
  paper: string;
  audioUrl: string;
  sentences: string[];
  /** cumulative share of the script, 0..1, used to follow along */
  marks: number[];
};

function splitSentences(text: string): string[] {
  const parts = (text || '')
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]*/g);
  return (parts || []).map((s) => s.trim()).filter(Boolean);
}

/**
 * Where each sentence starts, as a fraction of the whole.
 *
 * The narration has no word timings stored, so position is estimated from
 * character count. Speech rate is near enough constant within one lesson that
 * this tracks well; it is an approximation, not a transcript alignment.
 */
function sentenceMarks(sentences: string[]): number[] {
  const total = sentences.reduce((n, s) => n + s.length, 0) || 1;
  let acc = 0;
  return sentences.map((s) => {
    const at = acc / total;
    acc += s.length;
    return at;
  });
}

function clock(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function shortPaper(name: string) {
  const clean = (name || '').replace(/\.pdf$/i, '');
  const m = clean.match(/^(.*?)\s*\([^)]*\)\s*$/);
  return m ? m[1] : clean;
}

export default function MicroBriefPreview() {
  const [samples, setSamples] = React.useState<Sample[]>([]);
  const [active, setActive] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<number>(1);
  const [t, setT] = React.useState(0);
  const [dur, setDur] = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const liveRef = React.useRef<HTMLSpanElement | null>(null);
  const sample = samples[active];

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('beads')
        .select('id, title, script_text, audio_url, documents!inner(title, anon_id)')
        .eq('documents.anon_id', CURATED_ANON_ID)
        .not('audio_url', 'is', null)
        .limit(12);
      if (!alive || !data) return;

      const seen = new Set<string>();
      const rows: Sample[] = [];
      for (const b of data as any[]) {
        const paper = b.documents?.title ?? '';
        if (seen.has(paper)) continue;   // one brief per paper
        seen.add(paper);
        const sentences = splitSentences(b.script_text ?? '');
        if (!sentences.length) continue;
        rows.push({
          id: b.id,
          title: b.title,
          paper: shortPaper(paper),
          audioUrl: b.audio_url,
          sentences,
          marks: sentenceMarks(sentences),
        });
        if (rows.length === 3) break;    // three tabs, as the design calls for
      }
      setSamples(rows);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // One audio element, rebuilt when the sample changes.
  React.useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
    setT(0);
    setDur(0);
    setFinished(false);
    if (!sample) return;

    const a = new Audio(sample.audioUrl);
    a.playbackRate = speed;
    a.onloadedmetadata = () => setDur(a.duration || 0);
    a.ontimeupdate = () => setT(a.currentTime);
    a.onended = () => {
      setPlaying(false);
      setFinished(true);
      track('preview_completed', { lesson: sample.title, paper: sample.paper });
    };
    audioRef.current = a;
    return () => {
      // Pausing emits one last timeupdate, which would land after the new
      // sample has already reset the playhead and put the old position back
      // on screen. Detach the handlers first, then stop.
      a.onloadedmetadata = null;
      a.ontimeupdate = null;
      a.onended = null;
      a.pause();
      a.src = '';
    };
    // speed is applied separately so changing it never reloads the audio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample?.id]);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  React.useEffect(() => () => audioRef.current?.pause(), []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !sample) return;
    if (a.paused) {
      a.play().catch(() => setPlaying(false));
      setPlaying(true);
      track('preview_play', { lesson: sample.title, paper: sample.paper, speed });
    } else {
      a.pause();
      setPlaying(false);
      track('preview_pause', { lesson: sample.title, at: Math.round(a.currentTime) });
    }
  };

  const skip = (by: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + by));
    setT(a.currentTime);
    track('preview_skip', { by });
  };

  const pick = (i: number) => {
    if (i === active) return;
    setActive(i);
    track('preview_sample_selected', { sample: samples[i]?.title });
  };

  const setRate = (r: number) => {
    setSpeed(r);
    track('preview_speed_changed', { speed: r });
  };

  const progress = dur ? t / dur : 0;
  const currentIdx = React.useMemo(() => {
    if (!sample) return -1;
    let idx = -1;
    for (let i = 0; i < sample.marks.length; i++) {
      if (progress >= sample.marks[i]) idx = i;
    }
    // before playback begins nothing is lit; the transcript sits at 0:00
    return t > 0 ? idx : -1;
  }, [sample, progress, t]);

  // Follow the highlight so the live sentence never scrolls out of the pane.
  React.useEffect(() => {
    liveRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIdx]);

  if (!sample) return null;

  const nextRate = () => {
    const i = SPEEDS.indexOf(speed as typeof SPEEDS[number]);
    setRate(SPEEDS[(i + 1) % SPEEDS.length]);
  };

  return (
    <section style={s.section} aria-labelledby="mbp-heading">
      <h2 id="mbp-heading" style={s.h2}>Popular papers people are reading</h2>
      <p style={s.sub}>
        Instant interactive preview. Click play to sample a 1-minute brief.
      </p>

      <div style={s.tabs} role="tablist" aria-label="Sample briefs">
        {samples.map((sm, i) => (
          <button
            key={sm.id}
            role="tab"
            aria-selected={i === active}
            onClick={() => pick(i)}
            style={{ ...s.tab, ...(i === active ? s.tabOn : null) }}
            title={sm.paper}
          >
            {sm.paper}
          </button>
        ))}
      </div>

      <div className="mbp-panel" style={s.panel}>
        {/* ------------------------- player, on ink ------------------------ */}
        <div className="mbp-left" style={s.left}>
          <span style={s.badge}>
            <span style={s.badgeDot} aria-hidden="true" />
            1-MIN BRIEF
          </span>

          <h3 style={s.title}>{sample.title}</h3>
          <p style={s.meta}>{sample.paper}</p>

          <div style={s.controls}>
            <button type="button" onClick={toggle} style={s.playBtn}
                    aria-label={playing ? 'Pause preview' : 'Play preview'}>
              <span aria-hidden="true" style={{ fontSize: 12 }}>{playing ? '❚❚' : '▶'}</span>
              {playing ? 'Pause' : 'Play Preview'}
            </button>

            <button type="button" onClick={() => skip(-5)} style={s.round}
                    aria-label="Back 5 seconds">↺ 5</button>
            <button type="button" onClick={() => skip(5)} style={s.round}
                    aria-label="Forward 5 seconds">5 ↻</button>

            <button type="button" onClick={nextRate} style={s.speedBtn}
                    aria-label={`Playback speed ${rateLabel(speed)}, tap to change`}>
              {rateLabel(speed)}
            </button>
          </div>

          <Dashes progress={progress} playing={playing} />

          <input
            type="range" min={0} max={dur || 0} step={0.1} value={t}
            onChange={(e) => {
              const a = audioRef.current;
              if (a) { a.currentTime = Number(e.target.value); setT(a.currentTime); }
            }}
            aria-label="Seek"
            className="mbp-scrub"
            style={{ ...s.range, backgroundSize: `${progress * 100}% 100%` }}
          />
          <div style={s.times}>
            <span>{clock(t)}</span>
            <span>{clock(dur)}</span>
          </div>
        </div>

        {/* ------------------------ transcript, on paper ------------------- */}
        <div className="mbp-right" style={s.right}>
          <div style={s.rightHead}>
            <h4 style={s.rightTitle}>Synchronized Transcript</h4>
            <span style={s.sync}>
              <span style={s.syncDot} aria-hidden="true" />
              Beads Speech Sync
            </span>
          </div>

          <div className="mbp-transcript" style={s.transcript}>
            {sample.sentences.map((line, i) => {
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
        {finished && (
          <p style={s.ctaNote}>
            That was one brief from one document. Make them from yours.
          </p>
        )}
        <Link href="/start" style={s.ctaBtn}
              onClick={() => track('preview_cta_clicked', { lesson: sample.title })}>
          Turn Your Documents into Audio. Get Started Free
        </Link>
      </div>

      <style>{`
        @keyframes mbpPulse{0%,100%{opacity:.45}50%{opacity:1}}
        .mbp-scrub{-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;
          background:rgba(255,255,255,.18);background-image:linear-gradient(#fff,#fff);
          background-repeat:no-repeat;cursor:pointer;width:100%}
        .mbp-scrub::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;
          border-radius:50%;background:#fff;cursor:pointer}
        .mbp-scrub::-moz-range-thumb{width:14px;height:14px;border:0;border-radius:50%;
          background:#fff;cursor:pointer}
        /* Below a tablet each column gets about 165px, which makes the
           transcript unreadable. Stack them, player first. */
        @media (max-width: 860px){
          .mbp-panel{grid-template-columns:1fr !important}
          .mbp-transcript{max-height:200px}
        }
        @media (max-width: 460px){
          .mbp-left,.mbp-right{padding:22px 18px !important}
        }
      `}</style>
    </section>
  );
}

/** The dashed seek track behind the scrubber, lit up to the playhead. */
function Dashes({ progress, playing }: { progress: number; playing: boolean }) {
  const n = 44;
  return (
    <div style={s.dashes} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          style={{
            ...s.dash,
            background: i / n <= progress ? '#fff' : 'rgba(255,255,255,0.22)',
            animation: playing && i / n <= progress
              ? `mbpPulse 1.4s ${(i % 6) * 110}ms infinite ease-in-out`
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

/** 1 and 2 read as "1.0x" and "2.0x" in the design; the rest keep their decimals. */
function rateLabel(r: number) {
  return Number.isInteger(r) ? `${r.toFixed(1)}x` : `${r}x`;
}

const LINE = 'rgba(255,255,255,0.13)';

const s: Record<string, React.CSSProperties> = {
  section: { padding: '64px 0' },
  h2: {
    fontSize: 'clamp(28px, 3.6vw, 38px)', lineHeight: 1.12, margin: '0 0 10px',
    fontWeight: 700, letterSpacing: '-0.025em', color: '#fff',
  },
  sub: { fontSize: 16.5, color: 'rgba(255,255,255,0.5)', margin: '0 0 26px' },

  tabs: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  tab: {
    minHeight: 48, padding: '0 22px', borderRadius: 999, cursor: 'pointer',
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`,
    color: 'rgba(255,255,255,0.82)', fontSize: 15, maxWidth: 270,
    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
  },
  tabOn: { background: '#fff', color: '#0a0a0a', fontWeight: 600, borderColor: '#fff' },

  panel: {
    display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
    borderRadius: 22, overflow: 'hidden', border: `1px solid ${LINE}`,
  },
  left: { background: '#0b0b0b', padding: '30px 28px 34px', minWidth: 0 },

  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '7px 14px', borderRadius: 999, background: 'rgba(52,211,153,0.12)',
    color: '#34d399', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
    marginBottom: 20,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 999, background: '#34d399' },

  title: {
    fontSize: 'clamp(21px, 2.5vw, 27px)', lineHeight: 1.22, fontWeight: 700,
    letterSpacing: '-0.02em', color: '#fff', margin: '0 0 12px',
  },
  meta: { fontSize: 15, color: 'rgba(255,255,255,0.42)', margin: '0 0 30px' },

  controls: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  playBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 52,
    padding: '0 22px', borderRadius: 999, background: '#fff', color: '#0a0a0a',
    border: 0, fontSize: 15.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  round: {
    minWidth: 48, height: 48, borderRadius: 999, background: 'transparent',
    border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.8)',
    fontSize: 13, cursor: 'pointer', padding: '0 10px', whiteSpace: 'nowrap',
  },
  speedBtn: {
    minHeight: 44, padding: '0 16px', borderRadius: 999, background: 'transparent',
    border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.8)',
    fontSize: 14, cursor: 'pointer', marginLeft: 'auto', whiteSpace: 'nowrap',
  },

  dashes: {
    display: 'flex', alignItems: 'center', gap: 4, height: 18,
    margin: '34px 0 10px',
  },
  dash: { flex: 1, height: 3, borderRadius: 2, display: 'block' },

  range: { display: 'block', width: '100%', margin: 0 },
  times: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13.5, color: 'rgba(255,255,255,0.45)', marginTop: 10,
  },

  right: { background: '#fff', padding: '30px 32px', minWidth: 0 },
  rightHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 14, flexWrap: 'wrap',
    paddingBottom: 16, borderBottom: '1px solid #e8e8e8', marginBottom: 20,
  },
  rightTitle: { fontSize: 17, fontWeight: 700, color: '#141414', margin: 0 },
  sync: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    fontSize: 13.5, fontWeight: 600, color: '#ef4444',
  },
  syncDot: { width: 7, height: 7, borderRadius: 999, background: '#ef4444' },

  transcript: {
    fontSize: 16.5, lineHeight: 1.78, color: '#8b8b8b',
    maxHeight: 280, overflowY: 'auto',
  },
  sentence: { transition: 'background 140ms ease, color 140ms ease' },
  sentenceOn: {
    background: '#fde4b0', boxShadow: '0 0 0 3px #fde4b0', borderRadius: 3,
    color: '#141414', fontWeight: 600,
  },
  sentenceAhead: { color: '#a9a9a9' },

  ctaBar: {
    marginTop: 18, padding: '20px', borderRadius: 18,
    background: 'rgba(255,255,255,0.045)', border: `1px solid ${LINE}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  ctaNote: { margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  ctaBtn: {
    display: 'inline-flex', alignItems: 'center', minHeight: 52, padding: '0 28px',
    borderRadius: 999, background: '#fff', color: '#0a0a0a', fontSize: 16,
    fontWeight: 600, textDecoration: 'none', textAlign: 'center',
  },
};
