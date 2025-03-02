import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Paper } from '@mui/material';
import { testContractIntegration } from '../utils/contractTest';
import { forceCompleteRide, advanceBlockchainTime, testRateDriver } from '../utils/testHelpers';

const ContractDebugger: React.FC = () => {
  const [rideId, setRideId] = useState("");
  const [result, setResult] = useState("");

  const runIntegrationTest = async () => {
    setResult("Running integration test...");
    const success = await testContractIntegration();
    setResult(success ? "Integration test passed!" : "Integration test failed!");
  };

  const completeRide = async () => {
    if (!rideId) {
      setResult("Please enter a ride ID");
      return;
    }
    
    setResult(`Completing ride ${rideId}...`);
    try {
      await forceCompleteRide(parseInt(rideId));
      setResult(`Ride ${rideId} completed successfully!`);
    } catch (error) {
      setResult(`Error completing ride: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>Contract Debugger</Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={runIntegrationTest} sx={{ mr: 1 }}>
          Test Contract Integration
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField 
          label="Ride ID" 
          value={rideId} 
          onChange={(e) => setRideId(e.target.value)}
          size="small"
          sx={{ mr: 1, width: 100 }}
        />
        <Button variant="outlined" onClick={completeRide}>
          Force Complete Ride
        </Button>
      </Box>

      {result && (
        <Typography color={result.includes("failed") || result.includes("Error") ? "error" : "primary"}>
          {result}
        </Typography>
      )}
    </Paper>
  );
};

export default ContractDebugger;
