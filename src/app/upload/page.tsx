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
  Slideshow
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

      {/* Input Bar */}
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
            bgcolor: 'background.paper',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            px: 2,
            py: 1.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)',
            }
          }}
        >
          {/* Plus Button */}
          <IconButton
            onClick={handleMenuClick}
            sx={{
              bgcolor: 'transparent',
              color: 'text.primary',
              p: 1,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            <Add />
          </IconButton>

          {/* Text Input */}
          <TextField
            fullWidth
            placeholder="Ask anything"
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
              }
            }}
          />

          {/* Right Side Icons */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="small"
              onClick={() => setMicMuted(!micMuted)}
              sx={{
                color: micMuted ? 'text.secondary' : 'primary.main',
                p: 1,
              }}
            >
              {micMuted ? <MicOff fontSize="small" /> : <Mic fontSize="small" />}
            </IconButton>
            <IconButton
              size="small"
              onClick={handleSend}
              disabled={!content.trim()}
              sx={{
                bgcolor: content.trim() ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                color: content.trim() ? '#ffffff' : 'text.secondary',
                p: 1,
                '&:hover': {
                  bgcolor: content.trim() ? 'primary.dark' : 'rgba(255, 255, 255, 0.15)',
                },
                '&:disabled': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <GraphicEq fontSize="small" />
            </IconButton>
          </Stack>
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
          fontWeight={600} 
          sx={{ 
            fontSize: { xs: '1.125rem', md: '1.25rem' },
            mb: 3,
            color: 'text.primary'
          }}
        >
          Most common content flows
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
                borderRadius: 3,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(220, 38, 38, 0.2)',
                  borderColor: 'primary.main',
                }
              }}
            >
              <CardMedia
                component="div"
                sx={{
                  height: { xs: 180, md: 200 },
                  background: index % 2 === 0 
                    ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #EF4444 100%)'
                    : 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #FBBF24 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
                  }
                }}
              >
                {flow.icon ? (
                  <flow.icon
                    sx={{
                      fontSize: { xs: '4rem', md: '5rem' },
                      color: index % 2 === 0 ? '#ffffff' : '#000000',
                      opacity: 0.8,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  />
                ) : (
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: { xs: '3rem', md: '4rem' },
                      fontWeight: 700,
                      color: index % 2 === 0 ? '#ffffff' : '#000000',
                      opacity: 0.3,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {index + 1}
                  </Typography>
                )}
              </CardMedia>
              <CardContent sx={{ p: 2.5 }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    mb: 1,
                  }}
                >
                  {flow.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', md: '0.9rem' },
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
