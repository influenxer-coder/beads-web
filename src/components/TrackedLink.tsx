'use client';

import * as React from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';

/**
 * A link that reports being clicked.
 *
 * The papers pages render on the server so their text reaches a crawler, and
 * a server component cannot call track(). This is the small client boundary
 * that lets those pages stay server-rendered while still measuring which rows
 * people actually open.
 */
export default function TrackedLink({
  href,
  event,
  props,
  external = false,
  children,
  style,
}: {
  href: string;
  event: string;
  props?: Record<string, unknown>;
  external?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const onClick = () => track(event, props);

  if (external) {
    return (
      <a href={href} onClick={onClick} style={style} rel="noopener" target="_blank">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} style={style}>
      {children}
    </Link>
  );
}
