import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { ComposedChart, XAxis, YAxis, Tooltip, Bar, Line, ResponsiveContainer, Legend } from 'recharts';

interface CombinedFrequencyChartProps {
  user1Frequency: number[];
  user2Frequency: number[];
  user1: string;
  user2: string;
  maxFrequency: number;
  theme: any;
}

const CombinedFrequencyChart: React.FC<CombinedFrequencyChartProps> = ({ user1Frequency, user2Frequency, user1, user2, maxFrequency, theme }) => {
  const combinedChartData = user1Frequency.map((value, index) => ({
    score: index - 10,
    [user1]: value,
    [user2]: user2Frequency[index],
  }));

  const calculateStats = (data: number[]) => {
    const total = data.reduce((sum, value) => sum + value, 0);
    const mean = data.reduce((sum, value, index) => sum + (index - 10) * value, 0) / total;
    const variance = data.reduce((sum, value, index) => sum + Math.pow(index - 10 - mean, 2) * value, 0) / total;
    return { mean, stdDev: Math.sqrt(variance) };
  };

  const stats1 = calculateStats(user1Frequency);
  const stats2 = calculateStats(user2Frequency);

  const normalDistribution = (x: number, mean: number, stdDev: number) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };

  const normalData = combinedChartData.map((point) => ({
    ...point,
    [`${user1}Normal`]: normalDistribution(point.score, stats1.mean, stats1.stdDev) * maxFrequency,
    [`${user2}Normal`]: normalDistribution(point.score, stats2.mean, stats2.stdDev) * maxFrequency,
  }));

  return (
    <Grid item xs={12}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom align="center">
          Combined Sentiment Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={normalData}>
            <XAxis dataKey="score" />
            <YAxis domain={[0, maxFrequency]} />
            <Tooltip />
            <Legend />
            <Bar dataKey={user1} fill={theme.palette.primary.main} stackId="stack" />
            <Bar dataKey={user2} fill={theme.palette.secondary.main} stackId="stack" />
            <Line type="monotone" dataKey={`${user1}Normal`} stroke={theme.palette.primary.dark} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={`${user2}Normal`} stroke={theme.palette.secondary.dark} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>
  );
};

export default CombinedFrequencyChart;