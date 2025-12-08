import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8ecdff',
    },
    secondary: {
      main: '#f057a5',
    },
    background: {
      default: 'linear-gradient(135deg, #181c23 0%, #292d3e 100%)',
      paper: 'rgba(28,32,44,0.98)',
    },
    error: { main: '#ff5978' },
    warning: { main: '#ffc85c' },
    info: { main: '#4ebabd' },
    success: { main: '#7dd87d' },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: 'Inter, system-ui, "Segoe UI", Arial, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 700,
    fontWeightBold: 900,
    h3: { fontWeight: 900, letterSpacing: 1, fontSize: '2.5rem' },
    h6: { fontWeight: 600 }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'rgba(28,32,44,0.98)',
          backdropFilter: 'blur(6px)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(20,24,42,0.97)',
          boxShadow: '0 2px 20px 0 #181c23a8',
          color: '#fff',
        },
      },
    },
  },
});

export default theme;
