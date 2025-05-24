import { clsx, type ClassValue } from 'clsx'
import { startOfWeek } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
