'use client';

import * as React from 'react';
import Link from 'next/link';

/**
 * Grid of sources, modelled on ElevenReader's cover shelf.
 *
 * Their covers come from a fixed catalogue. Ours are the person's own
 * documents, so each card is generated from the file itself: a type badge, the
 * subject, and how much audio came out of it. That is the point of the swap,
 * so the shelf reads as "your documents", not "our library".
 */

export type Source = {
  id: string;
  title: string;
  type: string | null;
  chapterCount: number;
  playableCount: number;
  coverUrl?: string | null;
  createdAt?: string | null;
};

/** PDF, slides, notes, paper — inferred from the file name when unset. */
export function sourceKind(s: { title: string; type?: string | null }): string {
  const t = (s.title || '').toLowerCase();
  if (/\.(ppt|pptx|key)$/.test(t) || /slide|deck|lecture/.test(t)) return 'Slides';
  if (/\.(md|txt|rtf)$/.test(t) || /note/.test(t)) return 'Notes';
  if (/\.(docx?|odt)$/.test(t)) return 'Doc';
  if (/\.(png|jpe?g|heic|webp)$/.test(t)) return 'Scan';
  if (/paper|arxiv|journal|findings|report/.test(t)) return 'Paper';
  return 'PDF';
}

/** Strip the extension and tidy separators so the title reads like a subject. */
export function subjectOf(title: string) {
  return (title || 'Untitled')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Stable per-source cover, so a document always looks the same. */
function coverTone(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

/**
 * Covers live at paths derived from the document id.
 *
 * The square one is composed server side for Spotify, which needs 1:1
 * artwork, and is what the shelf shows so the card and the published episode
 * are the same image.
 */
export function coverUrlFor(documentId: string, shape: 'square' | 'page' = 'square') {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const dir = shape === 'square' ? 'covers-square' : 'covers';
  return `${base}/storage/v1/object/public/beads-assets/${dir}/${documentId}.png`;
}

export default function SourceGrid({
  sources,
  selectedId,
  onSelect,
  onDelete,
  heading = 'Your sources',
}: {
  sources: Source[];
  selectedId?: string | null;
  onSelect: (s: Source) => void;
  onDelete: (s: Source) => void;
  heading?: string;
}) {
  return (
    <section style={styles.section} aria-label={heading}>
      <h2 style={styles.h2}>{heading}</h2>

      <ul className="sg-grid" style={styles.grid}>
        {sources.map((s) => {
          const kind = sourceKind(s);
          const subject = subjectOf(s.title);
          const tone = coverTone(s.id);
          const selected = selectedId === s.id;

          return (
            <li key={s.id} style={styles.cell}>
              <div
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                onClick={() => onSelect(s)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(s);
                  }
                }}
                style={{
                  ...styles.cover,
                  outline: selected ? '2px solid #fff' : 'none',
                  outlineOffset: 3,
                  background: `linear-gradient(155deg, hsl(${tone} 38% 26%), hsl(${(tone + 42) % 360} 34% 13%))`,
                }}
              >
                <CoverArt source={s} kind={kind} subject={subject} />

                <span style={styles.playBadge} aria-hidden="true">
                  ▶
                </span>
              </div>

              <div style={styles.meta}>
                <span style={styles.title} title={subject}>
                  {subject}
                </span>
                <span style={styles.sub}>
                  {kind} · {s.playableCount} with audio
                </span>
              </div>

              <div style={styles.actions}>
                <Link href={`/studio/${s.id}`} style={styles.action} onClick={(e) => e.stopPropagation()}>
                  Studio
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s);
                  }}
                  style={{ ...styles.action, ...styles.danger }}
                  aria-label={`Delete ${subject} and its chapters`}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CoverArt({
  source,
  kind,
  subject,
}: {
  source: Source;
  kind: string;
  subject: string;
}) {
  // Page one of the document, when it has been rendered. Anything without a
  // cover yet keeps the generated one rather than showing a broken image.
  // square -> page render -> generated art
  const [step, setStep] = React.useState(0);
  const url =
    step === 0 ? (source.coverUrl ?? coverUrlFor(source.id, 'square')) :
    step === 1 ? coverUrlFor(source.id, 'page') :
    null;

  if (url) {
    return (
      <>
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setStep((n) => n + 1)}
          key={url}
          style={styles.coverImg}
        />
        <span style={{ ...styles.kind, position: 'relative', zIndex: 1 }}>{kind}</span>
      </>
    );
  }

  return (
    <>
      <span style={styles.kind}>{kind}</span>
      <span style={styles.coverTitle}>{subject}</span>
      <span style={styles.coverCount}>
        {source.chapterCount} {source.chapterCount === 1 ? 'chapter' : 'chapters'}
      </span>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: { marginTop: 34 },
  h2: {
    fontSize: 'clamp(24px, 3.4vw, 36px)',
    lineHeight: 1.12,
    letterSpacing: '-0.03em',
    fontWeight: 600,
    margin: '0 0 24px',
  },
  grid: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 20 },
  cell: { minWidth: 0 },
  cover: {
    position: 'relative',
    aspectRatio: '1 / 1',
    borderRadius: 10,
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    cursor: 'pointer',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  coverImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  kind: {
    alignSelf: 'flex-start',
    fontSize: 10.5,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '4px 8px',
    borderRadius: 4,
    background: 'rgba(0,0,0,0.35)',
    color: 'rgba(255,255,255,0.85)',
  },
  coverTitle: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.015em',
    marginTop: 'auto',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  coverCount: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  playBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.92)',
    color: '#000',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { marginTop: 11, minWidth: 0 },
  title: {
    display: 'block',
    fontSize: 14.5,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sub: { display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  actions: { display: 'flex', gap: 7, marginTop: 10 },
  action: {
    minHeight: 32,
    padding: '0 11px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12.5,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  danger: { borderColor: 'rgba(255,120,120,0.35)', color: 'rgba(255,170,170,0.9)' },
};
