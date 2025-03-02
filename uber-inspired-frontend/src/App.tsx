import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Container, Grid, Paper, Box,
  Button, Tabs, Tab
} from "@mui/material";
import { createTheme } from "@mui/material/styles";
import ConnectWallet from "./components/ConnectWallet";
import RideSearch from "./components/RideSearch";
import DriverForm from "./components/DriverForm";
import MyRides from './pages/MyRides';

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
  const [activeTab, setActiveTab] = useState(0);
  const [userMode, setUserMode] = useState<'rider' | 'driver'>('rider');

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                CarpoolX
              </Typography>
              <Button 
                variant={userMode === 'rider' ? 'contained' : 'text'}
                onClick={() => setUserMode('rider')}
                sx={{ mr: 1 }}
              >
                Rider Mode
              </Button>
              <Button 
                variant={userMode === 'driver' ? 'contained' : 'text'}
                onClick={() => setUserMode('driver')}
                sx={{ mr: 2 }}
              >
                Driver Mode
              </Button>
              <ConnectWallet />
            </Toolbar>
          </AppBar>

          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ height: '70vh', bgcolor: 'grey.800' }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6">Interactive Map</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Real map integration coming soon...
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  {userMode === 'driver' ? (
                    <DriverForm />
                  ) : (
                    <>
                      <Tabs 
                        value={activeTab} 
                        onChange={(e, v) => setActiveTab(v)}
                        sx={{ mb: 2 }}
                      >
                        <Tab label="Search" />
                        <Tab label="My Bookings" />
                        <Tab label="History" />
                      </Tabs>
                      
                      {activeTab === 0 && <RideSearch onBookingSuccess={() => {
                        // This will trigger a refresh of MyRides when a booking is successful
                        setActiveTab(1); // Switch to My Bookings tab
                      }} />}
                      {activeTab === 1 && <MyRides showTabs={false} showOnly="upcoming" showTitle={false} />}
                      {activeTab === 2 && <MyRides showTabs={false} showOnly="past" showTitle={false} />}
                    </>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
        <Routes>
          <Route path="/" element={null} />
          <Route path="/offer-ride" element={<DriverForm />} />
          <Route path="/my-rides" element={<MyRides />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
