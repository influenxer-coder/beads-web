'use client';

import * as React from 'react';
import Phone from '@/components/Phone';
import { type } from '@/lib/type';

/**
 * "Take a closer look": a short list of steps beside one phone. Picking a
 * step swaps the screen. Modelled on the product viewer on apple.com.
 */

const STEPS = [
  { title: 'Add a paper.', body: 'Upload the PDF. Or start with one of ours.',
    src: '/screens/upload.webp', alt: 'The upload screen' },
  { title: 'Get your lessons.', body: 'Beads reads the whole paper and splits it into short lessons.',
    src: '/screens/lessons.webp', alt: 'A paper split into short lessons' },
  { title: 'Press play.', body: 'About a minute each. Skip back, speed up, or pick another.',
    src: '/screens/playing.webp', alt: 'A lesson playing' },
];

export default function CloserLook() {
  const [active, setActive] = React.useState(0);

  return (
    <section style={s.section} aria-labelledby="cl-heading">
      <h2 id="cl-heading" style={s.h2}>Take a closer look.</h2>

      <div className="cl-grid" style={s.grid}>
        <ol style={s.list}>
          {STEPS.map((st, i) => {
            const on = i === active;
            return (
              <li key={st.title}>
                <button type="button" onClick={() => setActive(i)} aria-pressed={on}
                        style={{ ...s.pill, ...(on ? s.pillOn : null) }}>
                  <span aria-hidden="true" style={s.plus}>{on ? '−' : '+'}</span>
                  {st.title}
                </button>
                {on && <p style={s.body}>{st.body}</p>}
              </li>
            );
          })}
        </ol>

        <div style={s.stage}>
          {STEPS.map((st, i) => (
            <div key={st.src} aria-hidden={i !== active} className="cl-layer"
                 style={{ ...s.layer, opacity: i === active ? 1 : 0 }}>
              <Phone src={st.src} alt={st.alt} width={300} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  section: { padding: '96px 0' },
  h2: { ...type.headline, margin: '0 0 48px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
    gap: 48,
    alignItems: 'center',
    padding: '48px 32px',
    borderRadius: 28,
    background: '#161617',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 },
  pill: {
    ...type.bodyStrong,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 22px 12px 14px',
    borderRadius: 999,
    border: 0,
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.1)',
    color: '#f5f5f7',
  },
  pillOn: { background: '#f5f5f7', color: '#000' },
  plus: {
    width: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', border: '1.5px solid currentColor', fontSize: 15, lineHeight: 1,
  },
  body: { ...type.body, color: 'rgba(255,255,255,0.7)', margin: '14px 0 8px 14px', maxWidth: 360 },
  stage: { position: 'relative', display: 'grid', justifyItems: 'center' },
  layer: { gridArea: '1 / 1', width: '100%', display: 'flex', justifyContent: 'center', transition: 'opacity 400ms ease' },
};
