import React from 'react';
import { Box, Typography } from '@mui/material';

interface SensorChartProps {
  sensorId?: string;
  timeRange?: string;
}

const SensorChart: React.FC<SensorChartProps> = ({ sensorId, timeRange }) => {
  return (
    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography color="text.secondary">
        Chart for sensor {sensorId} ({timeRange}) - To be implemented
      </Typography>
    </Box>
  );
};

export default SensorChart; 