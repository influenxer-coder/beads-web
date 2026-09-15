'use client';

import * as React from 'react';
import { Search, Play, Pause, ShieldCheck, ShieldAlert, Loader2, X } from 'lucide-react';
import { track } from '@/lib/analytics';

/**
 * Voice picker with policy labelling.
 *
 * The badge is the point. ElevenLabs premade voices are licensed for
 * commercial use and safe to publish; voices cloned from a real person are
 * not, however good they sound. Publishing under our own show makes that
 * distinction consequential, so it is on the card rather than buried.
 */

export type Voice = {
  id: string;
  provider: 'elevenlabs' | 'beads';
  name: string;
  tags: string[];
  category: string;
  preview_url?: string | null;
  policy_safe: boolean;
  reason?: string | null;
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'narrative', label: 'Narrative' },
  { key: 'energetic', label: 'Energetic' },
  { key: 'calm', label: 'Calm' },
  { key: 'conversational', label: 'Conversational' },
];

/** Words that place a voice in a category when the API does not. */
const BUCKETS: Record<string, string[]> = {
  narrative: ['narrat', 'story', 'audiobook', 'documentary'],
  energetic: ['energetic', 'enthusias', 'upbeat', 'excit', 'fierce', 'quirky'],
  calm: ['calm', 'relaxed', 'soothing', 'gentle', 'warm', 'reassuring', 'mature'],
  conversational: ['conversational', 'casual', 'social', 'natural', 'laid-back'],
};

function inBucket(v: Voice, bucket: string) {
  if (bucket === 'all') return true;
  const hay = `${v.category} ${v.tags.join(' ')}`.toLowerCase();
  return (BUCKETS[bucket] ?? []).some((w) => hay.includes(w));
}

/** Deterministic avatar, so a voice always looks the same. */
function avatarTone(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) % 360;
  return h;
}

export default function VoicePicker({
  onSelect,
  selectedId,
  policySafeOnly = false,
}: {
  /** Receives the provider's voice id, ready to pass to TTS. */
  onSelect: (voice: Voice) => void;
  selectedId?: string | null;
  /** Hide anything that cannot be published. */
  policySafeOnly?: boolean;
}) {
  const [voices, setVoices] = React.useState<Voice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [playing, setPlaying] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/voices');
        const d = await r.json();
        if (alive) setVoices(d?.voices ?? []);
      } catch {
        if (alive) setVoices([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      audioRef.current?.pause();
    };
  }, []);

  const shown = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return voices
      .filter((v) => (policySafeOnly ? v.policy_safe : true))
      .filter((v) => inBucket(v, filter))
      .filter(
        (v) =>
          !needle ||
          v.name.toLowerCase().includes(needle) ||
          v.tags.join(' ').toLowerCase().includes(needle),
      );
  }, [voices, q, filter, policySafeOnly]);

  const preview = (v: Voice) => {
    audioRef.current?.pause();
    if (playing === v.id) {
      setPlaying(null);
      return;
    }
    if (!v.preview_url) return;
    const a = new Audio(v.preview_url);
    audioRef.current = a;
    a.onended = () => setPlaying(null);
    a.play().then(() => setPlaying(v.id)).catch(() => setPlaying(null));
    track('voice_previewed', { voice: v.name, provider: v.provider });
  };

  return (
    <div className="w-full text-white">
      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search voices"
          aria-label="Search voices"
          className="h-12 w-full rounded-full border border-white/15 bg-white/[0.04] pl-11 pr-11 text-[15px] text-white outline-none placeholder:text-white/35 focus:border-white/35"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/45 hover:text-white"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`min-h-[36px] rounded-full border px-4 text-[13.5px] transition ${
              filter === f.key
                ? 'border-white bg-white text-black font-semibold'
                : 'border-white/18 text-white/75 hover:border-white/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-10 text-white/50">
          <Loader2 size={17} className="animate-spin" />
          Loading voices
        </div>
      )}

      {!loading && shown.length === 0 && (
        <p className="py-10 text-center text-[15px] text-white/50">No voices match that.</p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((v) => {
          const selected = selectedId === v.id;
          const tone = avatarTone(v.id);
          return (
            <div
              key={v.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => onSelect(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(v);
                }
              }}
              className={`cursor-pointer rounded-2xl border p-4 transition ${
                selected
                  ? 'border-white bg-white/[0.09]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[17px] font-bold text-white/90"
                  style={{
                    background: `linear-gradient(145deg, hsl(${tone} 45% 42%), hsl(${(tone + 48) % 360} 42% 24%))`,
                  }}
                >
                  {v.name.slice(0, 1).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15.5px] font-semibold">{v.name}</span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {v.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/14 px-2 py-0.5 text-[11px] text-white/55"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    preview(v);
                  }}
                  disabled={!v.preview_url}
                  aria-label={playing === v.id ? `Stop ${v.name}` : `Play a sample of ${v.name}`}
                  title={v.preview_url ? 'Hear a sample' : 'No sample available'}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/50 disabled:opacity-30"
                >
                  {playing === v.id ? <Pause size={15} /> : <Play size={15} />}
                </button>
              </div>

              {/* Policy */}
              <div className="mt-3.5 flex items-center gap-2 border-t border-white/8 pt-3">
                {v.policy_safe ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-1 text-[11.5px] text-emerald-300">
                    <ShieldCheck size={12} />
                    Policy safe
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-[11.5px] text-amber-300"
                    title={v.reason ?? 'Not cleared for publishing'}
                  >
                    <ShieldAlert size={12} />
                    Not for publishing
                  </span>
                )}
                <span className="ml-auto text-[11px] uppercase tracking-wider text-white/30">
                  {v.provider === 'elevenlabs' ? 'ElevenLabs' : 'Beads'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
