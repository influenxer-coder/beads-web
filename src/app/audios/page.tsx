'use client';

import * as React from 'react';
import Link from 'next/link';
import JSZip from 'jszip';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/lib/player';
import { track } from '@/lib/analytics';
import Wordmark from '@/components/Wordmark';

/**
 * Every lesson with audio, flat and newest first.
 *
 * The library groups by source, which is right for studying. This is the
 * publishing view: one row per episode, its art, and the bundle to ship it.
 */

type Row = {
  id: string;
  title: string;
  description: string | null;
  script: string | null;
  audioUrl: string;
  sourceTitle: string;
  citedTo: string | null;
  createdAt: string | null;
};

function artUrl(beadId: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/beads-assets/covers-lesson/${beadId}.png` : null;
}

export default function AudiosPage() {
  const player = usePlayer();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('beads')
          .select('id, title, description, script_text, audio_url, order_index, created_at, documents(title)')
          .not('audio_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500);

        const mapped: Row[] = (data ?? []).map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description ?? null,
          script: b.script_text ?? null,
          audioUrl: b.audio_url,
          sourceTitle: b.documents?.title ?? 'Your upload',
          citedTo: b.order_index != null ? `section ${b.order_index}` : null,
          createdAt: b.created_at,
        }));
        if (alive) setRows(mapped);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const shown = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) || r.sourceTitle.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] pb-40 text-white">
      <header className="sticky top-0 z-[500] border-b border-white/10 bg-[#0A0A0A]/92 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-3">
          <Link href="/" className="text-white no-underline">
            <Wordmark />
          </Link>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search audios"
            aria-label="Search audios"
            className="h-10 flex-1 rounded-full border border-white/12 bg-white/[0.04] px-4 text-[14.5px] text-white outline-none placeholder:text-white/35 focus:border-white/35"
          />
          <Link
            href="/start"
            className="flex h-10 items-center rounded-full bg-white px-4 text-[14px] font-semibold text-black no-underline"
          >
            New
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 pt-7">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">All audios</h1>
        <p className="mb-7 text-[15px] text-white/50">
          {loading ? 'Loading' : `${shown.length} ready to publish`}
        </p>

        {!loading && shown.length === 0 && (
          <div className="py-16 text-center">
            <p className="mb-2 text-[18px] font-semibold">Nothing here yet</p>
            <p className="mb-6 text-[15px] text-white/50">Turn a reading into audio to get started.</p>
            <Link
              href="/start"
              className="inline-flex min-h-[48px] items-center rounded-full bg-white px-7 text-[15px] font-semibold text-black no-underline"
            >
              Upload a file
            </Link>
          </div>
        )}

        <ul className="m-0 list-none space-y-3 p-0">
          {shown.map((row) => (
            <AudioRow key={row.id} row={row} player={player} />
          ))}
        </ul>
      </div>
    </main>
  );
}

function AudioRow({ row, player }: { row: Row; player: ReturnType<typeof usePlayer> }) {
  const [state, setState] = React.useState<'idle' | 'working' | 'failed'>('idle');
  const [artFailed, setArtFailed] = React.useState(false);
  const isCurrent = player.track?.id === row.id;
  const art = artUrl(row.id);

  const download = async () => {
    if (state === 'working') return;
    setState('working');
    track('episode_downloaded', { from: 'audios' });
    try {
      const slug =
        row.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60).toLowerCase() ||
        'lesson';

      const zip = new JSZip();
      const folder = zip.folder(slug)!;

      const audio = await fetch(row.audioUrl);
      if (!audio.ok) throw new Error('audio');
      const ext = (row.audioUrl.split('?')[0].match(/\.(\w{3,4})$/)?.[1] ?? 'mp3').toLowerCase();
      folder.file(`audio.${ext}`, await audio.blob());

      if (art) {
        const cover = await fetch(art);
        if (cover.ok) folder.file('cover-1400.png', await cover.blob());
      }

      const shortTitle = row.title.length > 20 ? `${row.title.slice(0, 19).trimEnd()}…` : row.title;
      folder.file(
        'episode.txt',
        [
          'TITLE',
          row.title,
          '',
          'SHORT TITLE (Spotify truncates around 20 characters)',
          shortTitle,
          '',
          'DESCRIPTION',
          row.description?.trim() || row.script?.trim().slice(0, 600) || '',
          '',
          `Source: ${row.sourceTitle}${row.citedTo ? ` · ${row.citedTo}` : ''}`,
          '',
          'Made with Beads',
        ].join('\n'),
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${slug}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      setState('idle');
    } catch {
      setState('failed');
      setTimeout(() => setState('idle'), 2500);
    }
  };

  return (
    <li className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <button
        type="button"
        onClick={() =>
          isCurrent
            ? player.toggle()
            : player.play({
                id: row.id,
                title: row.title,
                sourceTitle: row.sourceTitle,
                audioUrl: row.audioUrl,
              })
        }
        aria-label={isCurrent && player.playing ? `Pause ${row.title}` : `Play ${row.title}`}
        className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-white/12 bg-white/[0.06] p-0"
      >
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
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[13px]">
          {isCurrent && player.playing ? '❚❚' : '▶'}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[15.5px] font-semibold">{row.title}</div>
        <div className="mt-0.5 truncate text-[13.5px] text-white/50">
          {row.sourceTitle}
          {row.citedTo ? ` · ${row.citedTo}` : ''}
        </div>
      </div>

      <button
        type="button"
        onClick={download}
        title="Audio, cover and episode text"
        className="shrink-0 rounded-full border border-white/22 bg-transparent px-3.5 py-1.5 text-[12.5px] text-white/85 transition hover:border-white/50"
      >
        {state === 'working' ? 'Packing…' : state === 'failed' ? 'Failed' : 'Download'}
      </button>
    </li>
  );
}
