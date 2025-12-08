import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Divider, LinearProgress } from '@mui/material';
import { usePlaylistContext } from '../context/PlaylistContext';
import { parseM3U } from '../utils/m3uParser';
import { useRetryFetch } from '../hooks/useRetryFetch';

export default function PlaylistManager() {
  const { dispatch } = usePlaylistContext();
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [loadType, setLoadType] = useState(null);
  const [showError, setShowError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Remote fetch logic
  const { data, error, loading, refetch } = useRetryFetch(url, {}, 3);

  // Handle remote playlist fetch
  const handleUrlLoad = async () => {
    if (!url) return;
    dispatch({ type: 'LOAD_START' });
    setLoadType('url');
    setShowError(null);
    await refetch();
  };

  // Effect for URL fetch success/fail
  React.useEffect(() => {
    if (loadType === 'url') {
      if (data) {
        const channels = parseM3U(data);
        dispatch({ type: 'SET_PLAYLISTS', playlists: [{ id: 'remote', name: url, channels, type: 'm3u' }] });
        dispatch({ type: 'SET_CURRENT_PLAYLIST', id: 'remote' });
      } else if (error) {
        dispatch({ type: 'LOAD_ERROR', error: error.message });
        setShowError(error.message);
      }
    }
    // eslint-disable-next-line
  }, [data, error]);

  // Handle local file
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setLocalLoading(true);
    dispatch({ type: 'LOAD_START' });
    try {
      const text = await file.text();
      const channels = parseM3U(text);
      dispatch({ type: 'SET_PLAYLISTS', playlists: [{ id: 'local', name: file.name, channels, type: 'm3u' }] });
      dispatch({ type: 'SET_CURRENT_PLAYLIST', id: 'local' });
      setShowError(null);
    } catch (err) {
      dispatch({ type: 'LOAD_ERROR', error: err.message });
      setShowError(err.message);
    }
    setLocalLoading(false);
  };

  return (
    <Box mb={2}>
      <Typography variant="h6">Load Playlist</Typography>
      <Box display="flex" gap={1} my={1}>
        <TextField
          size="small"
          label="Playlist URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          sx={{ flex: 1 }}
          autoComplete="off"
        />
        <Button variant="contained" onClick={handleUrlLoad} disabled={loading || !url}>Load</Button>
      </Box>
      <Divider sx={{ my: 1 }}>or</Divider>
      <Button variant="outlined" component="label" fullWidth>
        {fileName ? fileName : 'Choose Local File (.m3u)'}
        <input type="file" accept=".m3u,.m3u8" hidden onChange={handleFileChange} />
      </Button>
      {(loading || localLoading) && <LinearProgress sx={{ my: 1 }} />}
      {showError && (
        <Typography variant="body2" color="error" my={1}>{showError}</Typography>
      )}
    </Box>
  );
}
