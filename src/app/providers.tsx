'use client';

import * as React from 'react';
import { CssBaseline, Container, Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import { theme } from '@/theme';
import { ThemeProvider } from '@mui/material/styles';
import { PlayerProvider } from '@/lib/player';
import { AnalyticsProvider } from '@/lib/analytics';
import { Analytics } from '@vercel/analytics/react';

/**
 * Everything on the page that needs the browser.
 *
 * This used to live in the root layout, which made the layout a client
 * component, and a client layout cannot export `metadata`. The site therefore
 * had no per-page titles or descriptions at all. Keeping the providers here
 * lets the layout stay on the server and own the metadata.
 */

/** Pages that render full-bleed, with no app chrome around them. */
function isFullBleed(pathname: string | null) {
  return pathname === '/' || (pathname ?? '').startsWith('/learn');
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isFullBleed(pathname)) {
    return <Box sx={{ minHeight: '100vh', backgroundColor: '#000' }}>{children}</Box>;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0A0A0A' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, md: 3 } }}>
        {children}
      </Container>
    </Box>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AnalyticsProvider>
        <PlayerProvider>
          <Shell>{children}</Shell>
        </PlayerProvider>
      </AnalyticsProvider>
      <Analytics />
    </ThemeProvider>
  );
}
