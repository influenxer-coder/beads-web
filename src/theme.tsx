'use client';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { 
      main: '#ffffff',
      contrastText: '#000000'
    },
    secondary: { 
      main: '#fe2c55', // TikTok pink
      contrastText: '#ffffff'
    },
    background: { 
      default: '#000000',
      paper: '#161823'
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)'
    },
    divider: 'rgba(255, 255, 255, 0.12)'
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCard: { 
      styleOverrides: { 
        root: { 
          backgroundColor: '#161823',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none'
        } 
      } 
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#fe2c55',
          color: '#ffffff',
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 8,
          '&:hover': {
            backgroundColor: '#e91e63',
          }
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.3)',
          color: '#ffffff',
          textTransform: 'none',
          borderRadius: 8,
          '&:hover': {
            borderColor: '#fe2c55',
            backgroundColor: 'rgba(254, 44, 85, 0.1)',
          }
        },
        text: {
          color: '#ffffff',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#fe2c55',
            }
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161823',
          borderRadius: 16,
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#161823',
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }
        }
      }
    }
  },
  typography: {
    fontFamily: [
      'Inter','-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','Helvetica','Arial','sans-serif'
    ].join(','),
    h1: { fontWeight: 700, fontSize: '2rem' },
    h2: { fontWeight: 700, fontSize: '1.75rem' },
    h3: { fontWeight: 700, fontSize: '1.5rem' },
    h4: { fontWeight: 600, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.125rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    button: { fontWeight: 600 }
  }
});
