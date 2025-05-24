import { MajorEventType } from '@/lib/utils/sentimentAnalysis'

export interface TimelineBaseProps {
  events: MajorEventType[]
  chatCategories: Record<string, string>
  chatNames: Record<string, string>
  chatUsers: Record<string, Array<{ username: string; name: string }>>
  minDate: number
  maxDate: number
  onViewModeChange?: () => void
}

export interface ProcessedEvent extends MajorEventType {
  size: number
  category: string
  eventUsers: Array<{ username: string; name: string }>
  chatName: string
  date: number
  position: number
}

export interface CategoryFilter {
  [key: string]: boolean
}

export interface TimelineLayoutProps extends TimelineBaseProps {
  isVertical?: boolean
  onLayoutChange?: (isVertical: boolean) => void
  dateRange?: [number, number]
}
