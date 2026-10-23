'use client';

import * as React from 'react';
import { track } from '@/lib/analytics';
import { type } from '@/lib/type';

/**
 * The voice labels on the home page, each with a two-second sample.
 *
 * Samples come from the same /voices list the voice picker uses, taking the
 * first publishing-safe voice carrying each tag. If the list cannot be loaded
 * the labels still show, just without a play button, rather than inventing
 * a sample that is not one of the real voices.
 */

const LABELS = ['Warm', 'Deep', 'Bright', 'Energetic'] as const;
const SAMPLE_MS = 2000;

type Voice = { name: string; tags?: string[]; preview_url?: string | null; policy_safe?: boolean };

export default function VoiceSamples({ itemStyle }: { itemStyle: React.CSSProperties }) {
  const [samples, setSamples] = React.useState<Record<string, string>>({});
  const [playing, setPlaying] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const api = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!api) return;
    let alive = true;
    fetch(`${api.replace(/\/$/, '')}/voices`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: unknown) => {
        if (!alive || !Array.isArray(list)) return;
        const found: Record<string, string> = {};
        for (const label of LABELS) {
          const v = (list as Voice[]).find((x) => x.policy_safe && x.preview_url
            && (x.tags ?? []).some((t) => t.toLowerCase() === label.toLowerCase()));
          if (v?.preview_url) found[label] = v.preview_url;
        }
        setSamples(found);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const stop = React.useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setPlaying(null);
  }, []);

  React.useEffect(() => stop, [stop]);

  const play = (label: string) => {
    if (playing === label) { stop(); return; }
    stop();
    const a = new Audio(samples[label]);
    audioRef.current = a;
    a.play().catch(() => stop());
    timerRef.current = window.setTimeout(stop, SAMPLE_MS);
    setPlaying(label);
    track('home_voice_sampled', { voice: label });
  };

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '26px 0 0' }}>
      {LABELS.map((label) => (
        <li key={label} style={{ ...itemStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>{label}</span>
          {samples[label] && (
            <button type="button" onClick={() => play(label)} style={s.btn}
                    aria-label={playing === label ? `Stop ${label} sample` : `Play a 2 second ${label} sample`}>
              <span aria-hidden="true">{playing === label ? '❚❚' : '▶'}</span>
              {playing === label ? 'Playing' : 'Hear it'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

const s: Record<string, React.CSSProperties> = {
  btn: {
    ...type.calloutStrong, display: 'inline-flex', alignItems: 'center', gap: 8,
    minHeight: 36, padding: '0 14px', borderRadius: 999, cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#fff',
  },
};
