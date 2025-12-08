import React, { createContext, useContext, useReducer } from 'react';

const PlayerContext = createContext();

const initialState = {
  currentChannel: null,      // { ...channelObject }
  isPlaying: false,
  playbackStats: null,       // { bitrate, resolution, ... }
  error: null,
};

function playerReducer(state, action) {
  switch (action.type) {
    case 'SET_CHANNEL':
      return { ...state, currentChannel: action.channel, isPlaying: true, error: null };
    case 'STOP_CHANNEL':
      return { ...state, currentChannel: null, isPlaying: false };
    case 'UPDATE_STATS':
      return { ...state, playbackStats: action.stats };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  return (
    <PlayerContext.Provider value={{ state, dispatch }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext() {
  return useContext(PlayerContext);
}
