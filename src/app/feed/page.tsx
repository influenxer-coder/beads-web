'use client';
import * as React from 'react';
import { Grid2 as Grid, Card, CardContent, Typography, CardActions, Button } from '@mui/material';

type Bead = {
  id: string; author: string; title: string; content: string;
  created_at: string; audio_url: string|null;
};

export default function FeedPage(){
  const [items, setItems] = React.useState<Bead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string|null>(null);

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

  if(loading) return <Typography>Loading…</Typography>;
  if(error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Grid container spacing={2}>
      {items.map(it => (
        <Grid key={it.id} size={{ xs: 12, md: 6, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {new Date(it.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>{it.title}</Typography>
              <Typography sx={{ whiteSpace:'pre-wrap', mt: 1 }}>{it.content}</Typography>
              {it.audio_url && <audio controls src={it.audio_url} style={{ width:'100%', marginTop: 12 }} />}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
