'use client';

import * as React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/lib/player';
import { fmtTime } from '@/components/onboarding/ui';

/**
 * Signed-in home: the person's lessons.
 *
 * Three states, as in the reference: empty (guides the first upload), a
 * populated list, and playing, where the docked mini-player is supplied by
 * PlayerProvider in the root layout.
 *
 * The list windows itself rather than rendering every row, so a library of a
 * few thousand lessons stays responsive without pulling in a virtualiser.
 */

type Row = {
  id: string;
  documentId: string | null;
  title: string;
  sourceTitle: string;
  audioUrl: string | null;
  citedTo: string | null;
  durationSec: number | null;
  createdAt: string | null;
};

const ROW_H = 92;
const OVERSCAN = 6;

export default function LibraryHome({ email }: { email?: string | null }) {
  const player = usePlayer();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('beads')
          .select('id, title, audio_url, order_index, created_at, document_id, documents(title)')
          .order('created_at', { ascending: false })
          .limit(500);

        const mapped: Row[] = (data ?? []).map((b: any) => ({
          id: b.id,
          documentId: b.document_id ?? null,
          title: b.title,
          sourceTitle: b.documents?.title ?? 'Your upload',
          audioUrl: b.audio_url,
          citedTo: b.order_index != null ? `section ${b.order_index}` : null,
          durationSec: null,
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

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) || r.sourceTitle.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const playable = filtered.filter((r) => r.audioUrl);
  const continueRow = rows.find((r) => r.audioUrl) ?? null;

  return (
    <div style={styles.page}>
      <TopBar email={email} menuOpen={menuOpen} setMenuOpen={setMenuOpen} q={q} setQ={setQ} />

      <div style={styles.inner}>
        <NewLessonCard />

        {!loading && continueRow && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Continue listening</h2>
            <ContinueCard row={continueRow} />
          </section>
        )}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Your lessons{!loading && filtered.length ? ` (${filtered.length})` : ''}
          </h2>

          {loading && <SkeletonList />}

          {!loading && filtered.length === 0 && <EmptyState searching={!!q.trim()} />}

          {!loading && filtered.length > 0 && <VirtualList rows={filtered} />}
        </section>
      </div>
    </div>
  );

  /* --------------------------------- parts -------------------------------- */

  function ContinueCard({ row }: { row: Row }) {
    const isCurrent = player.track?.id === row.id;
    return (
      <div style={styles.continueCard}>
        <button
          type="button"
          onClick={() => (isCurrent ? player.toggle() : startRow(row))}
          style={styles.bigPlay}
          aria-label={isCurrent && player.playing ? 'Pause' : 'Play'}
        >
          {isCurrent && player.playing ? <Pause /> : <Play />}
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={styles.continueTitle}>{row.title}</div>
          <div style={styles.rowMeta}>{row.sourceTitle}</div>
        </div>
      </div>
    );
  }

  function VirtualList({ rows: list }: { rows: Row[] }) {
    const [scrollTop, setScrollTop] = React.useState(0);
    const [height, setHeight] = React.useState(800);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const onScroll = () => setScrollTop(window.scrollY);
      const onResize = () => setHeight(window.innerHeight);
      onResize();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
      };
    }, []);

    const top = ref.current?.offsetTop ?? 0;
    const first = Math.max(0, Math.floor((scrollTop - top) / ROW_H) - OVERSCAN);
    const visible = Math.ceil(height / ROW_H) + OVERSCAN * 2;
    const slice = list.slice(first, first + visible);

    return (
      <div ref={ref} style={{ height: list.length * ROW_H, position: 'relative' }}>
        {slice.map((row, i) => (
          <div
            key={row.id}
            style={{
              position: 'absolute',
              top: (first + i) * ROW_H,
              left: 0,
              right: 0,
              height: ROW_H,
            }}
          >
            <LessonRow row={row} />
          </div>
        ))}
      </div>
    );
  }

  function LessonRow({ row }: { row: Row }) {
    const isCurrent = player.track?.id === row.id;
    return (
      <article style={{ ...styles.row, borderColor: isCurrent ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.09)' }}>
        <button
          type="button"
          disabled={!row.audioUrl}
          onClick={() => (isCurrent ? player.toggle() : startRow(row))}
          style={{ ...styles.rowPlay, opacity: row.audioUrl ? 1 : 0.35 }}
          aria-label={isCurrent && player.playing ? `Pause ${row.title}` : `Play ${row.title}`}
        >
          {isCurrent && player.playing ? <Pause small /> : <Play small />}
        </button>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={styles.rowTitle}>{row.title}</div>
          <div style={styles.rowMeta}>
            <span>{row.sourceTitle}</span>
            {row.durationSec ? <> · <span>{fmtTime(row.durationSec)}</span></> : null}
          </div>
          <div style={styles.rowChips}>
            {row.citedTo && <span style={styles.chip}>cited to {row.citedTo}</span>}
            {!row.audioUrl && <span style={styles.chipMuted}>no audio yet</span>}
            {row.documentId && (
              <Link href={`/studio/${row.documentId}`} style={styles.chipLink} onClick={(e) => e.stopPropagation()}>
                Studio
              </Link>
            )}
          </div>
        </div>
      </article>
    );
  }

  function startRow(row: Row) {
    if (!row.audioUrl) return;
    player.play({
      id: row.id,
      title: row.title,
      sourceTitle: row.sourceTitle,
      audioUrl: row.audioUrl,
    });
  }
}

/* -------------------------------- chrome --------------------------------- */

