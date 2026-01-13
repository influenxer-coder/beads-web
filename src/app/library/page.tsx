'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Typography, Card, CardContent, CardMedia, Stack, Box, CircularProgress, 
  IconButton, Collapse, Avatar, useMediaQuery, useTheme
} from '@mui/material';
import { ExpandMore, ExpandLess, PlayArrow, Pause, Refresh } from '@mui/icons-material';

export const dynamic = 'force-dynamic';

type Doc = { 
  id: string; 
  title: string; 
  url: string; 
  type?: string;
  created_at?: string;
};

type Bead = {
  id: string;
  author: string;
  title: string;
  content: string;
  created_at: string;
  audio_url: string | null;
  document_id?: string;
};

type DocumentWithBeads = Doc & {
  beads: Bead[];
  beadCount: number;
};

export default function LibraryPage(){
  const [docs, setDocs] = React.useState<DocumentWithBeads[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string|null>(null);
  const [expandedDocs, setExpandedDocs] = React.useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const [regenerating, setRegenerating] = React.useState<string|null>(null);
  const audioRefs = React.useRef<{ [key: string]: HTMLAudioElement }>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://beads-mvp-backend-production.up.railway.app';

  const listDocs = async ()=>{
    try {
      // Fetch documents
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if(docsError) throw docsError;
      
      // Fetch all beads
      const { data: beadsData, error: beadsError } = await supabase
        .from('beads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if(beadsError) throw beadsError;
      
      // Group beads by document_id
      const docsWithBeads: DocumentWithBeads[] = (docsData || []).map((doc: Doc) => {
        const docBeads = (beadsData || []).filter((bead: Bead) => bead.document_id === doc.id);
        return {
          ...doc,
          beads: docBeads,
          beadCount: docBeads.length
        };
      });
      
      setDocs(docsWithBeads);
      setError(null);
    } catch(e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(()=>{ listDocs(); },[]);

  const toggleExpand = (docId: string) => {
    setExpandedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

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

  const regenerateScripts = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Regenerate scripts using default inspiration profile style?')) return;
    
    try {
      setRegenerating(documentId);

      // Clear existing scripts
      await supabase.from('beads').update({ script_text: null }).eq('document_id', documentId);

      // Regenerate with default profile style
      const response = await fetch(`${BACKEND_URL}/generate-scripts/${documentId}`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        alert(`✓ Generated ${result.scripts_generated} scripts!`);
        await listDocs(); // Refresh the list
      } else {
        alert(`Error: ${JSON.stringify(result)}`);
      }
    } catch (e: any) {
      console.error('Error:', e);
      alert('Failed to regenerate scripts: ' + e.message);
    } finally {
      setRegenerating(null);
    }
  };

  if(loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
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

  if(docs.length === 0) {
    return (
      <Stack spacing={3} sx={{ pb: { xs: 4, md: 0 } }}>
        <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
          Library
        </Typography>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No documents yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload documents from the Create tab to see them here
          </Typography>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ pb: { xs: 4, md: 0 } }}>
      <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
        Library
      </Typography>

      <Stack spacing={2}>
        {docs.map((doc, docIndex) => {
          const isExpanded = expandedDocs.has(doc.id);
          return (
            <Card
              key={doc.id}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(220, 38, 38, 0.15)',
                }
              }}
            >
              <CardMedia
                component="div"
                sx={{
                  height: { xs: 100, md: 120 },
                  background: docIndex % 2 === 0 
                    ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #EF4444 100%)'
                    : 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #FBBF24 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
                  }
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: { xs: '3rem', md: '4rem' },
                    fontWeight: 700,
                    color: docIndex % 2 === 0 ? '#ffffff' : '#000000',
                    opacity: 0.2,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {doc.title?.[0]?.toUpperCase() || 'D'}
                </Typography>
              </CardMedia>
              {/* Playlist Header */}
              <CardContent
                sx={{
                  p: { xs: 2, md: 2.5 },
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  }
                }}
                onClick={() => toggleExpand(doc.id)}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: docIndex % 2 === 0 ? 'primary.main' : 'secondary.main',
                      color: docIndex % 2 === 0 ? '#ffffff' : '#000000',
                      width: { xs: 56, md: 64 },
                      height: { xs: 56, md: 64 },
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                      fontWeight: 700,
                    }}
                  >
                    {doc.title?.[0]?.toUpperCase() || 'D'}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '1.1rem', md: '1.25rem' },
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.875rem', md: '0.9rem' } }}
                    >
                      {doc.beadCount} {doc.beadCount === 1 ? 'bead' : 'beads'} • {doc.type || 'PDF'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      size="small"
                      onClick={(e) => regenerateScripts(doc.id, e)}
                      disabled={regenerating === doc.id}
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'rgba(220, 38, 38, 0.1)',
                        },
                        '&:disabled': {
                          color: 'rgba(255, 255, 255, 0.3)',
                        }
                      }}
                    >
                      {regenerating === doc.id ? (
                        <CircularProgress size={20} sx={{ color: 'primary.main' }} />
                      ) : (
                        <Refresh fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>

              {/* Expanded Beads List */}
              <Collapse in={isExpanded} timeout="auto">
                <Box sx={{ px: { xs: 2, md: 2.5 }, pb: { xs: 2, md: 2.5 } }}>
                  {doc.beads.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No beads generated yet. Regenerate scripts to create beads.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={isMobile ? 2 : 3} sx={{ mt: 2 }}>
                      {doc.beads.map((bead, beadIndex) => (
                        <Card
                          key={bead.id}
                          sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
                            }
                          }}
                        >
                          <CardMedia
                            component="div"
                            sx={{
                              height: { xs: 80, md: 100 },
                              background: beadIndex % 2 === 0 
                                ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #EF4444 100%)'
                                : 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #FBBF24 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
                              }
                            }}
                          >
                            <Typography
                              variant="h4"
                              sx={{
                                fontSize: { xs: '2rem', md: '2.5rem' },
                                fontWeight: 700,
                                color: beadIndex % 2 === 0 ? '#ffffff' : '#000000',
                                opacity: 0.2,
                                position: 'relative',
                                zIndex: 1,
                              }}
                            >
                              {bead.title?.[0]?.toUpperCase() || 'B'}
                            </Typography>
                          </CardMedia>
                          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                            <Stack spacing={2}>
                              {/* Header */}
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                  sx={{
                                    bgcolor: beadIndex % 2 === 0 ? 'primary.main' : 'secondary.main',
                                    color: beadIndex % 2 === 0 ? '#ffffff' : '#000000',
                                    width: { xs: 40, md: 48 },
                                    height: { xs: 40, md: 48 },
                                    fontSize: { xs: '1rem', md: '1.25rem' },
                                  }}
                                >
                                  {bead.author?.[0]?.toUpperCase() || 'B'}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: { xs: '0.95rem', md: '1rem' }
                                    }}
                                  >
                                    {bead.author || 'Anonymous'}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                                  >
                                    {new Date(bead.created_at).toLocaleDateString('en-US', {
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
                                {bead.title}
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
                                {bead.content}
                              </Typography>

                              {/* Audio Player */}
                              {bead.audio_url && (
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
                                    onClick={() => togglePlay(bead.id, bead.audio_url!)}
                                    sx={{
                                      bgcolor: 'primary.main',
                                      color: '#ffffff',
                                      width: { xs: 48, md: 56 },
                                      height: { xs: 48, md: 56 },
                                      '&:hover': {
                                        bgcolor: 'primary.dark',
                                      }
                                    }}
                                  >
                                    {playingId === bead.id ? <Pause /> : <PlayArrow />}
                                  </IconButton>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {playingId === bead.id ? 'Playing...' : 'Tap to play'}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Collapse>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
}
