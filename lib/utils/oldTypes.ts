import { MajorEventType, SentimentResponseComplete } from './sentimentAnalysis'

export interface ChatMessage {
  user: string
  message: string
  date: Date
  index: number // Add this line
}

export type MessageExtra = {
  sentiment: number
}

export type GeneralInfo = {
  parsedData: ChatMessage[]
  users?: string[]
  token?: string | null
  hash?: string | null
  file?: File | null
}

export interface SentimentData {
  sentiments: SentimentResponseComplete[]
  allMajorEvents: MajorEventType[]
}

// Add this to your existing types
export interface ChatUser {
  username: string
  name: string
  isMe: boolean
  edited: boolean
}

export interface DashboardUser {
  username: string
  name: string
}
