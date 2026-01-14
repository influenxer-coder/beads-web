'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Typography, Box, TextField, IconButton, 
  Menu, MenuItem, ListItemIcon, ListItemText, Stack,
  Card, CardContent, CardMedia, useMediaQuery, useTheme,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, LinearProgress, Avatar
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
  Search,
  CameraAlt
} from '@mui/icons-material';

export const dynamic = 'force-dynamic';


const contentFlows: ContentFlow[] = [
  {
    id: 'book-page',
    title: 'Scan a book page into a story',
    description: 'Transform book pages into engaging stories',
    icon: MenuBook,
    category: 'books',
  },
  {
    id: 'book-summary',
    title: 'Book chapter summary',
    description: 'Create concise summaries from book chapters',
    icon: MenuBook,
    category: 'books',
  },
  {
    id: 'research-paper',
    title: 'A research paper into set of stories',
    description: 'Convert research papers into multiple story formats',
    icon: Article,
    category: 'research',
  },
  {
    id: 'research-summary',
    title: 'Research paper summary',
    description: 'Summarize research papers into key insights',
    icon: Article,
    category: 'research',
  },
  {
    id: 'founder-video',
    title: 'Script to a founder style video',
    description: 'Turn scripts into founder-style video content',
    icon: Person,
    category: 'workplace',
  },
  {
    id: 'pitch-video',
    title: 'Slide deck into a 30 sec pitch video',
    description: 'Transform slide decks into concise pitch videos',
    icon: Slideshow,
    category: 'workplace',
  },
  {
    id: 'meeting-notes',
    title: 'Meeting notes to action items',
    description: 'Convert meeting notes into actionable tasks',
    icon: Article,
    category: 'workplace',
  },
  {
    id: 'presentation',
    title: 'Document to presentation',
    description: 'Transform documents into presentation slides',
    icon: Slideshow,
    category: 'workplace',
  },
];

type ContentFlow = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  icon?: React.ComponentType;
  category?: 'books' | 'workplace' | 'research';
};

type Inspiration = {
  id: string;
  name: string;
  description?: string;
  hero_image_url?: string;
  is_default?: boolean;
};

