'use client';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#111827' },
    secondary: { main: '#0ea5e9' },
    background: { default: '#fafafa' }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: { styleOverrides: { root: { boxShadow: '0 8px 30px rgba(0,0,0,0.04)' } } }
  },
  typography: {
    fontFamily: [
      'Inter','ui-sans-serif','system-ui','-apple-system','Segoe UI','Roboto','Helvetica','Arial'
    ].join(',')
  }
});
