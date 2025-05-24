import { ChatMessage } from '@/lib/types'
import { startOfWeek } from 'date-fns'

/**
 * Returns the standardized weekStart date (Monday) for a given date.
 * @param date - The date string or Date object.
 * @returns The weekStart in ISO string format.
 */
export function getWeekStart(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  // time should be UTC
  return startOfWeek(dateObj, { weekStartsOn: 1 }).toISOString()
}

/**
 * Standardizes week ranges for a given array of messages.
 * @param messages - An array of chat messages.
 * @returns An object where keys are weekStart dates and values are arrays of messages for each week.
 */
export function standardizeWeeks(
  messages: ChatMessage[]
): Record<string, ChatMessage[]> {
  const weeklyMessages: Record<string, ChatMessage[]> = {}

  messages.forEach((message) => {
    const weekStart = getWeekStart(message.date)
    if (!weeklyMessages[weekStart]) {
      weeklyMessages[weekStart] = []
    }
    weeklyMessages[weekStart].push(message)
  })

  return weeklyMessages
}
