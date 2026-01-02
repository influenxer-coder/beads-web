'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { Typography, Card, CardContent, CardHeader, Button, Table, TableHead, TableBody, TableCell, TableRow, Stack, IconButton, CircularProgress, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export const dynamic = 'force-dynamic';

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
    <Stack spacing={3} sx={{ pb: { xs: 4, md: 0 } }}>
      <Card
        sx={{
          borderRadius: 3,
          border: '2px dashed rgba(255, 255, 255, 0.2)',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: '#fe2c55',
            backgroundColor: 'rgba(254, 44, 85, 0.05)',
          }
        }}
      >
        <CardHeader 
          title={
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              Upload PDF
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Add a document and it will be processed into audio beads
            </Typography>
          }
        />
        <CardContent>
          <input 
            ref={fileRef} 
            type="file" 
            hidden 
            accept="application/pdf"
            onChange={e=> e.target.files?.[0] && upload(e.target.files[0]) } 
          />
          <Button 
            variant="contained" 
            onClick={()=>fileRef.current?.click()}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: 200,
              py: 1.5,
              fontSize: '1rem'
            }}
          >
            Choose PDF File
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardHeader 
          title={
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              Documents
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Newest first
            </Typography>
          }
        />
        <CardContent>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#fe2c55' }} />
            </Box>
          )}
          {error && (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)', mb: 2 }}>
              <Typography color="error">Error: {error}</Typography>
            </Box>
          )}
          {!loading && !error && docs.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                No documents yet
              </Typography>
              <Button variant="contained" onClick={()=>fileRef.current?.click()}>
                Upload Your First Document
              </Button>
            </Box>
          )}
          {!loading && docs.length > 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', md: '0.9rem' } }}>
                      Title
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', md: '0.9rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', md: '0.9rem' } }}>
                      Link
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', md: '0.9rem' } }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {docs.map(d=> (
                    <TableRow key={d.id}>
                      <TableCell sx={{ fontSize: { xs: '0.875rem', md: '0.9rem' } }}>
                        <Typography 
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: { xs: 150, sm: 300 }
                          }}
                        >
                          {d.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.875rem', md: '0.9rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                        {d.type ?? 'PDF'}
                      </TableCell>
                      <TableCell>
                        <Button
                          component="a"
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          size="small"
                          sx={{ 
                            color: '#fe2c55',
                            textTransform: 'none',
                            fontSize: { xs: '0.8rem', md: '0.875rem' }
                          }}
                        >
                          Open
                        </Button>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => regenerateScripts(d.id)}
                          disabled={regenerating === d.id}
                          title="Regenerate scripts with inspiration style"
                          sx={{
                            color: '#fe2c55',
                            '&:hover': {
                              bgcolor: 'rgba(254, 44, 85, 0.1)',
                            },
                            '&:disabled': {
                              color: 'rgba(255, 255, 255, 0.3)',
                            }
                          }}
                        >
                          {regenerating === d.id ? (
                            <CircularProgress size={20} sx={{ color: '#fe2c55' }} />
                          ) : (
                            <RefreshIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
