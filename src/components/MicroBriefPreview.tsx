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
  const [speedOpen, setSpeedOpen] = React.useState(false);
  const [t, setT] = React.useState(0);
  const [dur, setDur] = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
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
      a.pause();
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
    setSpeedOpen(false);
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

  if (!sample) return null;

  return (
    <section style={s.section}>
      <h2 style={s.h2}>Sample a 1-Minute Micro-Brief</h2>
      <p style={s.sub}>
        Listen to how Beads condenses a dense document into a short audio brief
        for your commute. No account needed.
      </p>

      <div style={s.tabs} role="tablist" aria-label="Sample briefs">
        {samples.map((sm, i) => (
          <button
            key={sm.id}
            role="tab"
            aria-selected={i === active}
            onClick={() => pick(i)}
            style={{ ...s.tab, ...(i === active ? s.tabOn : null) }}
          >
            {sm.paper}
          </button>
        ))}
      </div>

      <div style={s.panel}>
        <div style={s.left}>
          <h3 style={s.panelTitle}>Audio Preview: {sm_title(sample)}</h3>

          <div style={s.controls}>
            <button type="button" onClick={toggle} style={s.playBtn}
                    aria-label={playing ? 'Pause preview' : 'Play preview'}>
              <span aria-hidden="true" style={{ fontSize: 13 }}>{playing ? '❚❚' : '▶'}</span>
              {playing ? 'Pause' : 'Play Preview'}
            </button>

            <button type="button" onClick={() => skip(-15)} style={s.round} aria-label="Back 15 seconds">
              ↺
            </button>
            <button type="button" onClick={() => skip(15)} style={s.round} aria-label="Forward 15 seconds">
              ↻
            </button>

            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setSpeedOpen((o) => !o)}
                      style={s.speed} aria-haspopup="listbox" aria-expanded={speedOpen}>
                {rateLabel(speed)} ⌄
              </button>
              {speedOpen && (
                <ul style={s.speedMenu} role="listbox">
                  {SPEEDS.map((r) => (
                    <li key={r}>
                      <button type="button" onClick={() => setRate(r)}
                              style={{ ...s.speedItem, ...(r === speed ? s.speedItemOn : null) }}
                              role="option" aria-selected={r === speed}>
                        {r}x
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <span style={s.wave} aria-hidden="true">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    ...s.waveBar,
                    height: playing ? undefined : 6,
                    animation: playing ? `mbpWave 900ms ${i * 60}ms infinite ease-in-out` : 'none',
                  }}
                />
              ))}
            </span>
          </div>

          <input
            type="range" min={0} max={dur || 0} step={0.1} value={t}
            onChange={(e) => {
              const a = audioRef.current;
              if (a) { a.currentTime = Number(e.target.value); setT(a.currentTime); }
            }}
            aria-label="Seek"
            style={s.range}
          />
          <div style={s.times}>
            <span>{clock(t)}</span>
            <span>{clock(t)} / {clock(dur)}</span>
          </div>
        </div>

        <div style={s.right}>
          <h3 style={s.panelTitle}>Synchronized Transcript</h3>
          <div style={s.transcript}>
            {sample.sentences.map((line, i) => {
              const state =
                i === currentIdx ? 'on' : i < currentIdx ? 'done' : 'ahead';
              return (
                <span key={i} style={{
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
          Turn Your Documents into Audio — Get Started Free
        </Link>
      </div>

      <style>{`@keyframes mbpWave{0%,100%{height:6px}50%{height:22px}}`}</style>
    </section>
  );
}

/** 1 and 2 read as "1.0x" and "2.0x" in the design; the rest keep their decimals. */
function rateLabel(r: number) {
  return Number.isInteger(r) ? `${r.toFixed(1)}x` : `${r}x`;
}

function sm_title(s: Sample) {
  return s.title.length > 58 ? `${s.title.slice(0, 57)}…` : s.title;
}

const s: Record<string, React.CSSProperties> = {
  section: { padding: '64px 0' },
  h2: { fontSize: 34, lineHeight: 1.15, margin: '0 0 10px', fontWeight: 600 },
  sub: { fontSize: 17, lineHeight: 1.6, color: '#3c3c3c', margin: '0 0 26px', maxWidth: 620 },

  tabs: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 },
  tab: {
    minHeight: 44, padding: '0 18px', borderRadius: 10, cursor: 'pointer',
    background: '#fff', border: '1px solid #ddd7cd', color: '#2a2a2a',
    fontSize: 14.5, maxWidth: 260, overflow: 'hidden', whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  tabOn: { border: '1.5px solid #141414', background: '#f6f4ef', fontWeight: 600 },

  panel: {
    display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)',
    border: '1px solid #e6e2da', borderRadius: 14, overflow: 'hidden', background: '#fff',
  },
  left: { padding: 22, borderRight: '1px solid #e6e2da', minWidth: 0 },
  right: { padding: 22, minWidth: 0, background: '#fcfbf8' },
  panelTitle: { fontSize: 16.5, fontWeight: 600, margin: '0 0 16px', color: '#141414' },

  controls: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 },
  playBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 46,
    padding: '0 20px', borderRadius: 999, background: '#141414', color: '#fff',
    border: 0, fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  round: {
    width: 40, height: 40, borderRadius: 999, background: '#fff',
    border: '1px solid #ddd7cd', color: '#3a3a3a', fontSize: 16, cursor: 'pointer',
  },
  speed: {
    minHeight: 40, padding: '0 14px', borderRadius: 10, background: '#fff',
    border: '1px solid #ddd7cd', fontSize: 14.5, cursor: 'pointer', color: '#2a2a2a',
  },
  speedMenu: {
    position: 'absolute', top: 46, left: 0, zIndex: 20, listStyle: 'none',
    margin: 0, padding: 6, background: '#fff', border: '1px solid #ddd7cd',
    borderRadius: 10, minWidth: 104, boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
  },
  speedItem: {
    width: '100%', textAlign: 'left', minHeight: 38, padding: '0 12px',
    background: 'transparent', border: 0, borderRadius: 8, fontSize: 14.5,
    cursor: 'pointer', color: '#2a2a2a',
  },
  speedItemOn: { background: '#f0ede6', fontWeight: 600 },

  wave: { display: 'inline-flex', alignItems: 'center', gap: 3, height: 24, marginLeft: 2 },
  waveBar: { width: 3, borderRadius: 2, background: '#141414', display: 'block' },

  range: { display: 'block', width: '100%', accentColor: '#141414' },
  times: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13, color: '#7b756c', marginTop: 8,
  },

  transcript: { fontSize: 16, lineHeight: 1.72, color: '#2a2a2a', maxHeight: 220, overflowY: 'auto' },
  sentence: { transition: 'background 140ms ease, color 140ms ease' },
  sentenceOn: { background: '#e7e2d5', boxShadow: '0 0 0 3px #e7e2d5', borderRadius: 3, color: '#141414' },
  sentenceAhead: { color: '#a9a399' },

  ctaBar: {
    marginTop: 18, padding: '18px 20px', borderRadius: 14, background: '#f4f2ec',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  ctaNote: { margin: 0, fontSize: 15, color: '#3c3c3c', textAlign: 'center' },
  ctaBtn: {
    display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 26px',
    borderRadius: 999, background: '#141414', color: '#fff', fontSize: 15.5,
    fontWeight: 600, textDecoration: 'none', textAlign: 'center',
  },
};
