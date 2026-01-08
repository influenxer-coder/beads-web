'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Typography, Card, CardContent, Stack, Box, Button, 
  TextField, IconButton, useMediaQuery, useTheme, InputAdornment
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { 
  Send,
  AttachFile, 
  QrCodeScanner,
  Close
} from '@mui/icons-material';

export const dynamic = 'force-dynamic';

export default function UploadPage(){
  const [uploading, setUploading] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [showScan, setShowScan] = React.useState(false);
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const handleSend = () => {
    if (!content.trim()) return;
    // TODO: Handle sending content to next step
    console.log('Sending content:', content);
  };

  const handleUpload = () => {
    fileRef.current?.click();
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pb: { xs: 4, md: 0 }
      }}
    >
      <Typography 
        variant="h6" 
        fontWeight={600} 
        sx={{ 
          fontSize: { xs: '1rem', md: '1.125rem' },
          mb: 4,
          color: 'text.secondary'
        }}
      >
        Create Content
      </Typography>

      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '600px', md: '700px' },
        }}
      >
        {showScan ? (
          // Scan Content View
          <Card
            sx={{
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={600}>
                    Scan Content
                  </Typography>
                  <IconButton onClick={() => setShowScan(false)} size="small">
                    <Close />
                  </IconButton>
                </Stack>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <QrCodeScanner sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Scan feature coming soon
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          // Main Create Box with Text Input
          <Card
            sx={{
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={2}>
                <TextField
                  multiline
                  rows={8}
                  fullWidth
                  placeholder="Type your content here or paste text to convert into a short story..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      }
                    }
                  }}
                />
                
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<AttachFile />}
                      onClick={handleUpload}
                      disabled={uploading}
                      size="small"
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'text.primary',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(220, 38, 38, 0.05)',
                        }
                      }}
                    >
                      Upload File
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<QrCodeScanner />}
                      onClick={() => setShowScan(true)}
                      size="small"
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'text.primary',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(220, 38, 38, 0.05)',
                        }
                      }}
                    >
                      Scan Content
                    </Button>
                  </Stack>
                  <Button
                    variant="contained"
                    endIcon={<Send />}
                    onClick={handleSend}
                    disabled={!content.trim()}
                    sx={{
                      minWidth: 120,
                    }}
                  >
                    Send
                  </Button>
                </Stack>
                
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                  disabled={uploading}
                />
                
                {uploading && (
                  <Box sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Uploading...
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
