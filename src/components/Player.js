import React, { useEffect, useRef } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { usePlayerContext } from '../context/PlayerContext';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Hls from 'hls.js';

const defaultOptions = {
  autoplay: true,
  controls: true,
  responsive: true,
  fluid: true,
  playbackRates: [0.5, 1, 1.25, 1.5, 2],
};

export default function Player() {
  const videoNode = useRef(null);
  const playerRef = useRef(null);
  const { state, dispatch } = usePlayerContext();

  useEffect(() => {
    if (!videoNode.current) return;
    if (!state.currentChannel) return;
    let player = playerRef.current;
    // Init Video.js if not present
    if (!player) {
      player = videojs(videoNode.current, defaultOptions, () => {
        // Extra plugins/events (pip, skip, stats, etc.)
      });
      playerRef.current = player;
    }
    // Source handling
    player.pause();
    player.src({
      src: state.currentChannel.url,
      type: state.currentChannel.url.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
    });
    player.play();
    // Error reporting
    player.on('error', () => {
      dispatch({ type: 'SET_ERROR', error: player.error() });
    });
    // Clean-up on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [state.currentChannel, dispatch]);

  if (!state.currentChannel) {
    return (
      <Box minHeight={320} display="flex" alignItems="center" justifyContent="center">
        <Typography variant="h6" color="text.secondary">Load and select a channel to play</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <div data-vjs-player>
        <video ref={videoNode} className="video-js vjs-big-play-centered" />
      </div>
      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
        <Typography variant="subtitle2">{state.currentChannel.name}</Typography>
        {/* Could add: stats overlay toggle, PiP, skip, etc. */}
        {state.error && (
          <Typography color="error" ml={2}>{state.error.message || 'Playback error'}</Typography>
        )}
      </Stack>
    </Box>
  );
}
