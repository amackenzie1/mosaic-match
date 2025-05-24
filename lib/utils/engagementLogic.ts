import { addWeeks, getDay, getHours, parseISO } from 'date-fns'
import { z } from 'zod'
import { getWeekStart } from '../utils'
import { ChatMessage } from '@/lib/types'

// Define the schemas for type safety
export const ChartDataSchema = z.object({
  weekStart: z.string(),
  numMessages: z.record(z.string(), z.number()),
  numWords: z.record(z.string(), z.number()),
})

export const MessageDistributionSchema = z.object({
  userId: z.string(),
  messageCount: z.number(),
  percentage: z.number(),
})

export const HeatmapDataSchema = z.record(
  z.number(),
  z.record(z.string(), z.number())
)

export const EngagementDataSchema = z.object({
  chartData: z.array(ChartDataSchema),
  persons: z.array(z.string()),
  distribution: z.array(MessageDistributionSchema),
  heatmapData: HeatmapDataSchema.optional(),
})

// Export types from schemas
export type ChartData = z.infer<typeof ChartDataSchema>
export type MessageDistribution = z.infer<typeof MessageDistributionSchema>
export type HeatmapData = z.infer<typeof HeatmapDataSchema>
export type EngagementData = z.infer<typeof EngagementDataSchema>

const TIME_RANGES = {
  'Early Hours': '12am-5am',
  Dawn: '5am-9am',
  'Mid Day': '9am-1pm',
  Afternoon: '1pm-5pm',
  Evening: '5pm-8pm',
  Night: '8pm-12am',
} as const

const getTimeSlot = (hour: number): keyof typeof TIME_RANGES => {
  if (hour >= 5 && hour < 9) return 'Dawn'
  if (hour >= 9 && hour < 13) return 'Mid Day'
  if (hour >= 13 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 20) return 'Evening'
  if (hour >= 20 && hour < 24) return 'Night'
  return 'Early Hours'
}

// Internal processing function
export const processEngagementData = async (
  parsedData: ChatMessage[]
): Promise<EngagementData> => {
  const weeklyData: {
    [key: string]: {
      numMessages: { [key: string]: number }
      numWords: { [key: string]: number }
    }
  } = {}
  const personSet: Set<string> = new Set()
  const userCounts = new Map<string, number>()
  const totalMessages = parsedData.length

  // Initialize heatmap data with time slots
  const heatmapData: HeatmapData = {}
  for (let day = 0; day < 7; day++) {
    heatmapData[day] = {
      'Early Hours': 0,
      Dawn: 0,
      'Mid Day': 0,
      Afternoon: 0,
      Evening: 0,
      Night: 0,
    }
  }

  parsedData.forEach((message) => {
    const weekStart = getWeekStart(message.date)
    const wordCount = message.message.split(/\s+/).length
    personSet.add(message.user)

    if (!weeklyData[weekStart]) {
      weeklyData[weekStart] = {
        numMessages: {},
        numWords: {},
      }
    }
    weeklyData[weekStart].numMessages[message.user] =
      (weeklyData[weekStart].numMessages[message.user] || 0) + 1
    weeklyData[weekStart].numWords[message.user] =
      (weeklyData[weekStart].numWords[message.user] || 0) + wordCount

    userCounts.set(message.user, (userCounts.get(message.user) || 0) + 1)

    const date = new Date(message.date)
    const dayOfWeek = getDay(date)
    const hour = getHours(date)
    const timeSlot = getTimeSlot(hour)
    heatmapData[dayOfWeek][timeSlot]++
  })

  const weeks = Object.keys(weeklyData).sort()
  const firstWeek = parseISO(weeks[0])
  const lastWeek = parseISO(weeks[weeks.length - 1])
  const allWeeks: string[] = []
  let currentWeek = firstWeek

  while (currentWeek <= lastWeek) {
    allWeeks.push(getWeekStart(currentWeek))
    currentWeek = addWeeks(currentWeek, 1)
  }

  const filledData = allWeeks.map((weekStart) => {
    const weekData: ChartData = {
      weekStart,
      numMessages: {},
      numWords: {},
    }
    personSet.forEach((person) => {
      weekData.numMessages[person] =
        weeklyData[weekStart]?.numMessages[person] || 0
      weekData.numWords[person] = weeklyData[weekStart]?.numWords[person] || 0
    })
    return weekData
  })

  const distribution = Array.from(userCounts.entries()).map(
    ([userId, messageCount]) => ({
      userId,
      messageCount,
      percentage: (messageCount / totalMessages) * 100,
    })
  )

  return {
    chartData: filledData,
    persons: Array.from(personSet),
    distribution,
    heatmapData,
  }
}

// Export for use in the Heatmap component
export const TIME_SLOT_RANGES = TIME_RANGES
