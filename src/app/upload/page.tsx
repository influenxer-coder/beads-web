'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { Typography, Card, CardContent, CardHeader, Button, Stack, Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function UploadPage(){
  const [uploading, setUploading] = React.useState(false);
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const upload = async (file: File)=>{
    try{
      setUploading(true);
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
      alert('Document uploaded successfully! View it in the Library tab.');
      router.push('/library');
    }catch(e:any){ 
      alert(e.message || 'Failed to create content'); 
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ pb: { xs: 4, md: 0 } }}>
      <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
        Create Content
      </Typography>

      <Card
        sx={{
          borderRadius: 3,
          border: '2px dashed rgba(255, 255, 255, 0.2)',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(220, 38, 38, 0.05)',
          }
        }}
      >
        <CardHeader 
          title={
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              Upload PDF Document
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Upload a PDF document to create audio beads. Your documents will be saved in the Library.
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
            disabled={uploading}
          />
          <Button 
            variant="contained" 
            onClick={()=>fileRef.current?.click()}
            disabled={uploading}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: 200,
              py: 1.5,
              fontSize: '1rem'
            }}
          >
            {uploading ? 'Uploading...' : 'Choose PDF File'}
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, bgcolor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
            <strong>Tip:</strong> After uploading, you can view all your documents in the <strong>Library</strong> tab. 
            From there, you can regenerate scripts or open documents.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
