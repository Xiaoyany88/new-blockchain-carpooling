import React from "react";
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Container, Grid, Paper, Box } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import ConnectWallet from "./components/ConnectWallet";
import RideBooking from "./components/RideBooking";
import Rating from "./components/Rating";
import PaymentStatus from "./components/PaymentStatus";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#276EF1',
    },
    secondary: {
      main: '#16D5A9',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              CarpoolX
            </Typography>
            <ConnectWallet />
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 400,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }}
              >
                {/* Map placeholder */}
                <Box sx={{ height: '100%', bgcolor: 'grey.800', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ p: 2 }}>Map View</Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }}
              >
                <RideBooking />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }}
              >
                <Rating />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }}
              >
                <PaymentStatus />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
