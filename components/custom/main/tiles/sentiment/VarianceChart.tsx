import React from 'react';
import { Paper, Typography, useTheme } from '@mui/material';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea } from 'recharts';
import { format, parseISO } from 'date-fns';

interface DataPoint {
  weekStart: string;
  [key: string]: string | number;
}

interface VarianceChartProps {
  data: DataPoint[];
  user: string;
  userKey: string;
  color: string;  // New prop for user color
}

const VarianceChart: React.FC<VarianceChartProps> = ({ data, user, userKey, color }) => {
  const theme = useTheme();

  const meanSentiment = data.reduce((sum, item) => sum + (item[userKey] as number), 0) / data.length;

  const renderReferenceAreas = () => {
    return data.map((entry, index) => (
      <ReferenceArea
        key={`ref-area-${index}`}
        x1={entry.weekStart}
        x2={entry.weekStart}
        y1={meanSentiment}
        y2={entry[userKey] as number}
        stroke={color}
        strokeOpacity={0.3}
        strokeDasharray="3 3"
      />
    ));
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" align="center" gutterBottom>
        Sentiment Variance for{' '}
        <span style={{ color: color }}>
          {user}
        </span>
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="weekStart" 
            tickFormatter={(tickItem) => format(parseISO(tickItem), 'MMM d, yyyy')}
          />
          <YAxis domain={[-10, 10]} />
          <Tooltip
            labelFormatter={(value) => format(parseISO(value), 'MMM d, yyyy')}
            formatter={(value: number) => [value.toFixed(2), 'Sentiment']}
          />
          <ReferenceLine y={meanSentiment} stroke={theme.palette.error.main} strokeWidth={2} />
          {renderReferenceAreas()}
          <Line 
            type="monotone" 
            dataKey={userKey} 
            stroke={color}
            dot={{ fill: color, r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default VarianceChart;