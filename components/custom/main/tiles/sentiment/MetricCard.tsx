import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: number;
  explanation: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, explanation, onClick }) => (
  <Grid item xs={12} md={4}>
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: 'action.hover' } : {}
      }}
      onClick={onClick}
    >
      <Typography variant="h6" gutterBottom align="center">
        {title}
      </Typography>
      <Typography variant="body1" align="center">
        {value.toFixed(2)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {explanation}
      </Typography>
    </Paper>
  </Grid>
);

export default MetricCard;