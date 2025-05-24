import { Grid, Paper, Typography } from '@mui/material'
import { format, parseISO } from 'date-fns'
import React, { useCallback } from 'react'
import {
  Area,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import regression from 'regression'

interface SentimentOverTimeChartProps {
  chartData: any[]
  user1: string
  user2: string
  theme: any
  isMobile: boolean
}

const SentimentOverTimeChart: React.FC<SentimentOverTimeChartProps> = ({
  chartData,
  user1,
  user2,
  theme,
  isMobile,
}) => {
  const renderSentimentOverTime = useCallback(() => {
    const sentimentData = chartData.map((item, index) => ({
      weekStart: item.weekStart,
      [user1]: item.X_sentiment,
      [user2]: item.Z_sentiment,
      total: item.X_sentiment + item.Z_sentiment,
      index: index,
    }))

    const regressionData: [number, number][] = sentimentData.map((item) => [
      item.index,
      item.total,
    ])
    const result = regression.linear(regressionData)
    const trendLine = sentimentData.map((item, index) => ({
      weekStart: item.weekStart,
      trend: result.predict(index)[1],
    }))

    return (
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom align="center">
            Combined Sentiment Over Time
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={sentimentData}>
              <XAxis
                dataKey="weekStart"
                tickFormatter={(tickItem) =>
                  format(parseISO(tickItem), 'MMM d, yyyy')
                }
                interval={
                  (isMobile ? 2 : 1) * Math.ceil(sentimentData.length / 10)
                }
                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              />
              <YAxis domain={[-10, 10]} />
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
              <Area
                type="monotone"
                dataKey={user1}
                stackId="1"
                stroke={theme.palette.primary.main}
                fill={theme.palette.primary.main}
              />
              <Area
                type="monotone"
                dataKey={user2}
                stackId="1"
                stroke={theme.palette.secondary.main}
                fill={theme.palette.secondary.main}
              />
              <Line
                type="linear"
                dataKey="trend"
                data={trendLine}
                stroke={theme.palette.error.main}
                strokeWidth={2}
                dot={false}
                name="Trend Line"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    )
  }, [chartData, user1, user2, isMobile])

  return renderSentimentOverTime()
}

export default SentimentOverTimeChart
