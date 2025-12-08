import React from "react";
import { Box, IconButton, Avatar, Stack, InputBase, Paper } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SearchIcon from "@mui/icons-material/Search";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ModernPlaylistSource from './ModernPlaylistSource';

const demoChannels = [
  { name: 'Demo 1', logo: '/logo192.png', favorite: false },
  { name: 'Demo 2', logo: '/logo192.png', favorite: true },
  { name: 'Demo 3', logo: '/logo192.png', favorite: false },
  { name: 'Demo 4', logo: '/logo192.png', favorite: false },
  { name: 'Demo 5', logo: '/logo192.png', favorite: true },
];

export default function ModernChannelList({onPlaylistImport}) {
  const [channels, setChannels] = React.useState(demoChannels);
  const [search, setSearch] = React.useState("");
  const [sheet, setSheet] = React.useState(false);
  const onFavorite = idx => {
    setChannels(arr => arr.map((ch,i) => i===idx ? { ...ch, favorite: !ch.favorite } : ch));
  };
  return (
    <>
      <Box position="fixed" bottom={0} width="100vw" zIndex={99} pb={13}>
        <Box position="absolute" top={-66} left={24} zIndex={110} display="flex" alignItems="center" gap={1}>
          <IconButton color="primary" sx={{bgcolor:'#11d8ffa5'}} onClick={()=>setSheet(true)}>
            <CloudUploadIcon fontSize="large" />
          </IconButton>
          <Paper elevation={8} sx={{p:0.5,px:2,display:'flex',alignItems:'center',bgcolor:'rgba(16,28,48,0.87)',backdropFilter:'blur(8px)',borderRadius:6}}>
            <SearchIcon sx={{mr:1}} color="info" />
            <InputBase value={search} onChange={e=>setSearch(e.target.value)} placeholder="" inputProps={{'aria-label':'search'}} sx={{color:'#fff',width:120,ml:0.5,fontWeight:600}} />
          </Paper>
        </Box>
        <Box sx={{
          display:'flex', flexDirection:'row', overflowX:'auto', gap:3,
          px:6, py:2, backdropFilter:'blur(8px)',
          background:'linear-gradient(90deg, #161926ee 40%, #22334688 100%)',
          borderTopLeftRadius:30, borderTopRightRadius:30,
          boxShadow:'0 -6px 36px #12fcff20',
          scrollbarWidth:'none', msOverflowStyle:'none',
          '&::-webkit-scrollbar':{display:'none'},
          width:'100vw',
          snapType: 'x mandatory',
          scrollSnapType: 'x mandatory',
        }}>
          {channels.filter(ch => ch.name.toLowerCase().includes(search.toLowerCase())).map((ch,idx) => (
            <Box key={idx} sx={{
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end',
              minWidth:{xs:88,sm:114}, maxWidth:140, scrollSnapAlign:'center',
              transition:'box-shadow .22s',
              ':hover':{boxShadow:'0 0 22px #24e8ff80', transform:'scale(1.08)'},
            }}>
              <Avatar src={ch.logo} alt={ch.name} sx={{width:64,height:64,mb:1,border:'2px solid #d2fffc25',boxShadow:'0 2px 10px #13c6ee35',transition:'all.18s'}}/>
              <Box textAlign="center" display="flex" alignItems="center" justifyContent="center">
                <IconButton size="small" sx={{color:ch.favorite?'#24e8ff':'#fff'}} onClick={()=>onFavorite(idx)}>
                  {ch.favorite ? <FavoriteIcon/> : <FavoriteBorderIcon/>}
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <ModernPlaylistSource open={sheet} onClose={()=>setSheet(false)} onLoad={pl => {setSheet(false); if(onPlaylistImport)onPlaylistImport(pl);}}/>
    </>
  );
}
