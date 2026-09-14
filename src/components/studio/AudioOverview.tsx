'use client';

import * as React from 'react';
import { usePlayer } from '@/lib/player';
import { track } from '@/lib/analytics';

type Turn = { host: string; text: string };

/**
 * Two host overview of the source: the transcript, and the narration once it
 * has been rendered. Playback goes through the shared player so it keeps
 * running as you move around the app.
 */
export default function AudioOverview({
  documentId,
  content,
  audioUrl,
}: {
  documentId: string;
  content: { title?: string; hosts?: string[]; turns?: Turn[] };
  audioUrl?: string | null;
}) {
  const player = usePlayer();
  const [url, setUrl] = React.useState<string | null>(audioUrl ?? null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const turns = content?.turns ?? [];
  const hosts = content?.hosts ?? [];

  const narrate = async () => {
    setBusy(true);
    setError(null);
    track('audio_overview_narrate_started');
    try {
      const r = await fetch(`/api/artifacts/${documentId}/audio_overview/narrate`, { method: 'POST' });
      const d = await r.json();
      if (!d?.success) throw new Error(d?.error ?? 'Could not narrate that.');
      setUrl(d.audio_url);
      track('audio_overview_narrated');
    } catch (e: any) {
      setError(e?.message ?? 'Could not narrate that.');
    } finally {
      setBusy(false);
    }
  };

  const isCurrent = player.track?.id === `overview-${documentId}`;

  return (
    <div style={styles.pad}>
      <div style={styles.head}>
        <div>
          <div style={styles.title}>{content?.title ?? 'Audio overview'}</div>
          <div style={styles.hosts}>
            {hosts.length ? `${hosts.length} hosts · ${hosts.join(' and ')}` : 'Two hosts'}
          </div>
        </div>

        {url ? (
          <button
            type="button"
            onClick={() =>
              isCurrent
                ? player.toggle()
                : player.play({
                    id: `overview-${documentId}`,
                    title: content?.title ?? 'Audio overview',
                    sourceTitle: 'Audio overview',
                    audioUrl: url,
                  })
            }
            style={styles.play}
            aria-label={isCurrent && player.playing ? 'Pause' : 'Play the overview'}
          >
            {isCurrent && player.playing ? '❚❚' : '▶'}
          </button>
        ) : (
          <button type="button" onClick={narrate} disabled={busy} style={styles.narrate}>
            {busy ? 'Recording…' : 'Narrate it'}
          </button>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {busy && <p style={styles.note}>Narration takes about a minute.</p>}

      <ol style={styles.turns}>
        {turns.map((t, i) => (
          <li key={i} style={styles.turn}>
            <span style={styles.host}>{t.host}</span>
            <span style={styles.text}>{t.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pad: { padding: '18px 16px 22px' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' },
  hosts: { fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  play: {
    width: 50,
    height: 50,
    borderRadius: 999,
    border: 0,
    background: '#fff',
    color: '#000',
    fontSize: 15,
    cursor: 'pointer',
    flexShrink: 0,
  },
  narrate: {
    minHeight: 44,
    padding: '0 18px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.24)',
    background: 'transparent',
    color: '#fff',
    fontSize: 14.5,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  note: { fontSize: 13.5, color: 'rgba(255,255,255,0.45)', margin: '0 0 12px' },
  error: { fontSize: 14, color: '#ffb0b0', margin: '0 0 12px' },
  turns: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 },
  turn: { display: 'flex', gap: 12, alignItems: 'baseline' },
  host: {
    fontSize: 12.5,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.55)',
    minWidth: 46,
    flexShrink: 0,
  },
  text: { fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' },
};
