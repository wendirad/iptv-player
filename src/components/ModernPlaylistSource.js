import React from "react";
import { Box, Paper, IconButton, InputBase, Slide, Fade } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";

export default function ModernPlaylistSource({ open, onClose, onLoad }) {
  const [url, setUrl] = React.useState('');
  const fileRef = React.useRef();
  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Box sx={{ position: 'fixed', zIndex: 240, bottom: 0, left: 0, right: 0, p: 0, m: 0 }}>
        <Paper elevation={16} sx={{ maxWidth: 410, mx: 'auto', my: 6, p: 3, bgcolor: 'rgba(16,30,55,0.991)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Fade in={open}><CloudUploadIcon style={{ fontSize: 64, color: '#20bfff' }} /></Fade>
          <Box display="flex" justifyContent="center" alignItems="center" gap={2} width="100%">
            <InputBase
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-playlist.m3u"
              sx={{ color: '#eafffc', px: 2, py:1, borderRadius: 6, flex:1, bgcolor: 'rgba(38,78,128,0.13)', fontWeight:600, fontSize:18, border: '1.5px solid #27ddfc88' }}
            />
            <IconButton color="info" onClick={() => onLoad(url)}><CloudUploadIcon /></IconButton>
          </Box>
          <Box>
            <input hidden ref={fileRef} type="file" accept=".m3u,.m3u8" onChange={e=>{
              if(!e.target.files[0])return; onLoad(e.target.files[0]);}} />
            <IconButton onClick={()=>fileRef.current?.click()} color="primary" sx={{width:64,height:64, bgcolor:'#0ee6ffc2', border:'3px solid #55e6ffc4', boxShadow:'0 2px 14px #5ed4ff70'}}>
              <CloudUploadIcon fontSize="large"/>
            </IconButton>
          </Box>
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 10, right: 10, color: '#fff8' }}><CloseIcon /></IconButton>
        </Paper>
      </Box>
    </Slide>
  );
}
