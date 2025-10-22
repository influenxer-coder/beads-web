'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Typography, Card, CardContent, CardHeader, Button, Table, TableHead, 
  TableBody, TableCell, TableRow, Stack, IconButton, CircularProgress,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

type Doc = { 
  id: string; 
  title: string; 
  url: string; 
  type?: string;
  profile_id?: string;
};

type Profile = {
  id: string;
  name: string;
  is_default: boolean;
};

export default function UploadPage(){
  const [docs, setDocs] = React.useState<Doc[]>([]);
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [regenerating, setRegenerating] = React.useState<string|null>(null);
  const [error, setError] = React.useState<string|null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://beads-mvp-backend-production.up.railway.app';

  const loadProfiles = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/profiles`);
      const data = await response.json();
      setProfiles(data.profiles || []);
      
      // Set default profile as selected
      const defaultProfile = data.profiles?.find((p: Profile) => p.is_default);
      if (defaultProfile) setSelectedProfile(defaultProfile.id);
    } catch (e) {
      console.error('Failed to load profiles:', e);
    }
  };

  const listDocs = async ()=>{
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if(error){ setError(error.message); } 
    else setDocs((data as any) ?? []);
    setLoading(false);
  };

  React.useEffect(()=>{ 
    loadProfiles();
    listDocs(); 
  },[]);

  const fileRef = React.useRef<HTMLInputElement>(null);

  const upload = async (file: File)=>{
    try{
      const ext = file.name.split('.').pop();
      const name = `${Date.now()}.${ext}`;
      const up = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
        .upload(name, file, {
          cacheControl: '3600', 
          upsert: true, 
          contentType: 'application/pdf'
        });
      if(up.error) throw up.error;

      const pub = supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
        .getPublicUrl(name);
      const url = pub.data.publicUrl;

      // Include profile_id when creating document
      const ins = await supabase.from('documents').insert({ 
        title: file.name, 
        url, 
        type:'PDF',
        profile_id: selectedProfile || null
      });
      if(ins.error) throw ins.error;

      await listDocs();
      alert('PDF uploaded! Processing will start automatically.');
    }catch(e:any){ 
      alert(e.message || 'Upload failed'); 
    }
  };

  const regenerateScripts = async (documentId: string) => {
    if (!confirm('Regenerate scripts for this document? This will use the profile style.')) return;
    
    try {
      setRegenerating(documentId);

      // Clear existing scripts
      await supabase
        .from('beads')
        .update({ script_text: null })
        .eq('document_id', documentId);

      // Regenerate with profile style
      const response = await fetch(`${BACKEND_URL}/generate-scripts/${documentId}`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        alert(`✓ Generated ${result.scripts_generated} scripts with profile style!`);
        await listDocs();
      } else {
        alert(`Error: ${result.error || 'Failed to generate scripts'}`);
      }
    } catch (e: any) {
      console.error('Error regenerating scripts:', e);
      alert('Failed to regenerate scripts');
    } finally {
      setRegenerating(null);
    }
  };

  const updateDocumentProfile = async (documentId: string, profileId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ profile_id: profileId })
        .eq('id', documentId);

      if (error) throw error;
      
      await listDocs();
      alert('Profile updated! Regenerate scripts to apply the new style.');
    } catch (e: any) {
      alert('Failed to update profile: ' + e.message);
    }
  };

  return (
    <Stack spacing={2}>
      <Card>
        <CardHeader 
          title="Upload PDF" 
          subheader="Add a document and it will be processed into audio beads" 
        />
        <CardContent>
          <Stack spacing={2}>
            {/* Profile Selector */}
            <FormControl fullWidth>
              <InputLabel>Audio Profile</InputLabel>
              <Select
                value={selectedProfile}
                label="Audio Profile"
                onChange={(e) => setSelectedProfile(e.target.value)}
              >
                {profiles.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} {p.is_default && '(Default)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Upload Button */}
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
              disabled={!selectedProfile}
            >
              Choose File
            </Button>
            {!selectedProfile && (
              <Typography variant="caption" color="error">
                Please select an audio profile first
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Documents" subheader="Newest first" />
        <CardContent>
          {loading && <CircularProgress />}
          {error && <Typography color="error">Error: {error}</Typography>}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Profile</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map(d=> {
                const docProfile = profiles.find(p => p.id === d.profile_id);
                return (
                  <TableRow key={d.id}>
                    <TableCell>{d.title}</TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={d.profile_id || ''}
                        onChange={(e) => updateDocumentProfile(d.id, e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">No Profile</MenuItem>
                        {profiles.map(p => (
                          <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>{d.type ?? 'PDF'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button 
                          size="small" 
                          href={d.url} 
                          target="_blank"
                        >
                          Open
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => regenerateScripts(d.id)}
                          disabled={regenerating === d.id || !d.profile_id}
                          title="Regenerate scripts with profile style"
                        >
                          {regenerating === d.id ? <CircularProgress size={20} /> : <RefreshIcon />}
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
