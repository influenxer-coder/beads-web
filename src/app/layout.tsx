'use client';
import * as React from 'react';
import { CssBaseline, Container, Box } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from '@/theme';
import { ThemeProvider } from '@mui/material/styles';
import { PlayerProvider } from '@/lib/player';
import { AnalyticsProvider } from '@/lib/analytics';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Landing page renders full-bleed, with no app chrome
  if (pathname === '/') {
    return <Box sx={{ minHeight: '100vh', backgroundColor: '#000' }}>{children}</Box>;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0A'
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, md: 4 },
          px: { xs: 1, md: 3 }
        }}
      >
        {children}
      </Container>
    </Box>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Beads</title>
        <link rel="icon" href="/beads-b-sitar.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/beads-b-sitar.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0A0A0A' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AnalyticsProvider>
          <PlayerProvider>
            <Shell>{children}</Shell>
          </PlayerProvider>
          </AnalyticsProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
