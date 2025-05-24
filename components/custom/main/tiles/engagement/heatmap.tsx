import { Box, Tooltip as MuiTooltip, useTheme } from '@mui/material'
import React from 'react'
import { TIME_SLOT_RANGES } from '@/lib/utils/engagementLogic'

// Update the type to use hours
interface HeatmapData {
  [day: number]: {
    [timeSlot: string]: number
  }
}

interface HeatmapProps {
  data?: HeatmapData
}

const timeSlots = Object.keys(TIME_SLOT_RANGES)
const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const theme = useTheme()

  const safeData = React.useMemo(() => {
    if (!data) {
      const emptyData: HeatmapData = {}
      for (let day = 0; day < 7; day++) {
        emptyData[day] = {}
        timeSlots.forEach((slot) => {
          emptyData[day][slot] = 0
        })
      }
      return emptyData
    }
    return data
  }, [data])

  const maxValue = React.useMemo(() => {
    let max = 0
    Object.values(safeData).forEach((dayData) => {
      Object.values(dayData as { [key: string]: number }).forEach((count) => {
        max = Math.max(max, count)
      })
    })
    return max
  }, [safeData])

  const getColor = (value: number) => {
    const intensity = maxValue === 0 ? 0 : value / maxValue
    return `rgba(37, 99, 235, ${intensity * 0.9 + 0.05})`
  }

  return (
    <Box
      sx={{
        display: 'flex',
        mb: 1,
        width: '70%', // Reduce overall width
        mx: 'auto', // Center horizontally
      }}
    >
      {/* Time slots label column */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          mr: 1,
          width: 70,
          mt: 3.5,
        }}
      >
        {timeSlots.map((slot) => (
          <Box
            key={slot}
            sx={{
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              fontSize: '0.65rem',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              pr: 1,
              position: 'relative',
              top: -1,
            }}
          >
            <MuiTooltip
              title={`${slot} (${
                TIME_SLOT_RANGES[slot as keyof typeof TIME_SLOT_RANGES]
              })`}
              arrow
              placement="left"
            >
              <span>{slot}</span>
            </MuiTooltip>
          </Box>
        ))}
      </Box>

      {/* Main heatmap grid */}
      <Box sx={{ flex: 1 }}>
        {/* Days of week header */}
        <Box
          sx={{
            display: 'flex',
            mb: 0.5,
            height: 20,
          }}
        >
          {daysOfWeek.map((day) => (
            <Box
              key={day}
              sx={{
                flex: 1,
                textAlign: 'center',
                fontSize: '0.65rem',
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              {day.slice(0, 1)}
            </Box>
          ))}
        </Box>

        {/* Heatmap cells */}
        {timeSlots.map((slot) => (
          <Box key={slot} sx={{ display: 'flex' }}>
            {daysOfWeek.map((_, dayIndex) => {
              const value = safeData[dayIndex]?.[slot] || 0
              return (
                <Box
                  key={dayIndex}
                  sx={{
                    flex: 1,
                    height: 24,
                    backgroundColor: getColor(value),
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      zIndex: 2,
                      boxShadow: `0 4px 12px rgba(0,0,0,0.2)`,
                    },
                  }}
                >
                  <MuiTooltip
                    title={`${daysOfWeek[dayIndex]}: ${slot} (${
                      TIME_SLOT_RANGES[slot as keyof typeof TIME_SLOT_RANGES]
                    }) - ${value} messages`}
                    arrow
                    placement="top"
                    enterDelay={200}
                    leaveDelay={0}
                    PopperProps={{
                      sx: {
                        pointerEvents: 'none',
                      },
                    }}
                  >
                    <Box sx={{ width: '100%', height: '100%' }} />
                  </MuiTooltip>
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default Heatmap
