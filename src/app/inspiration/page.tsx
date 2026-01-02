'use client';
import * as React from 'react';
import {
  Grid2 as Grid, Card, CardContent, CardActions, CardHeader, Typography, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Chip, Avatar, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow } from '@mui/icons-material';

type Profile = {
  id: string;
  name: string;
  description?: string;
  hero_image_url?: string;
  source_count?: number;
  bead_count?: number;
  analyzed_from_urls?: string[];
  is_default?: boolean;
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
  };

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
          <CircularProgress sx={{ color: '#fe2c55' }} />
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
          <Button variant="contained" onClick={onNew} startIcon={<Add />}>
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
                      bgcolor: '#fe2c55',
                      width: { xs: 48, md: 56 },
                      height: { xs: 48, md: 56 }
                    }}
                  >
                    {p.name?.[0]?.toUpperCase() || 'I'}
                  </Avatar>
                }
                title={
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    {p.name}
                  </Typography>
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
                        bgcolor: '#fe2c55',
                        color: '#ffffff',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                </Stack>
                {!!(p.analyzed_from_urls?.length) && (
                  <Stack spacing={1}>
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
                          color: '#fe2c55', 
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
                <Tooltip title="Analyze inspiration links into sources & beads">
                  <IconButton 
                    onClick={()=>onAnalyze(p)}
                    sx={{
                      bgcolor: '#fe2c55',
                      color: '#ffffff',
                      '&:hover': {
                        bgcolor: '#e91e63',
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
