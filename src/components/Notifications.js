import React from 'react';
import { usePlaylistContext } from '../context/PlaylistContext';
import { usePlayerContext } from '../context/PlayerContext';
import { Alert } from '@mui/material';

export default function Notifications() {
  const { state: playlistState } = usePlaylistContext();
  const { state: playerState } = usePlayerContext();

  if (playlistState.error) {
    return <Alert severity="error">{playlistState.error}</Alert>;
  }
  if (playerState.error) {
    return <Alert severity="error">{playerState.error.message || 'Playback error'}</Alert>;
  }
  if (playlistState.loading) {
    return <Alert severity="info">Loading playlist...</Alert>;
  }
  return null;
}
