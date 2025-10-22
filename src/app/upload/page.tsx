'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { Typography, Card, CardContent, CardHeader, Button, Table, TableHead, TableBody, TableCell, TableRow, Stack, IconButton, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

type Doc = { id: string; title: string; url: string; type?: string };

export default function UploadPage(){
  const [docs, setDocs] = React.useState<Doc[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string|null>(null);
  const [regenerating, setRegenerating] = React.useState<string|null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://beads-mvp-backend-production.up.railway.app';

  const listDocs = async ()=>{
    const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if(error){ setError(error.message); } else setDocs((data as any) ?? []);
    setLoading(false);
  };

  React.useEffect(()=>{ listDocs(); },[]);

  const fileRef = React.useRef<HTMLInputElement>(null);

  const upload = async (file: File)=>{
    try{
      const ext = file.name.split('.').pop();
      const name = `${Date.now()}.${ext}`;
      const up = await supabase.storage.from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!).upload(name, file, {
        cacheControl: '3600', upsert: true, contentType: 'application/pdf'
      });
      if(up.error) throw up.error;
      const pub = supabase.storage.from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!).getPublicUrl(name);
      const url = pub.data.publicUrl;
      const ins = await supabase.from('documents').insert({ title: file.name, url, type:'PDF' });
      if(ins.error) throw ins.error;
      await listDocs();
    }catch(e:any){ alert(e.message || 'Upload failed'); }
  };

  const regenerateScripts = async (documentId: string) => {
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
    console.log('Backend response:', result); // Debug

    if (result.success) {
      alert(`✓ Generated ${result.scripts_generated} scripts!`);
    } else {
      alert(`Error: ${JSON.stringify(result)}`); // Show full response
    }
  } catch (e: any) {
    console.error('Error:', e);
    alert('Failed to regenerate scripts: ' + e.message);
  } finally {
    setRegenerating(null);
  }
};

  return (
    <Stack spacing={2}>
      <Card>
        <CardHeader title="Upload PDF" subheader="Add a document and it will be processed into audio beads" />
        <CardContent>
          <input ref={fileRef} type="file" hidden accept="application/pdf"
            onChange={e=> e.target.files?.[0] && upload(e.target.files[0]) } />
          <Button variant="contained" onClick={()=>fileRef.current?.click()}>Choose File</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Documents" subheader="Newest first" />
        <CardContent>
          {loading && <Typography>Loading…</Typography>}
          {error && <Typography color="error">Error: {error}</Typography>}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Link</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map(d=> (
                <TableRow key={d.id}>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>{d.type ?? 'PDF'}</TableCell>
                  <TableCell><a href={d.url} target="_blank" rel="noreferrer">Open</a></TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => regenerateScripts(d.id)}
                      disabled={regenerating === d.id}
                      title="Regenerate scripts with inspiration style"
                    >
                      {regenerating === d.id ? <CircularProgress size={20} /> : <RefreshIcon />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
