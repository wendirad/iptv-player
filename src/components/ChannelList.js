import React, { useState } from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, ListSubheader, IconButton, InputAdornment, TextField, Typography, Divider } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import SearchIcon from '@mui/icons-material/Search';
import { usePlaylistContext } from '../context/PlaylistContext';
import { usePlayerContext } from '../context/PlayerContext';
import { groupBy } from '../utils/groupBy';

export default function ChannelList() {
  const { state: playlistState, dispatch: playlistDispatch } = usePlaylistContext();
  const { dispatch: playerDispatch } = usePlayerContext();
  const [search, setSearch] = useState('');

  // Find current playlist
  const playlist = playlistState.playlists.find(p => p.id === playlistState.currentPlaylistId);
  if (!playlist) return (
    <Typography variant="body2" color="text.secondary" mt={2}>No playlist loaded.</Typography>
  );

  let channels = playlist.channels;
  if (search) {
    const s = search.toLowerCase();
    channels = channels.filter(ch =>
      ch.name.toLowerCase().includes(s) || (ch.group || '').toLowerCase().includes(s)
    );
  }
  const grouped = groupBy(channels);

  const onPlay = ch => playerDispatch({ type: 'SET_CHANNEL', channel: ch });
  const isFavorite = chId => playlistState.favorites.includes(chId);
  const onFavorite = chId => playlistDispatch({ type: 'TOGGLE_FAVORITE', channelId: chId });

  return (
    <Box mt={2}>
      <TextField
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search channels..."
        size="small"
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          )
        }}
        sx={{ mb: 1 }}
      />
      <Divider />
      {Object.keys(grouped).map(grp => (
        <List
          key={typeof grp === 'object' ? grp?.title || 'Unknown' : grp}
          dense
          subheader={
            <ListSubheader component="div">
              {typeof grp === 'string' ? grp : (grp?.title || 'Unknown')}
            </ListSubheader>
          }
        >
          {grouped[grp].map(ch => (
            <ListItem
              key={ch.index}
              button
              onClick={() => onPlay(ch)}
              selected={ch === playlistState.currentChannel}
              secondaryAction={
                <IconButton edge="end" onClick={() => onFavorite(ch.index)}>
                  {isFavorite(ch.index) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                </IconButton>
              }
            >
              <ListItemIcon>
                {ch.logo ? (
                  <img src={ch.logo} alt="logo" style={{width: 28, height: 28, borderRadius: 4}} />
                ) : <LiveTvIcon />}
              </ListItemIcon>
              <ListItemText primary={ch.name} secondary={ch.group} />
            </ListItem>
          ))}
        </List>
      ))}
    </Box>
  );
}
