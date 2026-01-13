'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Typography, Box, TextField, IconButton, 
  Menu, MenuItem, ListItemIcon, ListItemText, Stack,
  Card, CardContent, CardMedia, useMediaQuery, useTheme
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { 
  Add,
  AttachFile, 
  Mic,
  MicOff,
  GraphicEq,
  MenuBook,
  Article,
  Person,
  Slideshow,
  Search
} from '@mui/icons-material';

export const dynamic = 'force-dynamic';

type ContentFlow = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  icon?: React.ComponentType;
};

const contentFlows: ContentFlow[] = [
  {
    id: 'book-page',
    title: 'Scan a book page into a story',
    description: 'Transform book pages into engaging stories',
    icon: MenuBook,
  },
  {
    id: 'research-paper',
    title: 'A research paper into set of stories',
    description: 'Convert research papers into multiple story formats',
    icon: Article,
  },
  {
    id: 'founder-video',
    title: 'Script to a founder style video',
    description: 'Turn scripts into founder-style video content',
    icon: Person,
  },
  {
    id: 'pitch-video',
    title: 'Slide deck into a 30 sec pitch video',
    description: 'Transform slide decks into concise pitch videos',
    icon: Slideshow,
  },
];

export default function UploadPage(){
  const [uploading, setUploading] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [micMuted, setMicMuted] = React.useState(true);
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const open = Boolean(anchorEl);

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
      setAnchorEl(null);
    }
  };

  const handleSend = () => {
    if (!content.trim()) return;
    // TODO: Handle sending content to next step
    console.log('Sending content:', content);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUploadFile = () => {
    handleMenuClose();
    fileRef.current?.click();
  };

  const handleFlowClick = (flow: ContentFlow) => {
    // TODO: Handle flow selection
    console.log('Selected flow:', flow);
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        pb: { xs: 4, md: 0 },
        px: { xs: 2, md: 3 }
      }}
    >
      <Typography 
        variant="h5" 
        fontWeight={400} 
        sx={{ 
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          mb: 4,
          color: 'text.primary',
          textAlign: 'center'
        }}
      >
        Let's create memorable stories from your content.
      </Typography>

      {/* AI Content Templates Search Bar */}
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '600px', md: '700px' },
          mx: 'auto',
          mb: 6,
          position: 'relative'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            px: 2,
            py: 1.5,
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
            },
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.15)',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
            }
          }}
        >
          {/* Search Icon */}
          <Search 
            sx={{ 
              color: 'text.secondary',
              fontSize: '1.25rem',
              flexShrink: 0
            }} 
          />

          {/* Text Input */}
          <TextField
            fullWidth
            placeholder="Search AI content templates..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            variant="standard"
            InputProps={{
              disableUnderline: true,
            }}
            sx={{
              flex: 1,
              '& .MuiInputBase-input': {
                fontSize: '1rem',
                py: 0.5,
                color: 'text.primary',
                '&::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.7,
                }
              }
            }}
          />
        </Box>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 220,
              bgcolor: 'background.paper',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }
          }}
        >
          <MenuItem onClick={handleUploadFile}>
            <ListItemIcon>
              <AttachFile fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add photos & files</ListItemText>
          </MenuItem>
        </Menu>

        <input
          ref={fileRef}
          type="file"
          hidden
          accept="application/pdf,image/*"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          disabled={uploading}
        />
      </Box>

      {/* Content Flows Carousel */}
      <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '1200px' }, mx: 'auto' }}>
        <Typography 
          variant="h6" 
          fontWeight={400} 
          sx={{ 
            fontSize: { xs: '1.125rem', md: '1.25rem' },
            mb: 3,
            color: 'text.primary',
            textAlign: 'center'
          }}
        >
          Most common content templates
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
            }
          }}
        >
          {contentFlows.map((flow, index) => (
            <Card
              key={flow.id}
              onClick={() => handleFlowClick(flow)}
              sx={{
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                bgcolor: '#000000',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                }
              }}
            >
              <CardMedia
                component="div"
                sx={{
                  height: { xs: 180, md: 200 },
                  bgcolor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {flow.icon ? (
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: { xs: '4rem', md: '5rem' },
                      color: '#000000',
                      '& svg': {
                        fontSize: 'inherit',
                        color: 'inherit',
                        width: '1em',
                        height: '1em',
                      }
                    }}
                  >
                    <flow.icon />
                  </Box>
                ) : (
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: { xs: '3rem', md: '4rem' },
                      fontWeight: 400,
                      color: '#000000',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {index + 1}
                  </Typography>
                )}
              </CardMedia>
              <CardContent sx={{ p: 2.5, bgcolor: '#000000' }}>
                <Typography
                  variant="h6"
                  fontWeight={400}
                  sx={{
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    mb: 1,
                    color: '#ffffff',
                  }}
                >
                  {flow.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.875rem', md: '0.9rem' },
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {flow.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
