import * as React from 'react';
import type { Metadata } from 'next';
import Providers from './providers';
import './globals.css';

/**
 * A server component, so it can export metadata.
 *
 * It used to be a client component with a hardcoded <title>Beads</title>, which
 * overrode whatever a page set. Every page in the site was therefore titled
 * "Beads" and none carried a description. The browser-side providers moved to
 * ./providers.tsx; this file owns the document and its metadata.
 *
 * `template` appends the brand to a page's own title. A page that wants its
 * title left exactly as written opts out with `title: { absolute: '...' }`.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://app.influenxers.com'),
  title: {
    default: 'Beads: turn your PDFs and notes into audio',
    template: '%s · Beads',
  },
  description:
    'Upload a book, paper or your notes and get short audio lessons you can '
    + 'listen to on the commute. Free to start.',
  icons: { icon: '/beads-b-sitar.svg', apple: '/beads-b-sitar.svg' },
  openGraph: { siteName: 'Beads', type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0A0A0A' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
