'use client';
import { createTheme } from '@mui/material/styles';

// Color Palette: Burmese Red Ruby & Yellow Sapphire with Pastels
const rubyRed = '#DC2626';        // Deep Burmese ruby red
const rubyRedDark = '#B91C1C';    // Darker ruby
const rubyRedLight = '#EF4444';   // Lighter ruby
const pastelRuby = '#FCA5A5';     // Soft pastel ruby
const pastelRubyBg = '#FEE2E2';   // Very light pastel ruby

const yellowSapphire = '#F59E0B';  // Golden yellow sapphire
const yellowSapphireDark = '#D97706'; // Darker sapphire
const yellowSapphireLight = '#FBBF24'; // Lighter sapphire
const pastelYellow = '#FDE68A';    // Soft pastel yellow
const pastelYellowBg = '#FFFBEB'; // Very light pastel yellow

const darkBg = '#0A0A0A';         // Deep black background
const cardBg = '#1A1A1A';         // Card background with warm undertone
const cardBgHover = '#222222';    // Hover state

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { 
      main: rubyRed,
      dark: rubyRedDark,
      light: rubyRedLight,
      contrastText: '#ffffff'
    },
    secondary: { 
      main: yellowSapphire,
      dark: yellowSapphireDark,
      light: yellowSapphireLight,
      contrastText: '#000000'
    },
    background: { 
      default: darkBg,
      paper: cardBg
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.75)'
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    // Custom colors for pastel accents
    error: {
      main: rubyRed,
      light: pastelRuby,
    },
    warning: {
      main: yellowSapphire,
      light: pastelYellow,
    }
  },
  shape: { borderRadius: 20 }, // Apple-inspired rounded corners
  spacing: 8, // Base spacing unit
  components: {
    MuiCard: { 
      styleOverrides: { 
        root: { 
          backgroundColor: cardBg,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: cardBgHover,
            boxShadow: '0 8px 32px rgba(220, 38, 38, 0.15)',
            borderColor: 'rgba(220, 38, 38, 0.2)',
          }
        } 
      } 
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: rubyRed,
          color: '#ffffff',
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '15px',
          letterSpacing: '-0.01em',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: rubyRedDark,
            boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
            transform: 'translateY(-1px)',
          },
          '&.MuiButton-containedSecondary': {
            backgroundColor: yellowSapphire,
            color: '#000000',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            '&:hover': {
              backgroundColor: yellowSapphireDark,
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
            }
          }
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '15px',
          letterSpacing: '-0.01em',
          borderWidth: '1.5px',
          '&:hover': {
            borderColor: rubyRed,
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            borderWidth: '1.5px',
          }
        },
        text: {
          color: '#ffffff',
          textTransform: 'none',
          padding: '10px 16px',
          fontSize: '15px',
          letterSpacing: '-0.01em',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 12,
            fontSize: '15px',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.25)',
            },
            '&.Mui-focused fieldset': {
              borderColor: rubyRed,
              borderWidth: '2px',
            }
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: darkBg,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 1px 0 rgba(255, 255, 255, 0.05)',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
          borderRadius: 10,
          fontSize: '13px',
          fontWeight: 500,
          height: 28,
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: cardBg,
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: cardBg,
          borderRadius: 16,
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.05)',
          }
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          height: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        bar: {
          borderRadius: 10,
        }
      }
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'SF Pro Display',
      'SF Pro Text',
      'Inter',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: { 
      fontWeight: 700, 
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.2
    },
    h2: { 
      fontWeight: 700, 
      fontSize: '2rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.25
    },
    h3: { 
      fontWeight: 700, 
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.3
    },
    h4: { 
      fontWeight: 600, 
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.35
    },
    h5: { 
      fontWeight: 600, 
      fontSize: '1.25rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4
    },
    h6: { 
      fontWeight: 600, 
      fontSize: '1.125rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4
    },
    body1: {
      fontSize: '16px',
      lineHeight: 1.6,
      letterSpacing: '-0.01em',
    },
    body2: {
      fontSize: '14px',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
    },
    button: { 
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    caption: {
      fontSize: '12px',
      letterSpacing: '0.01em',
    }
  }
});
