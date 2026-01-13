'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Typography, Box, Button, TextField, IconButton, 
  Menu, MenuItem, ListItemIcon, ListItemText, Stack,
  useMediaQuery, useTheme
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { 
  Add,
  AttachFile, 
  Mic,
  MicOff,
  GraphicEq
} from '@mui/icons-material';

export const dynamic = 'force-dynamic';

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

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pb: { xs: 4, md: 0 },
        px: { xs: 2, md: 3 }
      }}
    >
      <Typography 
        variant="h6" 
        fontWeight={400} 
        sx={{ 
          fontSize: { xs: '1rem', md: '1.125rem' },
          mb: 6,
          color: 'text.secondary',
          textAlign: 'center'
        }}
      >
        Ready when you are.
      </Typography>

      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '600px', md: '700px' },
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
    </Box>
  );
}
