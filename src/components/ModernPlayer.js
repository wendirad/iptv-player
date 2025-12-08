import React from "react";
import { Box, IconButton, Stack, Avatar, Slider } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

const DEMO_STREAM = "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8";

export default function ModernPlayer() {
  const [playing, setPlaying] = React.useState(false);
  const videoRef = React.useRef();

  React.useEffect(() => {
    if (!videoRef.current) return;
    playing ? videoRef.current.play() : videoRef.current.pause();
  }, [playing]);

  return (
    <Box
      position="relative"
      width="100vw"
      minHeight="60vh"
      maxHeight="90vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background: 'linear-gradient(120deg,#101722 0%, #20344c 100%)',
        boxShadow: 'none',
        overflow: 'hidden',
        borderRadius: 0,
        m: 0, p: 0,
        flex: 1,
      }}
    >
      <video
        ref={videoRef}
        src={DEMO_STREAM}
        style={{
          width: '100vw',
          minHeight: '60vh',
          maxHeight: '90vh',
          objectFit: 'cover',
          filter: 'brightness(0.93) saturate(1.3) grayscale(0.08)',
          zIndex: 1,
        }}
        onClick={() => setPlaying(!playing)}
        controls={false}
      />
      <Box sx={{
        position: 'absolute', top: 24, left: 24,
        zIndex: 10,
        backdropFilter: 'blur(6px)',
        borderRadius: 3,
        bgcolor: 'rgba(24,34,50,0.34)',
        boxShadow: '0 0 12px 0 #14e8ff33',
        p: 0.5
      }}>
        <Avatar src="/logo192.png" alt="profile" sx={{ width: 48, height: 48, bgcolor: '#121e29cc', border: '2px solid #28d6fc88', boxShadow: 2 }} />
      </Box>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{
        position: 'absolute', bottom: 44, left: 0, right: 0,
        bgcolor: 'rgba(17,27,50,0.55)',
        borderRadius: 4,
        mx: 'auto', px: 5, py: 2,
        width: { xs: '100vw', md: 700 },
        zIndex: 20,
        boxShadow: '0 8px 40px #20cbd933',
        backdropFilter: 'blur(12px)',
        gap: 2,
      }}>
        <IconButton color="primary" sx={{color:'#aeefff'}}><SkipPreviousIcon fontSize="large" /></IconButton>
        <IconButton color="info" sx={{color:'#2fd7ff'}} onClick={() => setPlaying(!playing)}>
          {playing ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
        </IconButton>
        <IconButton color="primary" sx={{color:'#aeefff'}}><SkipNextIcon fontSize="large" /></IconButton>
        <Slider defaultValue={80} aria-label="Volume" color="info" sx={{ width:120, mx:2, color:'#60eaff' }} />
        <IconButton color="primary" sx={{color:'#65cefa'}}><VolumeUpIcon fontSize="medium" /></IconButton>
        <Box flex={1} />
        <IconButton color="info" sx={{color:'#00eaff', bgcolor:'#141e2f99','&:hover':{bgcolor:'#163346d9'}}}>
          <FullscreenIcon fontSize="large" />
        </IconButton>
      </Stack>
      <Box sx={{position:'absolute', inset:0, zIndex:0, background: 'radial-gradient(circle at 60% 40%, #22375680 0%, transparent 70%)'}} />
    </Box>
  );
}
