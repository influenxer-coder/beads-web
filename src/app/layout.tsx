import * as React from 'react';
import { CssBaseline, Container, Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import Link from 'next/link';
import { theme } from '@/theme';
import { ThemeProvider } from '@mui/material/styles';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
            <Toolbar sx={{ gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Beads</Typography>
              <Button component={Link} href="/feed">Feed</Button>
              <Button component={Link} href="/upload">Upload</Button>
              <Button component={Link} href="/inspiration">Inspiration</Button>
            </Toolbar>
          </AppBar>
          <Container maxWidth="lg">
            <Box py={4}>{children}</Box>
          </Container>
        </ThemeProvider>
      </body>
    </html>
  );
}
