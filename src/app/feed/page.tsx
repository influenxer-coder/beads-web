'use client';
import * as React from 'react';
import { 
  Box, Card, CardContent, Typography, Stack, Avatar, 
  IconButton, CircularProgress, useMediaQuery, useTheme
} from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';

type Bead = {
  id: string; author: string; title: string; content: string;
  created_at: string; audio_url: string|null;
};

export default function FeedPage(){
  const [items, setItems] = React.useState<Bead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string|null>(null);
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRefs = React.useRef<{ [key: string]: HTMLAudioElement }>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  React.useEffect(()=>{
    (async ()=>{
      try {
        const r = await fetch('/api/feed');
        if(!r.ok) throw new Error(await r.text());
        const d = await r.json();
        setItems(d.feed ?? []);
      } catch(e:any){ setError(e.message); }
      finally{ setLoading(false); }
    })();
  },[]);

  const togglePlay = (id: string, audioUrl: string) => {
    const audio = audioRefs.current[id];
    if (!audio) {
      const newAudio = new Audio(audioUrl);
      audioRefs.current[id] = newAudio;
      newAudio.play();
      setPlayingId(id);
      newAudio.onended = () => setPlayingId(null);
      newAudio.onpause = () => setPlayingId(null);
    } else {
      if (playingId === id) {
        audio.pause();
        setPlayingId(null);
      } else {
        // Pause all other audio
        Object.values(audioRefs.current).forEach(a => a.pause());
        audio.play();
        setPlayingId(id);
      }
    }
  };

  if(loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: '#fe2c55' }} />
      </Box>
    );
  }
  
  if(error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error" variant="h6">Error: {error}</Typography>
      </Box>
    );
  }

  if(items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No beads yet. Upload a document to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <Stack 
      spacing={isMobile ? 3 : 4} 
      sx={{ 
        maxWidth: isMobile ? '100%' : '800px',
        mx: 'auto',
        pb: { xs: 4, md: 0 }
      }}
    >
      {items.map((it, index) => (
        <Card
          key={it.id}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(254, 44, 85, 0.2)',
            }
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack spacing={2}>
              {/* Header */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar 
                  sx={{ 
                    bgcolor: '#fe2c55',
                    width: { xs: 40, md: 48 },
                    height: { xs: 40, md: 48 },
                    fontSize: { xs: '1rem', md: '1.25rem' }
                  }}
                >
                  {it.author?.[0]?.toUpperCase() || 'B'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.95rem', md: '1rem' }
                    }}
                  >
                    {it.author || 'Anonymous'}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                  >
                    {new Date(it.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Typography>
                </Box>
              </Stack>

              {/* Title */}
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  lineHeight: 1.3
                }}
              >
                {it.title}
              </Typography>

              {/* Content */}
              <Typography 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  color: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                {it.content}
              </Typography>

              {/* Audio Player */}
              {it.audio_url && (
                <Box
                  sx={{
                    mt: 1,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <IconButton
                    onClick={() => togglePlay(it.id, it.audio_url!)}
                    sx={{
                      bgcolor: '#fe2c55',
                      color: '#ffffff',
                      width: { xs: 48, md: 56 },
                      height: { xs: 48, md: 56 },
                      '&:hover': {
                        bgcolor: '#e91e63',
                      }
                    }}
                  >
                    {playingId === it.id ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      {playingId === it.id ? 'Playing...' : 'Tap to play'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
