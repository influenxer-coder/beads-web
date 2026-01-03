'use client';
import * as React from 'react';
import {
  Box, LinearProgress, Typography, Chip, Stack, Alert, Button
} from '@mui/material';
import { Error as ErrorIcon, CheckCircle, Refresh } from '@mui/icons-material';

export interface IngestionProgress {
  total_videos: number;
  videos_completed: number;
  videos_downloaded: number;
  videos_analyzed: number;
  videos_audio_processed: number;
  videos_video_processed: number;
  percentage: number;
  current_stage: string;
}

export interface IngestionStatus {
  profile_id: string;
  status: 'pending' | 'downloading' | 'analyzing' | 'processing_audio' | 'processing_video' | 'aggregating' | 'completed' | 'failed';
  progress: IngestionProgress;
  error: string | null;
  started_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
}

interface ProfileIngestionStatusProps {
  profileId: string;
  onStatusChange?: (status: IngestionStatus) => void;
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: '#9e9e9e',
    downloading: '#2196f3',
    analyzing: '#ffc107',
    processing_audio: '#ff9800',
    processing_video: '#9c27b0',
    aggregating: '#3f51b5',
    completed: '#4caf50',
    failed: '#f44336',
  };
  return colors[status] || '#9e9e9e';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Waiting to start',
    downloading: 'Downloading videos',
    analyzing: 'Analyzing audio',
    processing_audio: 'Processing voice',
    processing_video: 'Analyzing scenes',
    aggregating: 'Finalizing profile',
    completed: 'Complete',
    failed: 'Failed',
  };
  return labels[status] || status;
};

export default function ProfileIngestionStatus({ 
  profileId, 
  onStatusChange 
}: ProfileIngestionStatusProps) {
  const [status, setStatus] = React.useState<IngestionStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStatus = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/inspirations/${profileId}/status`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
      if (onStatusChange) {
        onStatusChange(data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profileId, onStatusChange]);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll every 3 seconds if status is not completed or failed
  React.useEffect(() => {
    if (!status) return;
    
    const shouldPoll = status.status !== 'completed' && status.status !== 'failed';
    
    if (shouldPoll) {
      const interval = setInterval(() => {
        fetchStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status?.status, fetchStatus]);

  if (loading && !status) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading status...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        Error loading status: {error}
      </Alert>
    );
  }

  if (!status) {
    return null;
  }

  const { progress } = status;
  const statusColor = getStatusColor(status.status);
  const isCompleted = status.status === 'completed';
  const isFailed = status.status === 'failed';

  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={2}>
        {/* Status Badge and Percentage */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            label={getStatusLabel(status.status)}
            size="small"
            sx={{
              bgcolor: statusColor,
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
            icon={
              isCompleted ? (
                <CheckCircle sx={{ color: '#ffffff !important', fontSize: '16px !important' }} />
              ) : isFailed ? (
                <ErrorIcon sx={{ color: '#ffffff !important', fontSize: '16px !important' }} />
              ) : undefined
            }
          />
          {!isCompleted && !isFailed && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {progress.percentage}%
            </Typography>
          )}
        </Stack>

        {/* Progress Bar */}
        {!isCompleted && !isFailed && (
          <Box>
            <LinearProgress
              variant="determinate"
              value={progress.percentage}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: statusColor,
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        )}

        {/* Progress Details */}
        {!isCompleted && !isFailed && (
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Stage: {getStatusLabel(status.status)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Videos: {progress.videos_completed} of {progress.total_videos} processed
            </Typography>
            {progress.total_videos > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Downloaded: {progress.videos_downloaded} • 
                Analyzed: {progress.videos_analyzed} • 
                Audio: {progress.videos_audio_processed} • 
                Video: {progress.videos_video_processed}
              </Typography>
            )}
          </Stack>
        )}

        {/* Error Message */}
        {isFailed && status.error && (
          <Alert 
            severity="error" 
            action={
              <Button 
                size="small" 
                startIcon={<Refresh />}
                onClick={fetchStatus}
                sx={{ color: '#ffffff' }}
              >
                Retry
              </Button>
            }
          >
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              {status.error}
            </Typography>
          </Alert>
        )}

        {/* Success Message */}
        {isCompleted && (
          <Alert 
            severity="success"
            icon={<CheckCircle />}
            sx={{
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              Profile processing completed successfully!
            </Typography>
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

