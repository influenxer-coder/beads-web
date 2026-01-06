'use client';
import * as React from 'react';
import {
  Grid2 as Grid, Card, CardContent, CardActions, CardHeader, Typography, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Chip, Avatar, Tooltip, Box, CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow, CheckCircle } from '@mui/icons-material';
import ProfileIngestionStatus, { IngestionStatus } from '@/components/ProfileIngestionStatus';
import VoiceCloneBadge, { VoiceCloneInfo, VoiceCloneStatus } from '@/components/VoiceCloneBadge';

type Profile = {
  id: string;
  name: string;
  description?: string;
  hero_image_url?: string;
  source_count?: number;
  bead_count?: number;
  analyzed_from_urls?: string[];
  is_default?: boolean;
  ingestion_status?: 'pending' | 'downloading' | 'analyzing' | 'processing_audio' | 'processing_video' | 'aggregating' | 'completed' | 'failed';
  ingestion_progress?: {
    total_videos: number;
    videos_completed: number;
    videos_downloaded: number;
    videos_analyzed: number;
    videos_audio_processed: number;
    videos_video_processed: number;
    percentage: number;
    current_stage: string;
  };
  ingestion_error?: string | null;
  voice_clone_id?: string | null;
  voice_clone_status?: VoiceCloneStatus;
  voice_clone_error?: string | null;
  voice_clone_started_at?: string | null;
  voice_clone_completed_at?: string | null;
  has_voice_clone?: boolean;
  voice_status?: {
    status: string;
    voice_id: string;
    voice_name: string;
    ready: boolean;
  };
};

