import React, { createContext, useContext, useReducer } from 'react';

const PlaylistContext = createContext();

const initialState = {
  playlists: [],        // [{ id, name, channels: [], type: 'm3u|xtream', ... }]
  currentPlaylistId: null,
  favorites: [],        // channel IDs
  loading: false,
  error: null
};

function playlistReducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'SET_PLAYLISTS':
      return { ...state, playlists: action.playlists, loading: false, error: null };
    case 'SET_CURRENT_PLAYLIST':
      return { ...state, currentPlaylistId: action.id };
    case 'TOGGLE_FAVORITE': {
      const { channelId } = action;
      const favorites = state.favorites.includes(channelId)
        ? state.favorites.filter(id => id !== channelId)
        : [...state.favorites, channelId];
      return { ...state, favorites };
    }
    default:
      return state;
  }
}

export function PlaylistProvider({ children }) {
  const [state, dispatch] = useReducer(playlistReducer, initialState);
  return (
    <PlaylistContext.Provider value={{ state, dispatch }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylistContext() {
  return useContext(PlaylistContext);
}
