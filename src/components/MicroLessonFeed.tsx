'use client';

import * as React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/lib/player';
import { track } from '@/lib/analytics';
import { anonId } from '@/lib/identity';

/**
 * Micro-lesson feed.
 *
 * ElevenReader lists whole files under All / Text / Links / Files, so getting
 * to one idea means sitting through a document. These are the one-minute
 * lessons themselves, grouped by where they came from and by whether they have
 * been heard, with a queue so they can run back to back hands-free.
 */

type Lesson = {
  id: string;
  title: string;
  sourceTitle: string;
  documentId: string | null;
  audioUrl: string | null;
  isBook: boolean;
  clonedVoice: boolean;
};

const FILTERS = [
  { key: 'all', label: 'All Lessons' },
  { key: 'books', label: 'Books' },
  { key: 'docs', label: 'Custom Docs' },
  { key: 'unheard', label: 'Unheard' },
  { key: 'completed', label: 'Completed' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

/** Books read like books; everything else is a custom doc. */
function looksLikeBook(title: string) {
  const t = (title || '').toLowerCase();
  if (/\.(ppt|pptx|key|md|txt)$/.test(t)) return false;
  if (/(deck|slide|notes|report|findings|meeting|resume|cv)\b/.test(t)) return false;
  return /\.(pdf|epub)$/.test(t) || /(book|chapter|tantra|veda|sahasranama)/.test(t);
}

function artUrl(id: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/beads-assets/covers-lesson/${id}.png` : null;
}

export default function MicroLessonFeed({ userId }: { userId?: string | null }) {
  const player = usePlayer();
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterKey>('all');

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let q = supabase
          .from('beads')
          .select('id, title, audio_url, document_id, profile_id, created_at, documents!inner(title, user_id, anon_id)')
          .order('created_at', { ascending: false })
          .limit(400);
        q = userId ? q.eq('documents.user_id', userId) : q.eq('documents.anon_id', anonId());

        const { data } = await q;
        const mapped: Lesson[] = (data ?? []).map((b: any) => ({
          id: b.id,
          title: b.title,
          sourceTitle: b.documents?.title ?? 'Your upload',
          documentId: b.document_id ?? null,
          audioUrl: b.audio_url,
          isBook: looksLikeBook(b.documents?.title ?? ''),
          clonedVoice: !!b.profile_id,
        }));
        if (alive) setLessons(mapped);
      } catch {
        if (alive) setLessons([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const shown = React.useMemo(() => {
    switch (filter) {
      case 'books':
        return lessons.filter((l) => l.isBook);
      case 'docs':
        return lessons.filter((l) => !l.isBook);
      case 'unheard':
        return lessons.filter((l) => !player.completed.has(l.id));
      case 'completed':
        return lessons.filter((l) => player.completed.has(l.id));
      default:
        return lessons;
    }
  }, [lessons, filter, player.completed]);

  const toTrack = (l: Lesson) => ({
    id: l.id,
    title: l.title,
    sourceTitle: l.sourceTitle,
    audioUrl: l.audioUrl!,
  });

  return (
    <section className="w-full text-white">
      <h2 className="mb-5 text-[28px] font-semibold tracking-tight">Your Micro-Lessons</h2>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFilter(f.key);
              track('lesson_filter_changed', { filter: f.key });
            }}
            aria-pressed={filter === f.key}
            className={`min-h-[38px] rounded-full border px-4 text-[13.5px] transition ${
              filter === f.key
                ? 'border-white bg-white font-semibold text-black'
                : 'border-white/20 bg-transparent text-white/80 hover:border-white/45 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3" aria-hidden="true">
              <div className="mb-3 aspect-square w-full animate-pulse rounded-xl bg-white/[0.07]" />
              <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-white/[0.07]" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-white/[0.07]" />
            </div>
          ))}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center">
          <p className="mb-2 text-[16px] text-white/70">
            {lessons.length === 0
              ? 'Upload a book or document to synthesize your first 1-minute lesson.'
              : 'No micro-lessons found for this category.'}
          </p>
          {lessons.length === 0 && (
            <Link
              href="/start"
              className="mt-4 inline-flex min-h-[46px] items-center rounded-full bg-white px-6 text-[14.5px] font-semibold text-black no-underline"
            >
              Upload a book
            </Link>
          )}
        </div>
      )}

      {!loading && shown.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((l) => (
            <LessonCard
              key={l.id}
              lesson={l}
              isCurrent={player.track?.id === l.id}
              isPlaying={player.track?.id === l.id && player.playing}
              isCompleted={player.completed.has(l.id)}
              inQueue={player.queue.some((q) => q.id === l.id)}
              onPlay={() => {
                if (!l.audioUrl) return;
                if (player.track?.id === l.id) player.toggle();
                else {
                  player.play(toTrack(l));
                  track('lesson_played', { from: 'feed', source: l.sourceTitle });
                }
              }}
              onQueue={() => {
                if (!l.audioUrl) return;
                player.enqueue(toTrack(l));
                track('lesson_queued', { source: l.sourceTitle });
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function LessonCard({
  lesson,
  isCurrent,
  isPlaying,
  isCompleted,
  inQueue,
  onPlay,
  onQueue,
}: {
  lesson: Lesson;
  isCurrent: boolean;
  isPlaying: boolean;
  isCompleted: boolean;
  inQueue: boolean;
  onPlay: () => void;
  onQueue: () => void;
}) {
  const [artFailed, setArtFailed] = React.useState(false);
  const art = artUrl(lesson.id);

  return (
    <article
      className={`flex flex-col rounded-2xl border p-3 transition ${
        isCurrent ? 'border-white bg-white/[0.08]' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
      }`}
    >
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl bg-white/[0.06]">
        {art && !artFailed && (
          <img
            src={art}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setArtFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-[10.5px] font-semibold text-white">
          1 Min Audio
        </span>

        {isCompleted && (
          <span className="absolute right-2 top-2 rounded-full bg-emerald-400/90 px-2.5 py-1 text-[10.5px] font-semibold text-black">
            Completed
          </span>
        )}
        {!isCompleted && isCurrent && !isPlaying && (
          <span className="absolute right-2 top-2 rounded-full bg-white/85 px-2.5 py-1 text-[10.5px] font-semibold text-black">
            Paused
          </span>
        )}

        {lesson.clonedVoice && (
          <span className="absolute bottom-2 left-2 rounded-full bg-indigo-400/90 px-2.5 py-1 text-[10.5px] font-semibold text-black">
            Voice Clone
          </span>
        )}
      </div>

      <div className="mb-1 truncate text-[12.5px] text-white/50">{lesson.sourceTitle}</div>
      <h3 className="mb-3 line-clamp-2 text-[15.5px] font-semibold leading-snug">{lesson.title}</h3>

      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onPlay}
          disabled={!lesson.audioUrl}
          aria-label={isPlaying ? `Pause ${lesson.title}` : `Play ${lesson.title}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition disabled:opacity-30"
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        {isPlaying ? (
          <span className="flex flex-1 items-end gap-[3px] px-1" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
              <span
                key={i}
                className="mlf-wave w-[3px] rounded-full bg-white/80"
                style={{ animationDelay: `${i * 90}ms` }}
              />
            ))}
          </span>
        ) : (
          <button
            type="button"
            onClick={onQueue}
            disabled={!lesson.audioUrl || inQueue}
            className="flex-1 rounded-full border border-white/20 bg-transparent px-3 py-2 text-[12.5px] text-white/85 transition hover:border-white/50 disabled:opacity-40"
          >
            {inQueue ? 'In Up Next' : 'Add to Up Next'}
          </button>
        )}
      </div>
    </article>
  );
}
