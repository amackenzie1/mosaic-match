import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { ComposedChart, XAxis, YAxis, Tooltip, Bar, Line, ResponsiveContainer } from 'recharts';

interface FrequencyChartProps {
  data: number[];
  color: string;
  userName: string;
  maxFrequency: number;
  theme: any;
}

const gaussianKernel = (x: number, mean: number, bandwidth: number) => {
  const z = (x - mean) / bandwidth;
  return Math.exp(-0.5 * z * z) / (bandwidth * Math.sqrt(2 * Math.PI));
};

const FrequencyChart: React.FC<FrequencyChartProps> = ({ data, color, userName, maxFrequency, theme }) => {
  const chartData = data.map((value, index) => ({
    score: index - 10,
    frequency: value,
  }));

  const totalFrequency = chartData.reduce((sum, point) => sum + point.frequency, 0);
  const mean = chartData.reduce((sum, point) => sum + point.score * point.frequency, 0) / totalFrequency;
  const variance = chartData.reduce((sum, point) => sum + Math.pow(point.score - mean, 2) * point.frequency, 0) / totalFrequency;
  const stdDev = Math.sqrt(variance);

  const bandwidth = 0.9 * Math.min(stdDev, (chartData[chartData.length - 1].score - chartData[0].score) / 1.34) * Math.pow(totalFrequency, -0.2);

  const kdeData = chartData.map((point) => {
    const density = chartData.reduce((sum, dataPoint) => sum + gaussianKernel(point.score, dataPoint.score, bandwidth) * dataPoint.frequency, 0) / totalFrequency;
    return {
      ...point,
      density: density * totalFrequency,
    };
  });

  return (
    <Grid item xs={12} md={6}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom align="center">
          {userName}'s Sentiment Prediction
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={kdeData}>
            <XAxis dataKey="score" />
            <YAxis domain={[0, maxFrequency]} />
            <Tooltip />
            <Bar dataKey="frequency" fill={color} />
            <Line type="monotone" dataKey="density" stroke={theme.palette.text.primary} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>
  );
};

export default FrequencyChart;