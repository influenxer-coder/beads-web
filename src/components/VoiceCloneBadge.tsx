'use client';
import * as React from 'react';
import { Chip, Tooltip, Box, CircularProgress } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, HourglassEmpty, Mic } from '@mui/icons-material';

export type VoiceCloneStatus = 'pending' | 'cloning' | 'completed' | 'failed';

export interface VoiceCloneInfo {
  voice_clone_id?: string | null;
  voice_clone_status?: VoiceCloneStatus;
  voice_clone_error?: string | null;
  voice_clone_started_at?: string | null;
  voice_clone_completed_at?: string | null;
  has_voice_clone?: boolean;
  voice_status?: {
    status: string;
    voice_id: string;
    voice_name: string;
    ready: boolean;
  };
}

interface VoiceCloneBadgeProps {
  profile: VoiceCloneInfo;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

const getStatusColor = (status?: VoiceCloneStatus): string => {
  const colors: Record<string, string> = {
    completed: '#4caf50',
    cloning: '#2196f3',
    pending: '#9e9e9e',
    failed: '#f44336',
  };
  return colors[status || 'pending'] || '#9e9e9e';
};

const getStatusLabel = (status?: VoiceCloneStatus): string => {
  const labels: Record<string, string> = {
    completed: 'Voice Cloned',
    cloning: 'Cloning Voice...',
    pending: 'No Voice Clone',
    failed: 'Clone Failed',
  };
  return labels[status || 'pending'] || 'Unknown';
};

const getStatusIcon = (status?: VoiceCloneStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle sx={{ fontSize: '16px !important' }} />;
    case 'cloning':
      return <CircularProgress size={14} sx={{ color: '#ffffff' }} />;
    case 'failed':
      return <ErrorIcon sx={{ fontSize: '16px !important' }} />;
    case 'pending':
      return <HourglassEmpty sx={{ fontSize: '16px !important' }} />;
    default:
      return <Mic sx={{ fontSize: '16px !important' }} />;
  }
};

const getTooltipText = (profile: VoiceCloneInfo): string => {
  const status = profile.voice_clone_status;
  
  switch (status) {
    case 'completed':
      return 'This profile has a cloned voice available for audio generation';
    case 'cloning':
      return 'Voice cloning in progress. This may take a few minutes.';
    case 'pending':
      return 'Voice cloning will start automatically when profile completes (≥75% success rate)';
    case 'failed':
      return profile.voice_clone_error 
        ? `Clone failed: ${profile.voice_clone_error}`
        : 'Voice cloning failed. Click to retry.';
    default:
      return 'Voice clone status unknown';
  }
};

export default function VoiceCloneBadge({ 
  profile, 
  size = 'small',
  showLabel = true 
}: VoiceCloneBadgeProps) {
  const status = profile.voice_clone_status || 'pending';
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  const tooltipText = getTooltipText(profile);

  // Don't show badge if pending and showLabel is false
  if (status === 'pending' && !showLabel) {
    return null;
  }

  return (
    <Tooltip title={tooltipText} arrow>
      <Chip
        icon={getStatusIcon(status)}
        label={showLabel ? statusLabel : ''}
        size={size}
        sx={{
          bgcolor: statusColor,
          color: '#ffffff',
          fontWeight: 600,
          fontSize: size === 'small' ? '0.7rem' : '0.75rem',
          height: size === 'small' ? 20 : 24,
          '& .MuiChip-icon': {
            color: '#ffffff !important',
          },
          cursor: 'pointer',
        }}
      />
    </Tooltip>
  );
}

