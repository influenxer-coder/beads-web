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
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>Inspiration</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={onNew}>New Inspiration</Button>
      </Stack>

      {loading && <Typography>Loading…</Typography>}
      {error && <Typography color="error">Error: {error}</Typography>}

      <Grid container spacing={2}>
        {items.map(p => (
          <Grid key={p.id} size={{ xs:12, md:6, lg:4 }}>
            <Card>
              <CardHeader
                avatar={<Avatar src={p.hero_image_url} alt={p.name}>{p.name?.[0]}</Avatar>}
                title={<Typography variant="h6">{p.name}</Typography>}
                subheader={<Typography variant="body2" color="text.secondary">{p.description}</Typography>}
              />
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip label={`Sources ${p.source_count ?? 0}`} size="small" />
                  <Chip label={`Beads ${p.bead_count ?? 0}`} size="small" />
                  {p.is_default && <Chip color="secondary" label="Default" size="small" />}
                </Stack>
                {!!(p.analyzed_from_urls?.length) && (
                  <Stack mt={2} spacing={1}>
                    <Typography variant="subtitle2">Links</Typography>
                    {p.analyzed_from_urls!.map((url, idx)=> (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', fontSize: 14 }}>
                        {url}
                      </a>
                    ))}
                  </Stack>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent:'space-between' }}>
                <Stack direction="row" spacing={1}>
                  <Button size="small" startIcon={<Edit />} onClick={()=>onEdit(p)}>Edit</Button>
                  <Button size="small" color="error" startIcon={<Delete />} onClick={()=>onDelete(p)}>Delete</Button>
                </Stack>
                <Tooltip title="Analyze inspiration links into sources & beads">
                  <IconButton onClick={()=>onAnalyze(p)}>
                    <PlayArrow />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Inspiration' : 'New Inspiration'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} fullWidth />
            <TextField label="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} fullWidth multiline rows={2} />
            <TextField label="Cover Image URL" value={form.hero_image_url} onChange={e=>setForm({...form, hero_image_url:e.target.value})} fullWidth />
            <TextField label="Links (one per line)" value={form.urls} onChange={e=>setForm({...form, urls:e.target.value})} fullWidth multiline rows={4} placeholder="https://www.tiktok.com/..." />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>{editing ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
