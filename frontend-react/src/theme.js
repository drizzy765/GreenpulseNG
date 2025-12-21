import { createTheme } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0F8A5F' }, // GREENPULSENG brand green
    secondary: { main: '#2AB673' },
    background: { default: '#F7FAF8', paper: '#FFFFFF' },
    error: { main: '#D32F2F' },
    warning: { main: '#ED6C02' },
    info: { main: '#0288D1' },
    success: { main: '#2E7D32' },
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: 'none', borderBottom: '1px solid #e5e7eb' } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRight: '1px solid #e5e7eb' } },
    },
    MuiButton: {
      defaultProps: { variant: 'contained' },
    },
  },
})

export default theme