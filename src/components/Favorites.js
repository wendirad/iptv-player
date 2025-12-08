import React from 'react';
import { usePlaylistContext } from '../context/PlaylistContext';
import { usePlayerContext } from '../context/PlayerContext';
import { Box, List, ListItem, ListItemIcon, ListItemText, IconButton, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LiveTvIcon from '@mui/icons-material/LiveTv';

export default function Favorites() {
  const { state: playlistState, dispatch } = usePlaylistContext();
  const { dispatch: playerDispatch } = usePlayerContext();

  const playlist = playlistState.playlists.find(p => p.id === playlistState.currentPlaylistId);
  if (!playlist || !playlistState.favorites.length) return null;

  const favChannels = playlist.channels.filter(ch => playlistState.favorites.includes(ch.index));
  if (!favChannels.length) return null;

  return (
    <Box mt={2} mb={1}>
      <Typography variant="subtitle1">Favorites</Typography>
      <List dense>
        {favChannels.map(ch => (
          <ListItem
            key={ch.index}
            button
            onClick={() => playerDispatch({ type: 'SET_CHANNEL', channel: ch })}
            secondaryAction={
              <IconButton edge="end" onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', channelId: ch.index })}>
                <FavoriteIcon color="error" />
              </IconButton>
            }
          >
            <ListItemIcon>{ch.logo ? <img src={ch.logo} alt="logo" style={{width: 24, height: 24, borderRadius: 4}} /> : <LiveTvIcon />}</ListItemIcon>
            <ListItemText primary={ch.name} secondary={ch.group} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
