'use client';

import * as React from 'react';
import Cite from './Cite';

type Node = { label: string; cite?: string; children?: Node[] };

/**
 * Mind map as an expandable tree.
 *
 * A tree rather than a free-floating canvas: it reads correctly on a phone,
 * needs no layout engine, and keeps every node reachable by keyboard.
 */
export default function MindMap({
  data,
  onCite,
}: {
  data: { root?: string; children?: Node[] };
  onCite?: (cite: string) => void;
}) {
  const children = data?.children ?? [];
  if (!children.length) return <p style={styles.empty}>Nothing mapped yet.</p>;

  return (
    <div style={styles.pad}>
      <div style={styles.root}>{data.root ?? 'Overview'}</div>
      <div style={styles.branches}>
        {children.map((n, i) => (
          <Branch key={i} node={n} depth={0} onCite={onCite} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}

function Branch({
  node,
  depth,
  onCite,
  defaultOpen,
}: {
  node: Node;
  depth: number;
  onCite?: (cite: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const kids = node.children ?? [];

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 18 }}>
      <div style={styles.nodeRow}>
        {kids.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={styles.toggle}
            aria-expanded={open}
            aria-label={open ? `Collapse ${node.label}` : `Expand ${node.label}`}
          >
            {open ? '−' : '+'}
          </button>
        ) : (
          <span style={styles.leafDot} aria-hidden="true" />
        )}

        <span style={{ ...styles.node, ...(depth === 0 ? styles.nodeTop : {}) }}>{node.label}</span>

        {node.cite && (
          <span style={{ marginTop: -14 }}>
            <Cite cite={node.cite} onCite={onCite} />
          </span>
        )}
      </div>

      {open && kids.length > 0 && (
        <div style={styles.kids}>
          {kids.map((k, i) => (
            <Branch key={i} node={k} depth={depth + 1} onCite={onCite} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pad: { padding: '18px 16px 22px' },
  root: {
    display: 'inline-block',
    padding: '9px 16px',
    borderRadius: 999,
    background: '#fff',
    color: '#000',
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 16,
  },
  branches: { display: 'flex', flexDirection: 'column', gap: 4 },
  nodeRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '5px 0' },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 7,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'transparent',
    color: '#fff',
    fontSize: 14,
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
  },
  leafDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.32)',
    margin: '0 9px',
    flexShrink: 0,
  },
  node: {
    padding: '7px 13px',
    borderRadius: 9,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.05)',
    fontSize: 14.5,
  },
  nodeTop: { fontWeight: 600, background: 'rgba(255,255,255,0.09)' },
  kids: {
    borderLeft: '1px solid rgba(255,255,255,0.12)',
    marginLeft: 11,
    paddingLeft: 8,
    marginTop: 2,
  },
  empty: { padding: 26, color: 'rgba(255,255,255,0.5)', fontSize: 14.5 },
};
