'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { Typography, Card, CardContent, CardHeader, Button, Table, TableHead, TableBody, TableCell, TableRow, Stack } from '@mui/material';

type Doc = { id: string; title: string; url: string; type?: string };

export default function UploadPage(){
  const [docs, setDocs] = React.useState<Doc[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string|null>(null);

  const listDocs = async ()=>{
    const { data, error } = await supabase.from('documents').select('*').order('id', { ascending: false });
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
            <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Type</TableCell><TableCell>Link</TableCell></TableRow></TableHead>
            <TableBody>
              {docs.map(d=> (
                <TableRow key={d.id}>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>{d.type ?? 'PDF'}</TableCell>
                  <TableCell><a href={d.url} target="_blank" rel="noreferrer">Open</a></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