function TopBar({
  email,
  menuOpen,
  setMenuOpen,
  q,
  setQ,
}: {
  email?: string | null;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  q: string;
  setQ: (v: string) => void;
}) {
  return (
    <header style={styles.topbar}>
      <div style={styles.topbarInner}>
        <Link href="/" style={styles.logo}>
          Beads
        </Link>

        <div style={styles.searchWrap}>
          <SearchIcon />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your lessons"
            aria-label="Search your lessons"
            style={styles.search}
          />
        </div>

        <div style={styles.topbarRight}>
          <Link href="/start" style={styles.newBtn}>
            <Plus />
            <span style={styles.newBtnLabel}>New lesson</span>
          </Link>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              style={styles.avatar}
              aria-label="Account"
              aria-expanded={menuOpen}
            >
              {(email ?? '?').slice(0, 1).toUpperCase()}
            </button>
            {menuOpen && (
              <div style={styles.menu} role="menu">
                <div style={styles.menuEmail}>{email}</div>
                <button
                  type="button"
                  style={styles.menuItem}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.reload();
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NewLessonCard() {
  return (
    <Link href="/start" style={styles.newCard}>
      <div style={styles.newCardIcon}>
        <Upload />
      </div>
      <div>
        <div style={styles.newCardTitle}>New lesson</div>
        <div style={styles.newCardSub}>Upload a reading and hear it in about a minute.</div>
      </div>
    </Link>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  if (searching) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyTitle}>Nothing matches that.</p>
        <p style={styles.emptySub}>Try another word, or clear the search.</p>
      </div>
    );
  }
  return (
    <div style={styles.empty}>
      <div style={styles.emptyMark}>
        <Upload />
      </div>
      <p style={styles.emptyTitle}>Upload your first reading</p>
      <p style={styles.emptySub}>Hear it in a minute. No account needed to try.</p>
      <Link href="/start" style={styles.emptyCta}>
        Upload a file
      </Link>
    </div>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ ...styles.row, height: 76 }} aria-hidden="true">
          <div style={{ ...styles.rowPlay, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 13, width: '52%', borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ height: 11, width: '30%', borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginTop: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- icons --------------------------------- */

const Play = ({ small }: { small?: boolean }) => (
  <svg width={small ? 15 : 21} height={small ? 15 : 21} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13a.6.6 0 0 0 .9.5l10-6.5a.6.6 0 0 0 0-1l-10-6.5a.6.6 0 0 0-.9.5z" />
  </svg>
);
const Pause = ({ small }: { small?: boolean }) => (
  <svg width={small ? 14 : 19} height={small ? 14 : 19} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </svg>
);
const Plus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const Upload = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ opacity: 0.5, flexShrink: 0 }}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/* --------------------------------- styles -------------------------------- */

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0A0A0A', color: '#fff', paddingBottom: 140 },
  topbar: {
    position: 'sticky',
    top: 0,
    zIndex: 500,
    background: 'rgba(10,10,10,0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  topbarInner: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  logo: { fontSize: 19, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', textDecoration: 'none', flexShrink: 0 },
  searchWrap: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '0 14px',
    minHeight: 42,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
  },
  search: { flex: 1, minWidth: 0, background: 'transparent', border: 0, color: '#fff', fontSize: 14.5, outline: 'none' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  newBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    minHeight: 42,
    padding: '0 16px',
    borderRadius: 999,
    background: '#fff',
    color: '#000',
    fontSize: 14.5,
    fontWeight: 600,
    textDecoration: 'none',
  },
  newBtnLabel: { whiteSpace: 'nowrap' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.07)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 50,
    minWidth: 210,
    background: '#131313',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: 8,
    boxShadow: '0 14px 40px rgba(0,0,0,0.6)',
  },
  menuEmail: { fontSize: 13, color: 'rgba(255,255,255,0.5)', padding: '8px 10px', wordBreak: 'break-all' },
  menuItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    minHeight: 40,
    padding: '0 10px',
    background: 'none',
    border: 0,
    borderRadius: 8,
    color: '#fff',
    fontSize: 14.5,
    cursor: 'pointer',
  },
  inner: { maxWidth: 900, margin: '0 auto', padding: '26px 20px 0' },
  newCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 22px',
    borderRadius: 16,
    border: '1.5px dashed rgba(255,255,255,0.22)',
    color: '#fff',
    textDecoration: 'none',
  },
  newCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.09)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  newCardTitle: { fontSize: 16.5, fontWeight: 600 },
  newCardSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  section: { marginTop: 34 },
  sectionTitle: { fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: '0 0 14px' },
  continueCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '18px 20px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  continueTitle: { fontSize: 16.5, fontWeight: 600, lineHeight: 1.3 },
  bigPlay: {
    width: 52,
    height: 52,
    borderRadius: 999,
    border: 0,
    background: '#fff',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 15,
    height: 80,
    padding: '0 18px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.09)',
    background: 'rgba(255,255,255,0.03)',
  },
  rowPlay: {
    width: 44,
    height: 44,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'transparent',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  rowTitle: {
    fontSize: 15.5,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowMeta: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowChips: { display: 'flex', gap: 7, marginTop: 6 },
  chip: {
    fontSize: 11.5,
    padding: '3px 9px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.16)',
    color: 'rgba(255,255,255,0.6)',
  },
  chipLink: {
    fontSize: 11.5,
    padding: '3px 9px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.22)',
    color: 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
  },
  chipMuted: { fontSize: 11.5, padding: '3px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' },
  empty: { textAlign: 'center', padding: '54px 20px' },
  emptyMark: {
    width: 58,
    height: 58,
    borderRadius: 999,
    margin: '0 auto 20px',
    background: 'rgba(255,255,255,0.07)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 19, fontWeight: 600, margin: '0 0 8px' },
  emptySub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' },
  emptyCta: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    padding: '0 28px',
    borderRadius: 999,
    background: '#fff',
    color: '#000',
    fontSize: 15.5,
    fontWeight: 600,
    textDecoration: 'none',
  },
};
