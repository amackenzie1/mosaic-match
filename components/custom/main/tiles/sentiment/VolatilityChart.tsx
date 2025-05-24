import { calculateVolatility } from '@/lib/utils/sentimentAnalysis'
import { Grid, Paper, Typography } from '@mui/material'
import { format, parseISO } from 'date-fns'
import React, { useCallback } from 'react'
import {
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface VolatilityChartProps {
  chartData: any[]
  user1: string
  user2: string
  theme: any
  isMobile: boolean
}

const VolatilityChart: React.FC<VolatilityChartProps> = ({
  chartData,
  user1,
  user2,
  theme,
  isMobile,
}) => {
  const renderVolatilityChart = useCallback(() => {
    const windowSize = 5
    const volatilityData = chartData.map((item, index, array) => {
      const user1Volatility = calculateVolatility(
        array
          .slice(Math.max(0, index - windowSize), index + 1)
          .map((d) => d.X_sentiment)
      )
      const user2Volatility = calculateVolatility(
        array
          .slice(Math.max(0, index - windowSize), index + 1)
          .map((d) => d.Z_sentiment)
      )
      return {
        weekStart: item.weekStart,
        [user1]: user1Volatility,
        [user2]: user2Volatility,
      }
    })

    return (
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom align="center">
            Sentiment Volatility Over Time
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={volatilityData}>
              <XAxis
                dataKey="weekStart"
                tickFormatter={(tickItem) =>
                  format(parseISO(tickItem), 'MMM d, yyyy')
                }
                interval={
                  (isMobile ? 2 : 1) * Math.ceil(volatilityData.length / 10)
                }
                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  format(parseISO(value), 'MMM d, yyyy')
                }
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={user1}
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={false}
                name={`${user1} Volatility`}
              />
              <Line
                type="monotone"
                dataKey={user2}
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
                dot={false}
                name={`${user2} Volatility`}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    )
  }, [chartData, user1, user2, theme.palette, isMobile])

  return renderVolatilityChart()
}

export default VolatilityChart
