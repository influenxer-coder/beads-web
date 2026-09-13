'use client';

import * as React from 'react';
import { ui } from './ui';

const ACCEPT = '.pdf,.docx,.epub,.txt,.md,.ppt,.pptx,.png,.jpg,.jpeg,.heic';
const FORMATS = 'PDF · DOCX · EPUB · slides · notes · photos';

export default function UploadStep({
  onFile,
  onLink,
  busy,
  error,
}: {
  onFile: (f: File) => void;
  onLink: (url: string) => void;
  busy?: boolean;
  error?: string | null;
}) {
  const [over, setOver] = React.useState(false);
  const [link, setLink] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const pick = (files: FileList | null) => {
    const f = files?.[0];
    if (f) setFile(f);
  };

  const openPicker = () => inputRef.current?.click();

  const go = () => {
    if (file) onFile(file);
    else if (link.trim()) onLink(link.trim());
    else openPicker();
  };

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>Turn your reading into a 1-minute lesson.</h1>
      <p style={styles.sub}>No account needed to try.</p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Drop a file or click to upload"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files);
        }}
        style={{
          ...styles.drop,
          borderColor: over ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
          background: over ? 'rgba(255,255,255,0.05)' : 'transparent',
        }}
      >
        <UploadIcon />
        <div style={styles.dropTitle}>
          {file ? file.name : 'Drop a file or click to upload'}
        </div>
        <div style={styles.dropHint}>
          {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · tap to choose another` : FORMATS}
        </div>
      </div>

      {/* Outside the drop zone on purpose: nested inside, the programmatic
          click bubbles back to the parent handler and the picker never opens. */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = '';
        }}
      />

      <div style={styles.orRow}>
        <span style={styles.orLine} />
        <span style={styles.orText}>OR</span>
        <span style={styles.orLine} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (link.trim()) onLink(link.trim());
        }}
        style={styles.linkRow}
      >
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Paste a link..."
          aria-label="Paste a link"
          style={styles.linkInput}
        />
      </form>

      <button
        type="button"
        disabled={busy || (!file && !link.trim())}
        onClick={go}
        style={{ ...ui.primaryBtn, width: '100%', marginTop: 18, opacity: busy || (!file && !link.trim()) ? 0.55 : 1 }}
      >
        {busy ? 'Working...' : 'Make it audio'}
      </button>

      {error && <p style={styles.error}>{error}</p>}

      <p style={styles.footnote}>Nothing is saved until you ask us to.</p>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ opacity: 0.75 }}>
      <path
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { width: '100%', maxWidth: 560, margin: '0 auto', textAlign: 'center' },
  h1: {
    fontSize: 'clamp(27px, 4.4vw, 40px)',
    lineHeight: 1.12,
    letterSpacing: '-0.03em',
    fontWeight: 600,
    margin: '0 0 12px',
  },
  sub: { fontSize: 16.5, color: 'rgba(255,255,255,0.55)', margin: '0 0 36px' },
  drop: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '46px 24px',
    border: '1.5px dashed rgba(255,255,255,0.2)',
    borderRadius: 14,
    cursor: 'pointer',
    transition: 'border-color 160ms ease, background 160ms ease',
    minHeight: 168,
  },
  dropTitle: { fontSize: 16.5, fontWeight: 550 },
  dropHint: { fontSize: 13.5, color: 'rgba(255,255,255,0.45)' },
  orRow: { display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' },
  orLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' },
  orText: { fontSize: 12, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)' },
  linkRow: { display: 'flex' },
  linkInput: {
    width: '100%',
    minHeight: 48,
    padding: '0 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: 15.5,
    outline: 'none',
  },
  error: {
    marginTop: 16,
    fontSize: 14,
    color: '#ff9f9f',
    background: 'rgba(255,90,90,0.08)',
    border: '1px solid rgba(255,90,90,0.25)',
    borderRadius: 8,
    padding: '10px 12px',
  },
  footnote: { marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.35)' },
};
