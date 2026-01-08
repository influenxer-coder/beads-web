'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Typography, Card, CardContent, Stack, Box, Button, 
  TextField, IconButton, useMediaQuery, useTheme
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { 
  Description, 
  Keyboard, 
  QrCodeScanner,
  ArrowForward,
  Close
} from '@mui/icons-material';

export const dynamic = 'force-dynamic';

type CreateOption = 'type' | 'upload' | 'scan';

export default function UploadPage(){
  const [uploading, setUploading] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<CreateOption | null>(null);
  const [content, setContent] = React.useState('');
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

  const handleOptionSelect = (option: CreateOption) => {
    setSelectedOption(option);
    if (option === 'upload') {
      fileRef.current?.click();
    }
  };

  const handleBack = () => {
    setSelectedOption(null);
    setContent('');
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
        {!selectedOption ? (
          // Step 1: Select creation method
          <Card
            sx={{
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    textAlign: 'center',
                    mb: 1
                  }}
                >
                  What would you like to create?
                </Typography>

                <Stack spacing={2}>
                  {/* Type Content Option */}
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(220, 38, 38, 0.05)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                      }
                    }}
                    onClick={() => handleOptionSelect('type')}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Keyboard sx={{ fontSize: 28, color: '#ffffff' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                            Type Content
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Write or paste your content directly
                          </Typography>
                        </Box>
                        <ArrowForward sx={{ color: 'text.secondary' }} />
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Upload File Option */}
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(220, 38, 38, 0.05)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                      }
                    }}
                    onClick={() => handleOptionSelect('upload')}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            bgcolor: 'secondary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Description sx={{ fontSize: 28, color: '#000000' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                            Upload File
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Upload a PDF document to process
                          </Typography>
                        </Box>
                        <ArrowForward sx={{ color: 'text.secondary' }} />
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Scan Content Option */}
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(220, 38, 38, 0.05)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                      }
                    }}
                    onClick={() => handleOptionSelect('scan')}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <QrCodeScanner sx={{ fontSize: 28, color: '#ffffff' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                            Scan Content
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Scan content to convert into a short story
                          </Typography>
                        </Box>
                        <ArrowForward sx={{ color: 'text.secondary' }} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ) : selectedOption === 'type' ? (
          // Step 2: Type content
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
                    Type Your Content
                  </Typography>
                  <IconButton onClick={handleBack} size="small">
                    <Close />
                  </IconButton>
                </Stack>
                <TextField
                  multiline
                  rows={12}
                  fullWidth
                  placeholder="Start typing or paste your content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1rem',
                      lineHeight: 1.6,
                    }
                  }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={!content.trim()}
                  sx={{ py: 1.5 }}
                >
                  Continue
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : selectedOption === 'upload' ? (
          // Step 2: Upload file (handled by file input)
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
                    Upload Document
                  </Typography>
                  <IconButton onClick={handleBack} size="small">
                    <Close />
                  </IconButton>
                </Stack>
                <Box
                  sx={{
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(220, 38, 38, 0.05)',
                    }
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                    Click to upload PDF
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or drag and drop
                  </Typography>
                </Box>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                  disabled={uploading}
                />
                {uploading && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Uploading...
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        ) : (
          // Step 2: Scan content
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
                  <IconButton onClick={handleBack} size="small">
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
        )}
      </Box>
    </Box>
  );
}