export default function UploadPage(){
  const [uploading, setUploading] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [micMuted, setMicMuted] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [inspirationDialogOpen, setInspirationDialogOpen] = React.useState(false);
  const [selectedFlow, setSelectedFlow] = React.useState<ContentFlow | null>(null);
  const [selectedInspiration, setSelectedInspiration] = React.useState<Inspiration | null>(null);
  const [inspirations, setInspirations] = React.useState<Inspiration[]>([]);
  const [loadingInspirations, setLoadingInspirations] = React.useState(false);
  const [processingFile, setProcessingFile] = React.useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<'camera' | 'file' | null>(null);
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const open = Boolean(anchorEl);

  const filteredFlows = React.useMemo(() => {
    if (activeTab === 'all') return contentFlows;
    return contentFlows.filter(flow => flow.category === activeTab);
  }, [activeTab]);

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

  const loadInspirations = React.useCallback(async () => {
    setLoadingInspirations(true);
    try {
      const r = await fetch('/api/inspirations');
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      const profiles = d.profiles ?? [];
      // Filter only completed inspirations
      const completed = profiles.filter((p: any) => 
        p.ingestion_status === 'completed' || 
        (p.ingestion_progress && p.ingestion_progress.percentage >= 75)
      );
      setInspirations(completed);
    } catch (e: any) {
      console.error('Failed to load inspirations:', e);
      setInspirations([]);
    } finally {
      setLoadingInspirations(false);
    }
  }, []);

  const handleFlowClick = (flow: ContentFlow) => {
    if (flow.id === 'book-page') {
      setSelectedFlow(flow);
      setUploadDialogOpen(true);
    } else {
      // TODO: Handle other flow selections
      console.log('Selected flow:', flow);
    }
  };

  const handleDialogClose = () => {
    setUploadDialogOpen(false);
    setSelectedFlow(null);
  };

  const handleInspirationDialogClose = () => {
    setInspirationDialogOpen(false);
    setSelectedInspiration(null);
    setPendingAction(null);
  };

  const handleOpenCamera = () => {
    handleDialogClose();
    setPendingAction('camera');
    loadInspirations();
    setInspirationDialogOpen(true);
  };

  const handleOpenFileUpload = () => {
    handleDialogClose();
    setPendingAction('file');
    loadInspirations();
    setInspirationDialogOpen(true);
  };

  const handleInspirationSelect = (inspiration: Inspiration) => {
    setSelectedInspiration(inspiration);
    handleInspirationDialogClose();
    // Trigger the appropriate input based on pending action
    if (pendingAction === 'camera') {
      setTimeout(() => cameraRef.current?.click(), 100);
    } else if (pendingAction === 'file') {
      setTimeout(() => fileRef.current?.click(), 100);
    }
    setPendingAction(null);
  };

  const processPageImage = async (file: File, inspirationId: string) => {
    try {
      setProcessingProgress(true);
      setProcessingFile(file);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('inspiration_id', inspirationId);

      const response = await fetch('/api/process-page-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to process page image');
      }

      const data = await response.json();
      alert('Bead generated successfully! View it in the Library tab.');
      router.push('/library');
    } catch (e: any) {
      alert(e.message || 'Failed to process page image');
    } finally {
      setProcessingProgress(false);
      setProcessingFile(null);
      setSelectedInspiration(null);
      // Reset inputs
      if (cameraRef.current) cameraRef.current.value = '';
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedInspiration) {
      processPageImage(file, selectedInspiration.id);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedInspiration) {
      processPageImage(file, selectedInspiration.id);
    }
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
      {/* Search Bar */}
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '600px', md: '700px' },
          mx: 'auto',
          mb: 4,
          position: 'relative'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
            px: 3,
            py: 2,
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.25)',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            },
            '&:focus-within': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
            }
          }}
        >
          <Search 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '1.5rem',
              flexShrink: 0
            }} 
          />
          <TextField
            fullWidth
            placeholder="Search content workflows..."
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
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                }
              }
            }}
          />
        </Box>

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
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <input
          ref={cameraRef}
          type="file"
          hidden
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          disabled={uploading}
        />
      </Box>

      {/* Horizontal Tabs */}
      <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '1200px' }, mx: 'auto', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'none',
              fontSize: '0.9375rem',
              fontWeight: 400,
              minHeight: 48,
              px: 2,
              '&.Mui-selected': {
                color: '#ffffff',
                fontWeight: 500,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#ffffff',
              height: 2,
            },
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" value="all" />
          <Tab label="Books" value="books" />
          <Tab label="Workplace" value="workplace" />
          <Tab label="Research" value="research" />
        </Tabs>
      </Box>

      {/* Content Workflow Cards Grid */}
      <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '1200px' }, mx: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2,
            pb: 1,
          }}
        >
          {filteredFlows.map((flow) => (
            <Card
              key={flow.id}
              onClick={() => handleFlowClick(flow)}
              sx={{
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }
              }}
            >
              <CardMedia
                component="div"
                sx={{
                  height: { xs: 140, md: 160 },
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {flow.icon && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      color: 'rgba(255, 255, 255, 0.8)',
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
                )}
              </CardMedia>
              <CardContent sx={{ p: 1.5, bgcolor: 'transparent', '&:last-child': { pb: 1.5 } }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8125rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 1.4,
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {flow.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {flow.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleDialogClose}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 3,
            minWidth: { xs: '90%', sm: '400px' },
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.25rem', pb: 1 }}>
          {selectedFlow?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose how you'd like to add your book page:
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CameraAlt />}
              onClick={handleOpenCamera}
              sx={{
                py: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(220, 38, 38, 0.08)',
                }
              }}
            >
              Open Camera
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AttachFile />}
              onClick={handleOpenFileUpload}
              sx={{
                py: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(220, 38, 38, 0.08)',
                }
              }}
            >
              Upload File
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleDialogClose} sx={{ minWidth: 100 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inspiration Selection Dialog */}
      <Dialog
        open={inspirationDialogOpen}
        onClose={handleInspirationDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.25rem', pb: 1 }}>
          Select Inspiration Style
        </DialogTitle>
        <DialogContent>
          {loadingInspirations ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : inspirations.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No inspirations available. Please create one in the Inspiration tab.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 2,
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 4,
                }
              }}
            >
              {inspirations.map((inspiration) => (
                <Card
                  key={inspiration.id}
                  onClick={() => handleInspirationSelect(inspiration)}
                  sx={{
                    minWidth: { xs: 200, sm: 240 },
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 120,
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundImage: inspiration.hero_image_url ? `url(${inspiration.hero_image_url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {!inspiration.hero_image_url && (
                      <Avatar
                        sx={{
                          bgcolor: inspiration.is_default ? 'secondary.main' : 'primary.main',
                          color: inspiration.is_default ? '#000000' : '#ffffff',
                          width: 56,
                          height: 56,
                          fontSize: '1.5rem',
                        }}
                      >
                        {inspiration.name?.[0]?.toUpperCase() || 'I'}
                      </Avatar>
                    )}
                  </CardMedia>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {inspiration.name}
                    </Typography>
                    {inspiration.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {inspiration.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleInspirationDialogClose} sx={{ minWidth: 100 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Processing Progress Indicator */}
      {processingProgress && processingFile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: 'background.paper',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            p: 2,
            minWidth: 300,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1300,
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Generating bead...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {processingFile.name}
            </Typography>
            <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
          </Stack>
        </Box>
      )}
    </Box>
  );
}
