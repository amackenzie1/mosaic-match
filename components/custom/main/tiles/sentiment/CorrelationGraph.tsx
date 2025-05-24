import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Label, ReferenceLine } from 'recharts';
import { Paper, Typography, useTheme, Button, Box } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface CorrelationGraphProps {
  data: { x: number; y: number }[];
  user1: string;
  user2: string;    
}

const CorrelationGraph: React.FC<CorrelationGraphProps> = ({ data, user1, user2 }) => {
  const theme = useTheme();
  const [isSwapped, setIsSwapped] = useState(false);

  const swappedData = useMemo(() => data.map(point => ({ x: point.y, y: point.x })), [data]);
  const currentData = isSwapped ? swappedData : data;
  const regressionLine = calculateRegressionLine(currentData);

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
  };

  const xAxisUser = isSwapped ? user2 : user1;
  const yAxisUser = isSwapped ? user1 : user2;

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} position="relative">
        <Typography variant="h6" align="center" sx={{ width: '100%' }}>
          Sentiment Correlation: {' '}
          <span style={{ color: theme.palette.primary.main }}>{user1}</span>
          {' vs '}
          <span style={{ color: theme.palette.secondary.main }}>{user2}</span>
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<SwapHorizIcon />} 
          onClick={handleSwap}
          sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
        >
          Swap Axes
        </Button>
      </Box>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
          <XAxis 
            type="number" 
            dataKey="x" 
            name={xAxisUser} 
            domain={[-10, 10]}
            tickCount={11}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          >
            <Label 
              value={`${xAxisUser}'s Sentiment`} 
              offset={-20} 
              position="insideBottom" 
              fill={isSwapped ? theme.palette.secondary.main : theme.palette.primary.main} 
            />
          </XAxis>
          <YAxis 
            type="number" 
            dataKey="y" 
            name={yAxisUser} 
            domain={[-10, 10]}
            tickCount={11}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          >
            <Label 
              value={`${yAxisUser}'s Sentiment`} 
              angle={-90} 
              position="insideLeft" 
              offset={10} 
              fill={isSwapped ? theme.palette.primary.main : theme.palette.secondary.main} 
            />
          </YAxis>
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
          <Scatter name="Sentiment" data={currentData} fill={theme.palette.primary.main} />
          <ReferenceLine
            segment={[
              { x: regressionLine[0].x, y: regressionLine[0].y },
              { x: regressionLine[1].x, y: regressionLine[1].y }
            ]}
            stroke={theme.palette.error.main}
            strokeWidth={2}
          />
          <ReferenceLine x={0} stroke={theme.palette.text.secondary} strokeWidth={1} />
          <ReferenceLine y={0} stroke={theme.palette.text.secondary} strokeWidth={1} />
        </ScatterChart>
      </ResponsiveContainer>
    </Paper>
  );
};

const calculateRegressionLine = (data: { x: number; y: number }[]) => {
  const n = data.length;
  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return [
    { x: -10, y: slope * -10 + intercept },
    { x: 10, y: slope * 10 + intercept }
  ];
};

export default CorrelationGraph;