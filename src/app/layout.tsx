'use client';
import * as React from 'react';
import { CssBaseline, Container, Box, AppBar, Toolbar, Typography, Button, BottomNavigation, BottomNavigationAction, useMediaQuery, useTheme } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from '@/theme';
import { ThemeProvider } from '@mui/material/styles';
import { Home, Upload, AutoAwesome } from '@mui/icons-material';
import './globals.css';

function Navigation() {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <BottomNavigation
        value={pathname}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#000000',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1000,
          '& .MuiBottomNavigationAction-root': {
            color: 'rgba(255, 255, 255, 0.6)',
            '&.Mui-selected': {
              color: '#fe2c55',
            }
          }
        }}
      >
        <BottomNavigationAction
          component={Link}
          href="/feed"
          value="/feed"
          icon={<Home />}
          label="Feed"
        />
        <BottomNavigationAction
          component={Link}
          href="/upload"
          value="/upload"
          icon={<Upload />}
          label="Upload"
        />
        <BottomNavigationAction
          component={Link}
          href="/inspiration"
          value="/inspiration"
          icon={<AutoAwesome />}
          label="Inspiration"
        />
      </BottomNavigation>
    );
  }

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 2, justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
          Beads
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            component={Link} 
            href="/feed"
            variant={pathname === '/feed' ? 'contained' : 'text'}
          >
            Feed
          </Button>
          <Button 
            component={Link} 
            href="/upload"
            variant={pathname === '/upload' ? 'contained' : 'text'}
          >
            Upload
          </Button>
          <Button 
            component={Link} 
            href="/inspiration"
            variant={pathname === '/inspiration' ? 'contained' : 'text'}
          >
            Inspiration
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#000000' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Navigation />
          <Box
            sx={{
              minHeight: '100vh',
              pb: { xs: 8, md: 0 }, // Padding for mobile bottom nav
              backgroundColor: '#000000'
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
        </ThemeProvider>
      </body>
    </html>
  );
}