export default function InspirationPage(){
  const [items, setItems] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string|null>(null);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Profile | null>(null);
  const [form, setForm] = React.useState({ name:'', description:'', hero_image_url:'', urls:'' });

  const load = React.useCallback(async ()=>{
    setLoading(true);
    try{
      const r = await fetch('/api/inspirations');
      if(!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setItems(d.profiles ?? []);
      setError(null);
    }catch(e:any){ setError(e.message); }
    finally{ setLoading(false); }
  },[]);

  React.useEffect(()=>{ load(); },[load]);

  const onNew = ()=>{
    setEditing(null);
    setForm({ name:'', description:'', hero_image_url:'', urls:'' });
    setOpen(true);
  };
  const onEdit = (p: Profile)=>{
    setEditing(p);
    setForm({
      name: p.name || '',
      description: p.description || '',
      hero_image_url: p.hero_image_url || '',
      urls: (p.analyzed_from_urls||[]).join('\n')
    });
    setOpen(true);
  };
  const onDelete = async (p: Profile)=>{
    if(!confirm(`Delete "${p.name}"?`)) return;
    const r = await fetch(`/api/inspirations/${p.id}`, { method:'DELETE' });
    if(!r.ok){ alert(await r.text()); return; }
    await load();
  };
  const onAnalyze = async (p: Profile)=>{
    const r = await fetch(`/api/inspirations/${p.id}/analyze`, { method:'POST' });
    if(!r.ok){ alert(await r.text()); return; }
    alert('Analysis started');
    // Reload to get updated status
    setTimeout(() => load(), 1000);
  };

  const handleStatusChange = React.useCallback((profileId: string, status: IngestionStatus) => {
    setItems(prev => prev.map(p => 
      p.id === profileId 
        ? {
            ...p,
            ingestion_status: status.status,
            ingestion_progress: status.progress,
            ingestion_error: status.error,
          }
        : p
    ));
  }, []);

  // Check voice clone status for profiles that are >= 75% ready or cloning
  React.useEffect(() => {
    const fetchVoiceStatus = async (profileId: string) => {
      try {
        const r = await fetch(`/api/inspirations/${profileId}/voice-clone`);
        if (r.ok) {
          const data = await r.json();
          setItems(prev => prev.map(p => 
            p.id === profileId 
              ? {
                  ...p,
                  voice_clone_id: data.voice_clone_id,
                  voice_clone_status: data.voice_clone_status,
                  voice_clone_error: data.voice_clone_error,
                  voice_clone_started_at: data.voice_clone_started_at,
                  voice_clone_completed_at: data.voice_clone_completed_at,
                  has_voice_clone: data.has_voice_clone,
                  voice_status: data.voice_status,
                }
              : p
          ));
        }
      } catch (e) {
        console.error('Error fetching voice clone status:', e);
      }
    };

    // Profiles that need voice clone status checked:
    // 1. Profiles that are cloning (need polling)
    // 2. Profiles that are >= 75% ready but don't have voice clone status yet
    const profilesToCheck = items.filter(p => {
      const isCloning = p.voice_clone_status === 'cloning';
      const isReady = p.ingestion_progress && p.ingestion_progress.percentage >= 75;
      const needsStatusCheck = isReady && !p.voice_clone_status;
      return isCloning || needsStatusCheck;
    });

    if (profilesToCheck.length === 0) return;

    // Initial fetch for all profiles that need checking
    profilesToCheck.forEach(p => fetchVoiceStatus(p.id));

    // Poll every 5 seconds only for profiles that are cloning
    const cloningProfiles = profilesToCheck.filter(p => p.voice_clone_status === 'cloning');
    if (cloningProfiles.length > 0) {
      const interval = setInterval(() => {
        cloningProfiles.forEach(p => fetchVoiceStatus(p.id));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [items]);

  const submit = async ()=>{
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      hero_image_url: form.hero_image_url.trim() || null,
      tiktok_urls: form.urls.split(/\n+/).map(s=>s.trim()).filter(Boolean),
      is_default: false
    };
    let r: Response;
    if(editing){
      r = await fetch(`/api/inspirations/${editing.id}`, {
        method:'PUT',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
    }else{
      r = await fetch(`/api/inspirations`, {
        method:'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
    }
    if(!r.ok){ alert(await r.text()); return; }
    setOpen(false);
    await load();
  };

  return (
    <Stack spacing={3} sx={{ pb: { xs: 4, md: 0 } }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
      >
        <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
          Inspiration
        </Typography>
        <Button 
          startIcon={<Add />} 
          variant="contained"
          color="secondary"
          onClick={onNew}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            minWidth: { xs: 'auto', sm: 180 }
          }}
        >
          New Inspiration
        </Button>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      )}
      {error && (
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
          <Typography color="error">Error: {error}</Typography>
        </Box>
      )}

      {!loading && !error && items.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No inspiration profiles yet
          </Typography>
          <Button variant="contained" color="secondary" onClick={onNew} startIcon={<Add />}>
            Create Your First Profile
          </Button>
        </Box>
      )}

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {items.map(p => (
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(254, 44, 85, 0.2)',
                }
              }}
            >
              <CardHeader
                avatar={
                  <Avatar 
                    src={p.hero_image_url} 
                    alt={p.name}
                    sx={{ 
                      bgcolor: p.is_default ? 'secondary.main' : 'primary.main',
                      color: p.is_default ? '#000000' : '#ffffff',
                      width: { xs: 48, md: 56 },
                      height: { xs: 48, md: 56 },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {p.name?.[0]?.toUpperCase() || 'I'}
                  </Avatar>
                }
                title={
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}>
                      {p.name}
                    </Typography>
                    {p.ingestion_status && (
                      <Chip
                        label={
                          p.ingestion_status === 'completed' ? 'Ready' :
                          p.ingestion_status === 'failed' ? 'Failed' :
                          (p.ingestion_progress && p.ingestion_progress.percentage >= 75) ? 'Ready' :
                          'Processing'
                        }
                        size="small"
                        sx={{
                          bgcolor: 
                            p.ingestion_status === 'completed' ? '#4caf50' :
                            p.ingestion_status === 'failed' ? '#f44336' :
                            (p.ingestion_progress && p.ingestion_progress.percentage >= 75) ? '#4caf50' :
                            'secondary.main',
                          color: 
                            (p.ingestion_progress && p.ingestion_progress.percentage < 75 && p.ingestion_status !== 'completed' && p.ingestion_status !== 'failed')
                              ? '#000000'
                              : '#ffffff',
                          fontSize: '0.7rem',
                          height: 20,
                          fontWeight: 600,
                        }}
                      />
                    )}
                    <VoiceCloneBadge profile={p} size="small" showLabel={true} />
                  </Stack>
                }
                subheader={
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      mt: 0.5
                    }}
                  >
                    {p.description || 'No description'}
                  </Typography>
                }
              />
              <CardContent sx={{ flex: 1, pt: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                  <Chip 
                    label={`${p.source_count ?? 0} Sources`} 
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  <Chip 
                    label={`${p.bead_count ?? 0} Beads`} 
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  {p.is_default && (
                    <Chip 
                      label="Default" 
                      size="small"
                      sx={{ 
                        bgcolor: 'primary.main',
                        color: '#ffffff',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                </Stack>

                {/* Ingestion Status */}
                {p.ingestion_status && 
                 p.ingestion_status !== 'completed' && 
                 p.ingestion_status !== 'failed' &&
                 (!p.ingestion_progress || p.ingestion_progress.percentage < 75) && (
                  <ProfileIngestionStatus
                    profileId={p.id}
                    onStatusChange={(status) => handleStatusChange(p.id, status)}
                  />
                )}
                
                {/* Show completion message when >= 75% */}
                {p.ingestion_status && 
                 p.ingestion_status !== 'completed' && 
                 p.ingestion_status !== 'failed' &&
                 p.ingestion_progress && 
                 p.ingestion_progress.percentage >= 75 && (
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckCircle sx={{ color: '#4caf50', fontSize: '20px' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#4caf50', fontWeight: 600 }}>
                        Profile ready! You can now analyze and generate content.
                      </Typography>
                    </Stack>
                  </Box>
                )}

                {/* Voice Clone Status Details */}
                {p.voice_clone_status && p.voice_clone_status !== 'pending' && (
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <VoiceCloneBadge profile={p} size="small" showLabel={true} />
                        {p.voice_clone_status === 'completed' && p.voice_clone_id && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            ID: {p.voice_clone_id.substring(0, 8)}...
                          </Typography>
                        )}
                      </Stack>
                      {p.voice_clone_status === 'failed' && p.voice_clone_error && (
                        <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem' }}>
                          Error: {p.voice_clone_error}
                        </Typography>
                      )}
                      {p.voice_clone_status === 'completed' && p.voice_clone_completed_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Completed: {new Date(p.voice_clone_completed_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}

                {!!(p.analyzed_from_urls?.length) && (
                  <Stack spacing={1} sx={{ mt: p.ingestion_status && p.ingestion_status !== 'completed' ? 2 : 0 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                      TikTok Links
                    </Typography>
                    {p.analyzed_from_urls!.slice(0, 2).map((url, idx)=> (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ 
                          color: 'primary.main', 
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block'
                        }}
                      >
                        {url}
                      </a>
                    ))}
                    {p.analyzed_from_urls!.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{p.analyzed_from_urls!.length - 2} more
                      </Typography>
                    )}
                  </Stack>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button 
                    size="small" 
                    startIcon={<Edit />} 
                    onClick={()=>onEdit(p)}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<Delete />} 
                    onClick={()=>onDelete(p)}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    Delete
                  </Button>
                </Stack>
                <Tooltip 
                  title={
                    p.ingestion_status && 
                    p.ingestion_status !== 'completed' && 
                    p.ingestion_status !== 'failed' && 
                    (!p.ingestion_progress || (p.ingestion_progress.percentage || 0) < 75)
                      ? `Profile processing: ${p.ingestion_progress?.percentage || 0}% complete. Analyze available at 75%+.`
                      : p.ingestion_progress && p.ingestion_progress.percentage >= 75
                      ? "Profile ready! Analyze inspiration links into sources & beads"
                      : "Analyze inspiration links into sources & beads"
                  }
                >
                  <IconButton 
                    onClick={()=>onAnalyze(p)}
                    disabled={
                      p.ingestion_status && 
                      p.ingestion_status !== 'completed' && 
                      p.ingestion_status !== 'failed' && 
                      (!p.ingestion_progress || (p.ingestion_progress.percentage || 0) < 75)
                    }
                    sx={{
                      bgcolor: 
                        (p.ingestion_progress && p.ingestion_progress.percentage >= 75) 
                          ? '#4caf50' 
                          : 'primary.main',
                      color: '#ffffff',
                      '&:hover': {
                        bgcolor: 
                          (p.ingestion_progress && p.ingestion_progress.percentage >= 75) 
                            ? '#45a049' 
                            : 'primary.dark',
                      },
                      '&:disabled': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.3)',
                      }
                    }}
                  >
                    <PlayArrow />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={open} 
        onClose={()=>setOpen(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: '#161823'
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, pb: 1 }}>
          {editing ? 'Edit Inspiration' : 'New Inspiration'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <TextField 
              label="Name" 
              value={form.name} 
              onChange={e=>setForm({...form, name:e.target.value})} 
              fullWidth 
              required
            />
            <TextField 
              label="Description" 
              value={form.description} 
              onChange={e=>setForm({...form, description:e.target.value})} 
              fullWidth 
              multiline 
              rows={2}
              placeholder="Describe this inspiration style..."
            />
            <TextField 
              label="Cover Image URL" 
              value={form.hero_image_url} 
              onChange={e=>setForm({...form, hero_image_url:e.target.value})} 
              fullWidth
              placeholder="https://..."
            />
            <TextField 
              label="TikTok Links (one per line)" 
              value={form.urls} 
              onChange={e=>setForm({...form, urls:e.target.value})} 
              fullWidth 
              multiline 
              rows={4} 
              placeholder="https://www.tiktok.com/..."
              helperText="Add TikTok URLs to analyze the style"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={()=>setOpen(false)} sx={{ minWidth: 100 }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={submit}
            sx={{ minWidth: 100 }}
          >
            {editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
