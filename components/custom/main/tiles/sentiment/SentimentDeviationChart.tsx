import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useTheme, useMediaQuery, Paper, Typography, Grid } from '@mui/material';

interface SentimentDeviationChartProps {
  chartData: any[];
  users?: string[];
}

const SentimentDeviationChart: React.FC<SentimentDeviationChartProps> = ({ chartData, users }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [user1, user2] = users || ['User 1', 'User 2'];

  const processedData = useMemo(() => {
    const user1Data = chartData.map(item => ({
      weekStart: item.weekStart,
      sentiment: item.X_sentiment
    }));
    const user2Data = chartData.map(item => ({
      weekStart: item.weekStart,
      sentiment: item.Z_sentiment
    }));

    const user1Mean = user1Data.reduce((sum, item) => sum + item.sentiment, 0) / user1Data.length;
    const user2Mean = user2Data.reduce((sum, item) => sum + item.sentiment, 0) / user2Data.length;

    const user1DeviationData = user1Data.map(item => ({
      weekStart: item.weekStart,
      deviation: item.sentiment - user1Mean,
      mean: user1Mean
    }));
    const user2DeviationData = user2Data.map(item => ({
      weekStart: item.weekStart,
      deviation: item.sentiment - user2Mean,
      mean: user2Mean
    }));

    return {
      user1: { data: user1DeviationData, mean: user1Mean },
      user2: { data: user2DeviationData, mean: user2Mean }
    };
  }, [chartData]);

  const renderChart = (userData: { data: any[], mean: number }, userName: string, color: string) => (
    <Grid item xs={12} md={6} key={userName}>
      <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom align="center">
          {userName} Sentiment Deviation from Mean
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={userData.data}>
            <XAxis
              dataKey="weekStart"
              tickFormatter={(tickItem) => format(parseISO(tickItem), 'MMM d')}
              interval={(isMobile ? 2 : 1) * Math.ceil(userData.data.length / 10)}
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip
              labelFormatter={(value) => format(parseISO(value), 'MMM d, yyyy')}
              formatter={(value: number, name: string) => [
                value.toFixed(2),
                name === 'deviation' ? 'Deviation' : 'Mean'
              ]}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
            <Legend />
            <ReferenceLine y={0} stroke={theme.palette.text.secondary} strokeDasharray="3 3" />
            <Bar dataKey="deviation" fill={color} name={`${userName} Deviation`} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>
  );

  return (
    <Grid container spacing={2}>
      {renderChart(processedData.user1, user1, theme.palette.primary.main)}
      {renderChart(processedData.user2, user2, theme.palette.secondary.main)}
    </Grid>
  );
};

export default SentimentDeviationChart;